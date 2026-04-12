import { LRUCache } from 'lru-cache';

interface CacheOptions {
  maxItems?: number;
  ttlMinutes?: number;
}

type CacheValue = NonNullable<unknown>;

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_TTL_MINUTES = 15;

const caches = new Map<string, LRUCache<string, CacheValue>>();

function getOrCreateCache(namespace: string, options?: CacheOptions): LRUCache<string, CacheValue> {
  const existing = caches.get(namespace);
  if (existing) {
    return existing;
  }

  const maxItems = options?.maxItems ?? DEFAULT_MAX_ITEMS;
  const ttlMinutes = options?.ttlMinutes ?? DEFAULT_TTL_MINUTES;

  const cache = new LRUCache<string, CacheValue>({
    max: maxItems,
    ttl: ttlMinutes * 60 * 1000,
    allowStale: false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  });

  caches.set(namespace, cache);
  return cache;
}

export function cacheGet<T>(namespace: string, key: string): T | undefined {
  const cache = getOrCreateCache(namespace);
  const value = cache.get(key);
  if (value === undefined) {
    return undefined;
  }
  return value as T;
}

export function cacheSet<T>(
  namespace: string,
  key: string,
  value: T,
  options?: CacheOptions
): void {
  const cache = getOrCreateCache(namespace, options);
  cache.set(key, value as CacheValue);
}

export function cacheDelete(namespace: string, key: string): void {
  const cache = caches.get(namespace);
  if (cache) {
    cache.delete(key);
  }
}

export function cacheClear(namespace: string): void {
  const cache = caches.get(namespace);
  if (cache) {
    cache.clear();
  }
}

export function cacheClearAll(): void {
  for (const cache of caches.values()) {
    cache.clear();
  }
}

export function cacheStats(namespace: string): { size: number; maxSize: number } | null {
  const cache = caches.get(namespace);
  if (!cache) {
    return null;
  }
  return {
    size: cache.size,
    maxSize: cache.max,
  };
}

export async function cacheGetOrFetch<T>(
  namespace: string,
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cached = cacheGet<T>(namespace, key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetcher();
  cacheSet(namespace, key, value, options);
  return value;
}

export default {
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  clear: cacheClear,
  clearAll: cacheClearAll,
  stats: cacheStats,
  getOrFetch: cacheGetOrFetch,
};
