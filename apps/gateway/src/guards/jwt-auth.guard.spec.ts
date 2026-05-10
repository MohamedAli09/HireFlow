import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '@app/common';

const mockJwtService = { verify: jest.fn() };
const mockConfigService = { get: jest.fn().mockReturnValue('test-secret') };
const mockReflector = { get: jest.fn() };

function makeContext(headers: Record<string, string> = {}) {
  const request = { headers, user: undefined as any };
  return {
    request,
    ctx: {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(request) }),
    } as unknown as ExecutionContext,
  };
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jest.clearAllMocks();
  });

  it('returns true without checking the token when route is marked @Public()', () => {
    mockReflector.get.mockReturnValue(true);
    const { ctx } = makeContext();

    expect(guard.canActivate(ctx)).toBe(true);
    expect(mockJwtService.verify).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when Authorization header is missing', () => {
    mockReflector.get.mockReturnValue(false);
    const { ctx } = makeContext({});

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when header does not start with "Bearer "', () => {
    mockReflector.get.mockReturnValue(false);
    const { ctx } = makeContext({ authorization: 'Basic sometoken' });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('verifies the token, attaches decoded payload to request.user, and returns true', () => {
    mockReflector.get.mockReturnValue(false);
    const payload = { sub: '1', email: 'a@a.com', role: Role.CANDIDATE };
    mockJwtService.verify.mockReturnValue(payload);
    const { ctx, request } = makeContext({ authorization: 'Bearer valid.token' });

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockJwtService.verify).toHaveBeenCalledWith('valid.token', { secret: 'test-secret' });
    expect(request.user).toEqual(payload);
  });

  it('throws UnauthorizedException when jwtService.verify throws (invalid or expired token)', () => {
    mockReflector.get.mockReturnValue(false);
    mockJwtService.verify.mockImplementation(() => { throw new Error('jwt expired'); });
    const { ctx } = makeContext({ authorization: 'Bearer expired.token' });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
