import { randomBytes, randomUUID } from 'crypto';
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
import { RedisService } from '../redis';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
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

  async logout(rawToken: string): Promise<void> {
    const decoded = this.jwtService.decode(rawToken) as { jti?: string; exp?: number } | null;
    if (!decoded?.jti || !decoded.exp) {
      return;
    }
    const ttlSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    if (ttlSeconds > 0) {
      await this.redis.setex(`jwt:blacklist:${decoded.jti}`, ttlSeconds, '1');
    }
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

    const token = this.generateResetToken();

    // Store in Redis with 24h TTL — survives restarts, shared across all instances
    await this.redis.setex(
      `pwd_reset:${token}`,
      RESET_TOKEN_TTL_SECONDS,
      JSON.stringify({ userId: user.id }),
    );

    this.logger.log(`Password reset requested for user: ${user.id}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const raw = await this.redis.get(`pwd_reset:${dto.token}`);

    if (!raw) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const { userId } = JSON.parse(raw) as { userId: string };

    // Delete before updating password — prevents reuse even if update fails mid-flight
    await this.redis.del(`pwd_reset:${dto.token}`);

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password has been reset successfully' };
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }
}
