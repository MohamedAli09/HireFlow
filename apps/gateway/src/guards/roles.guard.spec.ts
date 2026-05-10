import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@app/common';

const mockReflector = { get: jest.fn() };

function makeContext(userRole: Role) {
  return {
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user: { role: userRole } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    jest.clearAllMocks();
  });

  it('returns true when no @Roles() decorator is present (any authenticated user allowed)', () => {
    mockReflector.get.mockReturnValue(undefined);

    expect(guard.canActivate(makeContext(Role.CANDIDATE))).toBe(true);
  });

  it('returns true when user role matches one of the required roles', () => {
    mockReflector.get.mockReturnValue([Role.RECRUITER, Role.ADMIN]);

    expect(guard.canActivate(makeContext(Role.RECRUITER))).toBe(true);
  });

  it('throws ForbiddenException when user role is not in the required roles', () => {
    mockReflector.get.mockReturnValue([Role.RECRUITER, Role.ADMIN]);

    expect(() => guard.canActivate(makeContext(Role.CANDIDATE))).toThrow(
      ForbiddenException,
    );
  });
});
