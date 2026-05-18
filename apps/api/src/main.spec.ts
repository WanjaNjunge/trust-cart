/**
 * Structural tests for main.ts security configuration.
 * These verify Helmet and Swagger gating are wired correctly
 * without starting a real HTTP server.
 */
import * as fs from 'fs';
import * as path from 'path';

const mainSrc = fs.readFileSync(path.join(__dirname, 'main.ts'), 'utf8');

describe('main.ts security configuration', () => {
  describe('Helmet security headers (FIND-006)', () => {
    it('imports helmet', () => {
      expect(mainSrc).toContain("import helmet from 'helmet'");
    });

    it('applies helmet before CORS', () => {
      const helmetPos = mainSrc.indexOf('app.use(\n    helmet(');
      const corsPos = mainSrc.indexOf('app.enableCors(');
      expect(helmetPos).toBeGreaterThan(0);
      expect(corsPos).toBeGreaterThan(helmetPos);
    });

    it('configures contentSecurityPolicy with restrictive defaults', () => {
      expect(mainSrc).toContain('contentSecurityPolicy');
      expect(mainSrc).toContain("defaultSrc: [\"'self'\"]");
      expect(mainSrc).toContain("frameSrc: [\"'none'\"]");
      expect(mainSrc).toContain("objectSrc: [\"'none'\"]");
    });
  });

  describe('Startup env var validation (FIND-036, FIND-037)', () => {
    it('defines INSECURE_JWT_SECRETS blocklist', () => {
      expect(mainSrc).toContain('INSECURE_JWT_SECRETS');
      expect(mainSrc).toContain('trustcart-dev-secret-key-change-in-production');
    });

    it('throws FATAL error when JWT_SECRET is missing', () => {
      expect(mainSrc).toContain('JWT_SECRET environment variable is not set');
    });

    it('throws FATAL error when JWT_SECRET is a known-weak placeholder in production', () => {
      expect(mainSrc).toContain('INSECURE_JWT_SECRETS.has(jwtSecret)');
      expect(mainSrc).toContain('known-weak placeholder');
    });

    it('throws FATAL error when DATABASE_URL is missing', () => {
      expect(mainSrc).toContain('DATABASE_URL environment variable is not set');
    });

    it('throws FATAL error when production DATABASE_URL lacks sslmode=require (FIND-037)', () => {
      expect(mainSrc).toContain('sslmode=require');
      expect(mainSrc).toContain('DATABASE_URL must include sslmode=require in production');
    });

    it('throws FATAL error when REDIS_HOST is missing (FIND-037)', () => {
      expect(mainSrc).toContain('REDIS_HOST environment variable is not set');
    });

    it('globalExceptionFilter is registered before routes', () => {
      const filterPos = mainSrc.indexOf('useGlobalFilters');
      const routePos = mainSrc.indexOf('setGlobalPrefix');
      expect(filterPos).toBeGreaterThan(0);
      // filter registered after createApp, close to startup
      expect(filterPos).toBeGreaterThan(mainSrc.indexOf('NestFactory.create'));
    });
  });

  describe('Swagger production gating (FIND-007)', () => {
    it('Swagger setup is inside NODE_ENV !== production guard', () => {
      const guardStart = mainSrc.indexOf("process.env.NODE_ENV !== 'production'");
      const swaggerSetup = mainSrc.indexOf('SwaggerModule.setup(');
      expect(guardStart).toBeGreaterThan(0);
      expect(swaggerSetup).toBeGreaterThan(guardStart);
    });

    it('DocumentBuilder is inside the production guard', () => {
      const guardStart = mainSrc.indexOf("process.env.NODE_ENV !== 'production'");
      const docBuilder = mainSrc.indexOf('new DocumentBuilder()');
      expect(docBuilder).toBeGreaterThan(guardStart);
    });
  });
});
