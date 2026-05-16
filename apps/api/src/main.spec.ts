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
