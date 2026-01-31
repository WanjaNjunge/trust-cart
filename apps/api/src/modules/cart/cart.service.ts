import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AddToCartDto, UpdateCartItemDto, CartResponse, CartItemResponse } from './dto';

@Injectable()
export class CartService {
  // Guest cart expires in 24 hours, logged-in cart in 7 days
  private readonly GUEST_CART_EXPIRY_HOURS = 24;
  private readonly USER_CART_EXPIRY_DAYS = 7;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create a cart for user or guest session
   */
  async getOrCreateCart(userId?: string, sessionId?: string): Promise<CartResponse> {
    let cart = await this.findCart(userId, sessionId);

    if (!cart) {
      cart = await this.createCart(userId, sessionId);
    }

    return this.formatCartResponse(cart);
  }

  /**
   * Find existing cart by userId or sessionId
   */
  private async findCart(userId?: string, sessionId?: string) {
    if (userId) {
      return this.prisma.cart.findFirst({
        where: { userId },
        include: this.getCartInclude(),
      });
    }

    if (sessionId) {
      return this.prisma.cart.findFirst({
        where: {
          sessionId,
          expiresAt: { gt: new Date() },
        },
        include: this.getCartInclude(),
      });
    }

    return null;
  }

  /**
   * Create a new cart
   */
  private async createCart(userId?: string, sessionId?: string) {
    const expiresAt = userId
      ? null
      : new Date(Date.now() + this.GUEST_CART_EXPIRY_HOURS * 60 * 60 * 1000);

    return this.prisma.cart.create({
      data: {
        userId,
        sessionId: userId ? undefined : sessionId,
        expiresAt,
      },
      include: this.getCartInclude(),
    });
  }

