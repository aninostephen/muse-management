import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthService & JwtAuthGuard (JWT Authentication)', () => {
  let authService: AuthService;
  let jwtAuthGuard: JwtAuthGuard;
  let isPublicFlag = false;

  beforeEach(() => {
    isPublicFlag = false;
    const configServiceMock = {
      get: (key: string, defaultVal?: unknown) => {
        const map: Record<string, unknown> = {
          'auth.jwtSecret': 'test-super-secret-jwt-key-2026',
          'auth.jwtExpiresInSeconds': 3600,
          'auth.adminEmail': 'admin@musemanagement.com',
          'auth.adminPassword': 'Admin@123',
          'auth.adminName': 'Agency Administrator',
        };
        return map[key] ?? defaultVal;
      },
    } as unknown as ConfigService;

    const reflectorMock = {
      getAllAndOverride: () => isPublicFlag,
    } as unknown as Reflector;

    authService = new AuthService(configServiceMock);
    jwtAuthGuard = new JwtAuthGuard(authService, reflectorMock);
  });

  it('signs in with valid credentials and returns a valid RFC 7519 HS256 JWT token', async () => {
    const res = await authService.login({
      email: 'admin@musemanagement.com',
      password: 'Admin@123',
    });

    expect(res.tokenType).toBe('Bearer');
    expect(res.expiresIn).toBe(3600);
    expect(res.user.email).toBe('admin@musemanagement.com');
    expect(res.accessToken.split('.')).toHaveLength(3);

    const verified = authService.verifyToken(res.accessToken);
    expect(verified.email).toBe('admin@musemanagement.com');
    expect(verified.role).toBe('admin');
  });

  it('rejects invalid email or password with 401 Unauthorized', async () => {
    await expect(
      authService.login({
        email: 'admin@musemanagement.com',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects tampered or expired JWT tokens', () => {
    const { accessToken } = authService.signToken({
      id: '1',
      email: 'admin@musemanagement.com',
      name: 'Admin',
      role: 'admin',
    });

    const tampered = `${accessToken}x`;
    expect(() => authService.verifyToken(tampered)).toThrow(
      UnauthorizedException,
    );

    const { accessToken: expiredToken } = authService.signToken(
      {
        id: '1',
        email: 'admin@musemanagement.com',
        name: 'Admin',
        role: 'admin',
      },
      -10,
    );
    expect(() => authService.verifyToken(expiredToken)).toThrow(
      UnauthorizedException,
    );
  });

  it('JwtAuthGuard allows @Public() routes and blocks unauthenticated protected routes', async () => {
    const mockReq: { headers: Record<string, string>; user?: unknown } = {
      headers: {},
    };
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as unknown as ExecutionContext;

    // Protected route without Authorization header -> throws 401
    expect(() => jwtAuthGuard.canActivate(mockContext)).toThrow(
      UnauthorizedException,
    );

    // Public route -> allowed without token
    isPublicFlag = true;
    expect(jwtAuthGuard.canActivate(mockContext)).toBe(true);

    // Protected route with valid Bearer token -> attaches req.user
    isPublicFlag = false;
    const { accessToken } = await authService.login({
      email: 'admin@musemanagement.com',
      password: 'Admin@123',
    });
    mockReq.headers.authorization = `Bearer ${accessToken}`;
    expect(jwtAuthGuard.canActivate(mockContext)).toBe(true);
    expect(mockReq.user).toMatchObject({
      email: 'admin@musemanagement.com',
      role: 'admin',
    });
  });
});
