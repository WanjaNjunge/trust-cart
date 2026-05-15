import { randomBytes } from 'crypto';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

const BCRYPT_ROUNDS = 10;

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

// In-memory store for password reset tokens (use Redis in production)
const passwordResetTokens = new Map<string, { userId: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token (in production, use Redis or database)
    passwordResetTokens.set(token, { userId: user.id, expiresAt });

    // TODO(FIND-004 Phase 2): replace in-memory store with Redis SETEX
    this.logger.log(`Password reset requested for user: ${user.id}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenData = passwordResetTokens.get(dto.token);

    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (tokenData.expiresAt < new Date()) {
      passwordResetTokens.delete(dto.token);
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    // Update user password
    await this.prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash },
    });

    // Remove used token
    passwordResetTokens.delete(dto.token);

    return { message: 'Password has been reset successfully' };
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }
}
