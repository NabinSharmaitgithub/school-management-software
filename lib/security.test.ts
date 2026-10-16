import { describe, it, expect } from "vitest";
import {
  rateLimit,
  generateCsrfToken,
  validateCsrfToken,
} from "@/lib/security";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = "test-key-1";
    const result = rateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks requests over the limit", () => {
    const key = "test-key-2";
    // Exhaust the limit
    for (let i = 0; i < 30; i++) {
      rateLimit(key);
    }
    const blocked = rateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    rateLimit("key-a");
    rateLimit("key-a");
    const result = rateLimit("key-b");
    expect(result.allowed).toBe(true);
  });
});

describe("generateCsrfToken", () => {
  it("returns a hex string of expected length", () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBe(64); // 32 bytes -> 64 hex chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("returns unique tokens", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
  });
});

describe("validateCsrfToken", () => {
  it("accepts matching token and cookie", () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, token)).toBe(true);
  });

  it("rejects mismatched token", () => {
    const token = generateCsrfToken();
    const cookie = generateCsrfToken();
    expect(validateCsrfToken(token, cookie)).toBe(false);
  });

  it("rejects null/undefined", () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(null, token)).toBe(false);
    expect(validateCsrfToken(token, null)).toBe(false);
    expect(validateCsrfToken(null, null)).toBe(false);
  });

  it("rejects different lengths", () => {
    expect(validateCsrfToken("abc", "abcd")).toBe(false);
  });
});
