interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export const CacheTTL = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 30 * 60 * 1000,
  LONG: 2 * 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T, ttl: number = CacheTTL.MEDIUM): void {
  store.set(key, { data, expiresAt: Date.now() + ttl });
}

export function cacheHas(key: string): boolean {
  return cacheGet(key) !== null;
}

export function cacheClear(): void {
  store.clear();
}

export function cacheDelete(pattern: string): number {
  let count = 0;
  const regex = new RegExp(pattern);
  for (const key of store.keys()) {
    if (regex.test(key)) {
      store.delete(key);
      count++;
    }
  }
  return count;
}
