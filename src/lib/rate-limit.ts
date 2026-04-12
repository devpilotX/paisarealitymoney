import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  interval: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limiters = new Map<string, LRUCache<string, RateLimitEntry>>();

function getLimiter(name: string, maxItems: number): LRUCache<string, RateLimitEntry> {
  const existing = limiters.get(name);
  if (existing) {
    return existing;
  }
  const limiter = new LRUCache<string, RateLimitEntry>({
    max: maxItems,
    ttl: 3600000,
  });
  limiters.set(name, limiter);
  return limiter;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

export function checkRateLimit(
  request: NextRequest,
  name: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetIn: number } {
  const ip = getClientIp(request);
  const limiter = getLimiter(name, 10000);
  const now = Date.now();

  const entry = limiter.get(ip);

  if (!entry || now > entry.resetTime) {
    limiter.set(ip, { count: 1, resetTime: now + options.interval });
    return { allowed: true, remaining: options.maxRequests - 1, resetIn: options.interval };
  }

  if (entry.count >= options.maxRequests) {
    const resetIn = entry.resetTime - now;
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count += 1;
  limiter.set(ip, entry);
  return { allowed: true, remaining: options.maxRequests - entry.count, resetIn: entry.resetTime - now };
}

export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
      },
    }
  );
}

export const RATE_LIMITS = {
  auth: { interval: 900000, maxRequests: 10 },
  api: { interval: 60000, maxRequests: 60 },
  scraper: { interval: 60000, maxRequests: 5 },
  search: { interval: 60000, maxRequests: 30 },
} as const;

export default { checkRateLimit, rateLimitResponse, RATE_LIMITS };