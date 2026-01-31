import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get current user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAddresses(@CurrentUser() user: AuthUser) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.id, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(@CurrentUser() user: AuthUser, @Param('id') addressId: string) {
    return this.usersService.deleteAddress(user.id, addressId);
  }

  @Post('me/addresses/:id/default')
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Default address set successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultAddress(@CurrentUser() user: AuthUser, @Param('id') addressId: string) {
    return this.usersService.setDefaultAddress(user.id, addressId);
  }
}
