import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'saberio_ai_jwt_super_secret_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName?: string;
  isAdmin?: boolean;
}

export function signToken(payload: TokenPayload, expiresIn: string | number = '30d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
