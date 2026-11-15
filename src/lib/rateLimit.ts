import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isMongoConfigured } from './mongodb';
import { RateLimit } from '@/models/RateLimit';

interface MemoryRateLimit {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryRateLimit>();

// Clean up stale memory records every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore.entries()) {
      if (now > v.resetAt) {
        memoryStore.delete(k);
      }
    }
  }, 60000).unref?.();
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfter: RateLimitResult;
}

/**
 * Distributed rate limiter with MongoDB TTL backing and in-memory fallback.
 * Works seamlessly across Vercel serverless functions without requiring Redis.
 * Supports both options object or (identifier, limit, windowMs, prefix) signatures.
 */
export async function enforceRateLimit(
  identifier: string,
  limitOrOptions: number | RateLimitOptions,
  windowMsArg?: number,
  prefixArg?: string
): Promise<RateLimitResult> {
  let limit: number;
  let windowMs: number;
  let keyPrefix: string;

  if (typeof limitOrOptions === 'number') {
    limit = limitOrOptions;
    windowMs = windowMsArg || 60000;
    keyPrefix = prefixArg || 'rl';
  } else {
    limit = limitOrOptions.limit;
    windowMs = limitOrOptions.windowMs;
    keyPrefix = limitOrOptions.keyPrefix || 'rl';
  }

  const fullKey = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const expiresAt = new Date(now + windowMs);

  // If MongoDB is configured and ready, use atomic distributed MongoDB rate limit collection
  if (isMongoConfigured()) {
    try {
      await connectDB();

      const record = await RateLimit.findOneAndUpdate(
        { key: fullKey, expiresAt: { $gt: new Date() } },
        {
          $inc: { count: 1 },
          $setOnInsert: { key: fullKey, expiresAt },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const count = record.count;
      const remaining = Math.max(0, limit - count);
      const resetMs = Math.max(0, new Date(record.expiresAt).getTime() - now);

      const result: RateLimitResult = {
        allowed: count <= limit,
        limit,
        remaining,
        resetMs,
        retryAfter: null as any,
      };
      result.retryAfter = result;
      return result;
    } catch {
      // Fall through to memory store if database is momentarily unreachable
    }
  }

  // In-memory fallback
  const existing = memoryStore.get(fullKey);
  if (!existing || now > existing.resetAt) {
    memoryStore.set(fullKey, { count: 1, resetAt: now + windowMs });
    const result: RateLimitResult = {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetMs: windowMs,
      retryAfter: null as any,
    };
    result.retryAfter = result;
    return result;
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  const remaining = Math.max(0, limit - existing.count);
  const resetMs = Math.max(0, existing.resetAt - now);

  const result: RateLimitResult = { allowed, limit, remaining, resetMs, retryAfter: null as any };
  result.retryAfter = result;
  return result;
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.ceil(result.resetMs / 1000);
  return NextResponse.json(
    {
      success: false,
      error: `Too many requests. Please try again in ${retryAfterSec} seconds.`,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  );
}
