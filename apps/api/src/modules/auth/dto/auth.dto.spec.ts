import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto, ResetPasswordDto } from './auth.dto';

describe('Auth DTOs — password validation (FIND-008)', () => {
  // ─── RegisterDto ──────────────────────────────────────────────────────────

  describe('RegisterDto', () => {
    function makeRegister(password: string) {
      return plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password,
        firstName: 'Test',
        lastName: 'User',
      });
    }

    it('accepts a valid password with upper, lower, digit, special char', async () => {
      const errors = await validate(makeRegister('SecurePass1!'));
      expect(errors.find(e => e.property === 'password')).toBeUndefined();
    });

    it('rejects a password longer than 128 characters', async () => {
      const errors = await validate(makeRegister('A1a!' + 'x'.repeat(125)));
      const pwErr = errors.find(e => e.property === 'password');
      expect(pwErr).toBeDefined();
      expect(JSON.stringify(pwErr?.constraints)).toMatch(/maxLength|max/i);
    });

    it('rejects a password shorter than 8 characters', async () => {
      const errors = await validate(makeRegister('Ab1!'));
      const pwErr = errors.find(e => e.property === 'password');
      expect(pwErr).toBeDefined();
    });

    it('rejects a password with no special character', async () => {
      const errors = await validate(makeRegister('SecurePass1'));
      const pwErr = errors.find(e => e.property === 'password');
      expect(pwErr).toBeDefined();
    });

    it('rejects a password with no digit', async () => {
      const errors = await validate(makeRegister('SecurePass!!'));
      const pwErr = errors.find(e => e.property === 'password');
      expect(pwErr).toBeDefined();
    });

    it('rejects a password with no uppercase letter', async () => {
      const errors = await validate(makeRegister('securepass1!'));
      const pwErr = errors.find(e => e.property === 'password');
      expect(pwErr).toBeDefined();
    });
  });

  // ─── LoginDto ─────────────────────────────────────────────────────────────

  describe('LoginDto', () => {
    it('rejects a password longer than 128 characters on login (DoS guard)', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'x'.repeat(129),
      });
      const errors = await validate(dto);
      const pwErr = errors.find(e => e.property === 'password');
      expect(pwErr).toBeDefined();
    });
  });

  // ─── ResetPasswordDto ─────────────────────────────────────────────────────

  describe('ResetPasswordDto', () => {
    it('rejects newPassword longer than 128 characters', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'some-token',
        newPassword: 'A1a!' + 'x'.repeat(125),
      });
      const errors = await validate(dto);
      const pwErr = errors.find(e => e.property === 'newPassword');
      expect(pwErr).toBeDefined();
    });

    it('rejects newPassword missing special character', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'some-token',
        newPassword: 'SecurePass1',
      });
      const errors = await validate(dto);
      const pwErr = errors.find(e => e.property === 'newPassword');
      expect(pwErr).toBeDefined();
    });
  });
});
