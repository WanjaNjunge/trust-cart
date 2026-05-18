import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function makeContext(roles: string[] | undefined, userRole?: string): ExecutionContext {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const ctx = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => (userRole ? { user: { role: userRole } } : { user: null }),
    }),
  } as unknown as ExecutionContext;
  return ctx;
}

describe('RolesGuard (FIND-009)', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  function ctx(roles: string[] | undefined, userRole?: string): ExecutionContext {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(roles);
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => (userRole ? { user: { role: userRole } } : { user: null }),
      }),
    } as unknown as ExecutionContext;
  }

  it('throws ForbiddenException when no @Roles() decorator is present (deny-by-default)', () => {
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when @Roles() is applied with empty array', () => {
    expect(() => guard.canActivate(ctx([]))).toThrow(ForbiddenException);
  });

  it('returns true when user role is in the required roles list', () => {
    expect(guard.canActivate(ctx(['ADMIN', 'MANAGER'], 'ADMIN'))).toBe(true);
  });

  it('returns false when user role is NOT in the required roles list', () => {
    expect(guard.canActivate(ctx(['ADMIN', 'MANAGER'], 'CUSTOMER'))).toBe(false);
  });

  it('returns false when no user is present on the request', () => {
    expect(guard.canActivate(ctx(['ADMIN']))).toBe(false);
  });
});
