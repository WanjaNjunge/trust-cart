import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, ApplyPromoCodeDto } from './dto';
import { OptionalJwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { UserRole } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-session-id') sessionId: string,
  ) {
    return this.cartService.getOrCreateCart(user?.id, sessionId);
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async addItem(
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-session-id') sessionId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addItem(user?.id, sessionId, dto);
  }

  @Patch('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async updateItem(
    @Param('id') itemId: string,
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-session-id') sessionId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user?.id, sessionId, itemId, dto);
  }

  @Delete('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  async removeItem(
    @Param('id') itemId: string,
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-session-id') sessionId: string,
  ) {
    return this.cartService.removeItem(user?.id, sessionId, itemId);
  }

  @Post('promo')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply promo code' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Promo code applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid promo code' })
  async applyPromoCode(
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-session-id') sessionId: string,
    @Body() dto: ApplyPromoCodeDto,
  ) {
    return this.cartService.applyPromoCode(user?.id, sessionId, dto.code);
  }

  @Delete('promo')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove promo code' })
  @ApiHeader({ name: 'X-Session-ID', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, description: 'Promo code removed successfully' })
  async removePromoCode(
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-session-id') sessionId: string,
  ) {
    return this.cartService.removePromoCode(user?.id, sessionId);
  }
}
