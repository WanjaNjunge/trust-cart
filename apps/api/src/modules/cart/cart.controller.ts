import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, ApplyPromoCodeDto } from './dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: 'Bearer token for authenticated users',
  })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(
    @Headers('x-session-id') sessionId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserIdFromToken(authHeader);
    return this.cartService.getOrCreateCart(userId, sessionId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async addItem(
    @Headers('x-session-id') sessionId: string,
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: AddToCartDto,
  ) {
    const userId = this.extractUserIdFromToken(authHeader);
    return this.cartService.addItem(userId, sessionId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async updateItem(
    @Param('id') itemId: string,
    @Headers('x-session-id') sessionId: string,
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = this.extractUserIdFromToken(authHeader);
    return this.cartService.updateItem(userId, sessionId, itemId, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  async removeItem(
    @Param('id') itemId: string,
    @Headers('x-session-id') sessionId: string,
    @Headers('authorization') authHeader: string | undefined,
  ) {
    const userId = this.extractUserIdFromToken(authHeader);
    return this.cartService.removeItem(userId, sessionId, itemId);
  }

  @Post('promo')
  @ApiOperation({ summary: 'Apply promo code' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Promo code applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid promo code' })
  async applyPromoCode(
    @Headers('x-session-id') sessionId: string,
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: ApplyPromoCodeDto,
  ) {
    const userId = this.extractUserIdFromToken(authHeader);
    return this.cartService.applyPromoCode(userId, sessionId, dto.code);
  }

  @Delete('promo')
  @ApiOperation({ summary: 'Remove promo code' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Promo code removed successfully' })
  async removePromoCode(
    @Headers('x-session-id') sessionId: string,
    @Headers('authorization') authHeader: string | undefined,
  ) {
    const userId = this.extractUserIdFromToken(authHeader);
    return this.cartService.removePromoCode(userId, sessionId);
  }

  /**
   * Extract user ID from JWT token (simple extraction without full validation)
   */
  private extractUserIdFromToken(authHeader?: string): string | undefined {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const token = authHeader.substring(7);
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return undefined;
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
