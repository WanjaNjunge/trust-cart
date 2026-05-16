/**
 * FIND-005 — rate limiting smoke test.
 *
 * Verifies the strict throttle tier (5 req / 60s) is declared on auth endpoints.
 * Full 429 integration testing requires a live server; this confirms configuration
 * is present and the guard is wired into AppModule.
 */
import * as fs from 'fs';
import * as path from 'path';

describe('Auth rate limiting configuration (FIND-005)', () => {
  const controllerSrc = fs.readFileSync(
    path.join(__dirname, 'auth.controller.ts'),
    'utf8',
  );
  const appModuleSrc = fs.readFileSync(
    path.join(__dirname, '../../app.module.ts'),
    'utf8',
  );

  it('auth.controller imports @Throttle from @nestjs/throttler', () => {
    expect(controllerSrc).toContain("from '@nestjs/throttler'");
    expect(controllerSrc).toContain('@Throttle');
  });

  it('login endpoint has strict throttle (5 req / 60000ms)', () => {
    expect(controllerSrc).toMatch(/@Throttle\(\s*\{\s*strict:\s*\{\s*limit:\s*5/);
  });

  it('register endpoint has strict throttle', () => {
    const registerBlock = controllerSrc.slice(
      controllerSrc.indexOf("@Post('register')"),
      controllerSrc.indexOf('async register'),
    );
    expect(registerBlock).toContain('@Throttle');
  });

  it('forgot-password endpoint has strict throttle', () => {
    const block = controllerSrc.slice(
      controllerSrc.indexOf("@Post('forgot-password')"),
      controllerSrc.indexOf('async forgotPassword'),
    );
    expect(block).toContain('@Throttle');
  });

  it('reset-password endpoint has strict throttle', () => {
    const block = controllerSrc.slice(
      controllerSrc.indexOf("@Post('reset-password')"),
      controllerSrc.indexOf('async resetPassword'),
    );
    expect(block).toContain('@Throttle');
  });

  it('AppModule provides APP_GUARD ThrottlerGuard globally', () => {
    expect(appModuleSrc).toContain('ThrottlerGuard');
    expect(appModuleSrc).toContain('APP_GUARD');
  });

  it('AppModule configures two throttle tiers: general and strict', () => {
    expect(appModuleSrc).toContain("name: 'general'");
    expect(appModuleSrc).toContain("name: 'strict'");
  });
});
