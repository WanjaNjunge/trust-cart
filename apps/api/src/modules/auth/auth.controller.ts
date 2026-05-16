import {
  Controller,
  Post,
  Body,
  Headers,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JWT_COOKIE_NAME } from './strategies/jwt.strategy';

// 15 minutes in milliseconds — must stay in sync with JWT_ACCESS_EXPIRY
const COOKIE_MAX_AGE_MS = 15 * 60 * 1000;

function setJwtCookie(res: Response, token: string): void {
  res.cookie(JWT_COOKIE_NAME, token, {
    httpOnly: true,                                      // JS cannot read this cookie
    secure: process.env.NODE_ENV === 'production',       // HTTPS only in production
    sameSite: 'strict',                                  // no cross-site requests
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearJwtCookie(res: Response): void {
  res.clearCookie(JWT_COOKIE_NAME, { httpOnly: true, sameSite: 'strict', path: '/' });
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful — sets HttpOnly access_token cookie. accessToken field is deprecated; use the cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    // Set HttpOnly cookie — browser sends this automatically on every request (FIND-016)
    setJwtCookie(res, result.accessToken);
    // accessToken kept in body for backward-compat with non-browser API clients
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate JWT (clears cookie + blacklists token)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Headers('authorization') authHeader: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Blacklist the JTI whether the token came from cookie or Bearer header
    const token = authHeader?.replace(/^Bearer\s+/i, '') ?? '';
    await this.authService.logout(token);
    // Clear the HttpOnly cookie (FIND-016)
    clearJwtCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
