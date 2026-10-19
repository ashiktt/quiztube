import { NextRequest } from 'next/server';

/**
 * Validates that an incoming request to internal APIs has the valid ASSISTANT_INTERNAL_API_SECRET.
 * Fails closed if the secret is missing from environment.
 */
export function verifyInternalSecret(req: NextRequest): boolean {
  const secret = process.env.ASSISTANT_INTERNAL_API_SECRET;
  if (!secret || secret.trim().length === 0) {
    console.error('SECURITY ERROR: ASSISTANT_INTERNAL_API_SECRET is not configured. Failing closed.');
    return false;
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = req.headers.get('x-internal-secret') || '';

  return token === secret || headerSecret === secret;
}
