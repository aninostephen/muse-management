import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { LoginDto } from './dto/login.dto';

export interface JwtUserPayload {
  sub: string;
  email: string;
  name: string;
  role: 'admin';
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  private base64UrlEncode(input: string | Buffer): string {
    const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
    return buf
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(input: string): string {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }

  /**
   * Signs a standard RFC 7519 HS256 JWT token.
   */
  signToken(
    user: AuthenticatedUser,
    customExpiresInSeconds?: number,
  ): { accessToken: string; expiresIn: number } {
    const secret = this.configService.get<string>(
      'auth.jwtSecret',
      'muse-agency-management-jwt-secret-key-2026-hs256',
    );
    const expiresIn =
      customExpiresInSeconds ??
      this.configService.get<number>('auth.jwtExpiresInSeconds', 86400);

    const nowSec = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: nowSec,
      exp: nowSec + expiresIn,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = this.base64UrlEncode(
      createHmac('sha256', secret).update(signingInput).digest(),
    );

    return {
      accessToken: `${signingInput}.${signature}`,
      expiresIn,
    };
  }

  /**
   * Verifies a standard RFC 7519 HS256 JWT token and returns the decoded payload.
   */
  verifyToken(token: string): JwtUserPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing authentication token');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed JWT token');
    }

    const [encodedHeader, encodedPayload, providedSignature] = parts;
    const secret = this.configService.get<string>(
      'auth.jwtSecret',
      'muse-agency-management-jwt-secret-key-2026-hs256',
    );

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.base64UrlEncode(
      createHmac('sha256', secret).update(signingInput).digest(),
    );

    if (!this.safeCompare(providedSignature, expectedSignature)) {
      throw new UnauthorizedException('Invalid JWT token signature');
    }

    let payload: JwtUserPayload;
    try {
      payload = JSON.parse(
        this.base64UrlDecode(encodedPayload),
      ) as JwtUserPayload;
    } catch {
      throw new UnauthorizedException('Invalid JWT payload encoding');
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= nowSec) {
      throw new UnauthorizedException('JWT token has expired');
    }

    return payload;
  }

  /**
   * Authenticates email/password credentials and issues a Bearer JWT.
   */
  async login(dto: LoginDto) {
    const adminEmail = this.configService.get<string>(
      'auth.adminEmail',
      'admin@musemanagement.com',
    );
    const adminPassword = this.configService.get<string>(
      'auth.adminPassword',
      'Admin@123',
    );
    const adminName = this.configService.get<string>(
      'auth.adminName',
      'Agency Administrator',
    );

    const emailNormalized = (dto.email || '').trim().toLowerCase();
    const expectedEmail = adminEmail.trim().toLowerCase();

    const isEmailMatch = this.safeCompare(emailNormalized, expectedEmail);
    const isPasswordMatch = this.safeCompare(dto.password || '', adminPassword);

    if (!isEmailMatch || !isPasswordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user: AuthenticatedUser = {
      id: 'agency-admin-1',
      email: adminEmail,
      name: adminName,
      role: 'admin',
    };

    const { accessToken, expiresIn } = this.signToken(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user,
    };
  }
}
