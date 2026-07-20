import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheSet, cacheHas, cacheClear, cacheDelete, CacheTTL } from "../providers/cache";

describe("cache", () => {
  beforeEach(() => {
    cacheClear();
  });

  it("returns null for missing keys", () => {
    expect(cacheGet("missing")).toBeNull();
  });

  it("stores and retrieves values", () => {
    cacheSet("a", { data: 1 }, CacheTTL.SHORT);
    expect(cacheGet("a")).toEqual({ data: 1 });
  });

  it("returns true for cacheHas when key exists", () => {
    cacheSet("x", "hello", CacheTTL.SHORT);
    expect(cacheHas("x")).toBe(true);
  });

  it("returns false for cacheHas when key is missing", () => {
    expect(cacheHas("nope")).toBe(false);
  });

  it("clears all entries", () => {
    cacheSet("a", 1, CacheTTL.SHORT);
    cacheSet("b", 2, CacheTTL.SHORT);
    cacheClear();
    expect(cacheGet("a")).toBeNull();
    expect(cacheGet("b")).toBeNull();
  });

  it("expires entries after TTL", async () => {
    cacheSet("e", "expire", 10);
    expect(cacheGet("e")).toBe("expire");
    await new Promise((r) => setTimeout(r, 20));
    expect(cacheGet("e")).toBeNull();
  });

  it("overwrites existing keys", () => {
    cacheSet("k", "first", CacheTTL.SHORT);
    cacheSet("k", "second", CacheTTL.SHORT);
    expect(cacheGet("k")).toBe("second");
  });

  it("cacheDelete removes matching entries", () => {
    cacheSet("prefix:1", "a", CacheTTL.SHORT);
    cacheSet("prefix:2", "b", CacheTTL.SHORT);
    cacheSet("other:1", "c", CacheTTL.SHORT);
    const removed = cacheDelete("^prefix:");
    expect(removed).toBe(2);
    expect(cacheGet("prefix:1")).toBeNull();
    expect(cacheGet("other:1")).toBe("c");
  });

  it("stores different TTL values", () => {
    expect(CacheTTL.SHORT).toBe(5 * 60 * 1000);
    expect(CacheTTL.MEDIUM).toBe(30 * 60 * 1000);
    expect(CacheTTL.LONG).toBe(2 * 60 * 60 * 1000);
    expect(CacheTTL.DAY).toBe(24 * 60 * 60 * 1000);
  });
});
