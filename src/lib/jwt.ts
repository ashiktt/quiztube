import jwt, { SignOptions } from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('SECURITY ERROR: JWT_SECRET environment variable is not configured. Failing closed.');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  fullName?: string;
  isAdmin?: boolean;
}

export function signToken(payload: TokenPayload, expiresIn: string | number = '30d'): string {
  const secret = getJwtSecret();
  const safePayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    isAdmin: Boolean(payload.isAdmin),
  };
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(safePayload, secret, options);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