  /**
   * Add item to cart with stock validation
   */
  async addItem(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: AddToCartDto,
  ): Promise<CartResponse> {
    const { productId, quantity } = dto;

    // Get product with inventory
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { inventoryRecord: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check stock availability
    const inventory = product.inventoryRecord;
    if (!inventory) {
      throw new ConflictException('INSUFFICIENT_STOCK');
    }

    const availableStock = inventory.quantityOnHand - inventory.quantityReserved;
    if (quantity > availableStock) {
      throw new ConflictException('INSUFFICIENT_STOCK');
    }

    // Get or create cart
    let cart = await this.findCart(userId, sessionId);
    if (!cart) {
      cart = await this.createCart(userId, sessionId);
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        throw new ConflictException('INSUFFICIENT_STOCK');
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });

      // Update reservation
      await this.updateReservation(cart.id, productId, quantity);
    } else {
      // Create new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          priceAtAdd: product.price,
        },
      });

      // Create reservation
      await this.createReservation(cart.id, productId, quantity, userId);
    }

    // Refresh cart
    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.getCartInclude(),
    });

    return this.formatCartResponse(updatedCart!);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    const { quantity } = dto;

    const cart = await this.findCart(userId, sessionId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Get inventory for stock check
    const inventory = await this.prisma.inventoryRecord.findUnique({
      where: { productId: item.productId },
    });

    if (!inventory) {
      throw new ConflictException('INSUFFICIENT_STOCK');
    }

    const availableStock = inventory.quantityOnHand - inventory.quantityReserved + item.quantity;
    if (quantity > availableStock) {
      throw new ConflictException('INSUFFICIENT_STOCK');
    }

    // Update item
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Update reservation
    const quantityDiff = quantity - item.quantity;
    if (quantityDiff !== 0) {
      await this.updateReservation(cart.id, item.productId, quantityDiff);
    }

    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.getCartInclude(),
    });

    return this.formatCartResponse(updatedCart!);
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.findCart(userId, sessionId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Release reservation
    await this.releaseReservation(cart.id, item.productId, item.quantity);

    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.getCartInclude(),
    });

    return this.formatCartResponse(updatedCart!);
  }

  /**
   * Apply promo code to cart
   */
  async applyPromoCode(
    userId: string | undefined,
    sessionId: string | undefined,
    code: string,
  ): Promise<CartResponse> {
    const cart = await this.findCart(userId, sessionId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Find promo code
    const promoCode = await this.prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        startsAt: { lte: new Date() },
        expiresAt: { gte: new Date() },
      },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!promoCode) {
      throw new BadRequestException('Invalid or expired promo code');
    }

    // Check usage limit
    if (promoCode.maxUsageTotal && promoCode._count.usages >= promoCode.maxUsageTotal) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    // Check minimum order value
    const subtotal = this.calculateSubtotal(cart.items);
    if (promoCode.minOrderValue && subtotal < promoCode.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of KES ${promoCode.minOrderValue / 100} required`,
      );
    }

    // Apply promo code
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { promoCodeId: promoCode.id },
    });

    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.getCartInclude(),
    });

    return this.formatCartResponse(updatedCart!);
  }

  /**
   * Remove promo code from cart
   */
  async removePromoCode(
    userId: string | undefined,
    sessionId: string | undefined,
  ): Promise<CartResponse> {
    const cart = await this.findCart(userId, sessionId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { promoCodeId: null },
    });

    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.getCartInclude(),
    });

    return this.formatCartResponse(updatedCart!);
  }

  /**
   * Merge guest cart into user cart on login
   */
  async mergeCartsOnLogin(userId: string, sessionId: string): Promise<void> {
    const guestCart = await this.findCart(undefined, sessionId);
    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await this.findCart(userId, undefined);
    if (!userCart) {
      // Just reassign guest cart to user
      await this.prisma.cart.update({
        where: { id: guestCart.id },
        data: {
          userId,
          sessionId: null,
          expiresAt: null,
        },
      });
      return;
    }

    // Merge items - keep higher quantity
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find((item) => item.productId === guestItem.productId);

      if (existingItem) {
        const newQuantity = Math.max(existingItem.quantity, guestItem.quantity);
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
            priceAtAdd: guestItem.priceAtAdd,
          },
        });
      }
    }

    // Delete guest cart
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
  }

  // ============================================
  // Private helper methods
  // ============================================

  private getCartInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      promoCode: true,
    };
  }

  private calculateSubtotal(items: { quantity: number; priceAtAdd: number }[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.priceAtAdd, 0);
  }

  private calculateDiscount(
    subtotal: number,
    promoCode?: { discountType: string; discountValue: number } | null,
  ): number {
    if (!promoCode) return 0;

    switch (promoCode.discountType) {
      case 'PERCENT':
        return Math.floor((subtotal * promoCode.discountValue) / 100);
      case 'FIXED':
        return Math.min(promoCode.discountValue, subtotal);
      default:
        return 0;
    }
  }

  private formatCartResponse(cart: {
    id: string;
    expiresAt: Date | null;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      priceAtAdd: number;
      product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        images: Array<{ url: string; altText: string | null }>;
      };
    }>;
    promoCode?: {
      code: string;
      discountType: string;
      discountValue: number;
    } | null;
  }): CartResponse {
    const items: CartItemResponse[] = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        primaryImage: item.product.images[0]
          ? {
              url: item.product.images[0].url,
              altText: item.product.images[0].altText || '',
            }
          : undefined,
      },
      quantity: item.quantity,
      priceAtAdd: item.priceAtAdd,
      lineTotal: item.quantity * item.priceAtAdd,
    }));

    const subtotal = this.calculateSubtotal(cart.items);
    const discount = this.calculateDiscount(subtotal, cart.promoCode);
    const total = subtotal - discount;

    return {
      id: cart.id,
      items,
      promoCode: cart.promoCode
        ? {
            code: cart.promoCode.code,
            discountType: cart.promoCode.discountType,
            discountValue: cart.promoCode.discountValue,
          }
        : undefined,
      subtotal,
      discount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      expiresAt: cart.expiresAt?.toISOString(),
    };
  }

  private async createReservation(
    cartId: string,
    productId: string,
    quantity: number,
    userId?: string,
  ): Promise<void> {
    const expiresAt = userId
      ? new Date(Date.now() + this.USER_CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + this.GUEST_CART_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.reservation.create({
        data: {
          productId,
          cartId,
          quantity,
          status: 'PENDING',
          expiresAt,
        },
      }),
      this.prisma.inventoryRecord.update({
        where: { productId },
        data: {
          quantityReserved: { increment: quantity },
        },
      }),
    ]);
  }

  private async updateReservation(
    cartId: string,
    productId: string,
    quantityDiff: number,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findFirst({
      where: { cartId, productId, status: 'PENDING' },
    });

    if (reservation) {
      await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id: reservation.id },
          data: { quantity: { increment: quantityDiff } },
        }),
        this.prisma.inventoryRecord.update({
          where: { productId },
          data: { quantityReserved: { increment: quantityDiff } },
        }),
      ]);
    } else if (quantityDiff > 0) {
      // Create new reservation only if adding
      await this.createReservation(cartId, productId, quantityDiff);
    }
  }

  private async releaseReservation(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findFirst({
      where: { cartId, productId, status: 'PENDING' },
    });

    if (reservation) {
      await this.prisma.$transaction([
        this.prisma.reservation.delete({ where: { id: reservation.id } }),
        this.prisma.inventoryRecord.update({
          where: { productId },
          data: { quantityReserved: { decrement: quantity } },
        }),
      ]);
    }
  }
}
