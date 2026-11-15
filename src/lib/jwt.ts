import jwt, { SignOptions } from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('SECURITY ERROR: JWT_SECRET environment variable is not configured. Failing closed.');
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('SECURITY ERROR: JWT_SECRET must be at least 32 characters in production.');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  fullName?: string;
  isAdmin?: boolean;
}

export const JWT_ISSUER = 'saberio-ai';
export const JWT_AUDIENCE = 'saberio-users';

export function signToken(payload: TokenPayload, expiresIn: string | number = '7d'): string {
  const secret = getJwtSecret();
  const safePayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    isAdmin: Boolean(payload.isAdmin),
  };
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256',
  };
  return jwt.sign(safePayload, secret, options);
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const secret = getJwtSecret();
    // Validate with strict issuer, audience, and algorithm
    return jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    }) as TokenPayload;
  } catch {
    // Backward-compatibility fallback for existing active sessions before issuer/audience was added
    try {
      const secret = getJwtSecret();
      return jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as TokenPayload;
    } catch {
      return null;
    }
  }
}
