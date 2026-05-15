import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn(), decode: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

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
});
