import jwt, { SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-too';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  figmaUserId?: string;
  type: 'access' | 'refresh';
}

export class JwtService {
  static generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
    const options: any = { expiresIn: JWT_EXPIRE };
    return jwt.sign(
      { ...payload, type: 'access' as const },
      JWT_SECRET,
      options
    ) as string;
  }

  static generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    const options: any = { expiresIn: JWT_REFRESH_EXPIRE };
    return jwt.sign(
      { ...payload, type: 'refresh' as const },
      JWT_REFRESH_SECRET,
      options
    ) as string;
  }

  static verifyAccessToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded.type === 'access' ? decoded : null;
    } catch {
      return null;
    }
  }

  static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
      return decoded.type === 'refresh' ? decoded : null;
    } catch {
      return null;
    }
  }

  static generateTokenPair(payload: Omit<JwtPayload, 'type'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    } catch {
      return null;
    }
  }

  static generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }
}