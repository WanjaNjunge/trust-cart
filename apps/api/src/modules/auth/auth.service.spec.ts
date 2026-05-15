import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';

describe('AuthService', () => {
  let service: AuthService;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const redisMock: jest.Mocked<RedisService> = {
      setex: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(false),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn(), decode: jest.fn() } },
        { provide: PrismaService, useValue: {} },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);
  });

  // ─── FIND-001: cryptographic token generation ──────────────────────────────

  describe('generateResetToken (FIND-001)', () => {
    it('produces a 64-character lowercase hex string', () => {
      const token = (service as unknown as { generateResetToken: () => string }).generateResetToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces 1000 tokens with zero collisions', () => {
      const gen = (service as unknown as { generateResetToken: () => string }).generateResetToken.bind(service);
      const tokens = new Set(Array.from({ length: 1000 }, () => gen()));
      expect(tokens.size).toBe(1000);
    });

    it('does not use Math.random', () => {
      const spy = jest.spyOn(Math, 'random');
      (service as unknown as { generateResetToken: () => string }).generateResetToken();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ─── FIND-003: JWT revocation — logout blacklists the JTI ─────────────────

  describe('logout (FIND-003)', () => {
    it('stores the JTI in Redis with the remaining TTL', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now
      (jwtService.decode as jest.Mock).mockReturnValue({ jti: 'test-jti', exp: futureExp });

      await service.logout('some.token.value');

      expect(redisService.setex).toHaveBeenCalledWith(
        'jwt:blacklist:test-jti',
        expect.any(Number),
        '1',
      );
      const [[, ttl]] = (redisService.setex as jest.Mock).mock.calls;
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(900);
    });

    it('does nothing when token has no JTI', async () => {
      (jwtService.decode as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });

      await service.logout('token.without.jti');

      expect(redisService.setex).not.toHaveBeenCalled();
    });

    it('does nothing when token is already expired', async () => {
      (jwtService.decode as jest.Mock).mockReturnValue({ jti: 'old-jti', exp: Math.floor(Date.now() / 1000) - 10 });

      await service.logout('expired.token');

      expect(redisService.setex).not.toHaveBeenCalled();
    });
  });

  // ─── FIND-003: env var reads JWT_ACCESS_EXPIRY, not JWT_EXPIRES_IN ─────────

  describe('JWT_ACCESS_EXPIRY env var (FIND-003)', () => {
    it('auth.module reads JWT_ACCESS_EXPIRY (not JWT_EXPIRES_IN)', async () => {
      const src = await import('fs').then(fs =>
        fs.promises.readFile(
          require('path').join(__dirname, 'auth.module.ts'),
          'utf8',
        ),
      );
      expect(src).toContain('JWT_ACCESS_EXPIRY');
      expect(src).not.toContain('JWT_EXPIRES_IN');
    });
  });
});
