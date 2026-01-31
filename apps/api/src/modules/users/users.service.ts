import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // If setting as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        recipientName: dto.recipientName,
        phone: dto.phone,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        county: dto.county,
        isDefault: dto.isDefault ?? false,
      },
    });

    return address;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Verify ownership
    const existingAddress = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        label: dto.label,
        recipientName: dto.recipientName,
        phone: dto.phone,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        county: dto.county,
        isDefault: dto.isDefault,
      },
    });

    return address;
  }

  async deleteAddress(userId: string, addressId: string) {
    // Verify ownership
    const existingAddress = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    // Verify ownership
    const existingAddress = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // Unset all defaults
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return address;
  }
}
