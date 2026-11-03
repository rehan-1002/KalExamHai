import "server-only";
import { GoogleGenAI } from "@google/genai";

// Cache GoogleGenAI instances by API key
const clientCache = new Map<string, GoogleGenAI>();

// Track rate limit cooldowns per key (key -> cooldown expiration timestamp)
const rateLimitedKeys = new Map<string, number>();

let keyIndex = 0;

/**
 * Extracts and deduplicates all configured Gemini API keys from environment variables.
 * Supports:
 * - GEMINI_API_KEYS (comma or newline separated list)
 * - GEMINI_API_KEY
 * - GEMINI_API_KEY_1 through GEMINI_API_KEY_10
 */
export function getAllGeminiApiKeys(): string[] {
  const keys: string[] = [];

  // 1. Check GEMINI_API_KEYS (comma or newline separated)
  if (process.env.GEMINI_API_KEYS) {
    const split = process.env.GEMINI_API_KEYS.split(/[,\n]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    keys.push(...split);
  }

  // 2. Check standard GEMINI_API_KEY
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }

  // 3. Check numbered keys GEMINI_API_KEY_1 through GEMINI_API_KEY_10
  for (let i = 1; i <= 10; i++) {
    const val = process.env[`GEMINI_API_KEY_${i}`];
    if (val && val.trim()) {
      keys.push(val.trim());
    }
  }

  // Deduplicate keys while preserving order
  const uniqueKeys = Array.from(new Set(keys));

  if (uniqueKeys.length === 0) {
    throw new Error("Missing GEMINI_API_KEY or GEMINI_API_KEYS in environment variables.");
  }

  return uniqueKeys;
}

export function getClientForKey(apiKey: string): GoogleGenAI {
  let instance = clientCache.get(apiKey);
  if (!instance) {
    instance = new GoogleGenAI({ apiKey });
    clientCache.set(apiKey, instance);
  }
  return instance;
}

/**
 * Checks whether an error is a 429 / Rate Limit / Resource Exhausted error.
 */
export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { status?: number; statusCode?: number; code?: number; message?: string };
  if (anyErr.status === 429 || anyErr.statusCode === 429 || anyErr.code === 429) {
    return true;
  }
  const msg = String(anyErr.message || anyErr || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("quota exceeded") ||
    msg.includes("too many requests")
  );
}

/**
 * Returns the next available client from the pool using round-robin and rate-limit cooldown awareness.
 */
export function getGeminiClient(): GoogleGenAI {
  const keys = getAllGeminiApiKeys();
  const now = Date.now();

  // Find a key that is not in cooldown
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const candidateKey = keys[(keyIndex + attempt) % keys.length]!;
    const cooldownUntil = rateLimitedKeys.get(candidateKey) || 0;
    if (now > cooldownUntil) {
      keyIndex = (keyIndex + attempt + 1) % keys.length;
      return getClientForKey(candidateKey);
    }
  }

  // If all are cooling down, return the next round-robin key
  const fallbackKey = keys[keyIndex % keys.length]!;
  keyIndex = (keyIndex + 1) % keys.length;
  return getClientForKey(fallbackKey);
}

/**
 * Executes a Gemini operation with automatic multi-key rotation and exponential backoff retry.
 * If Key A returns a 429, it immediately switches to Key B with zero failure.
 */
export async function executeWithGeminiPool<T>(
  operation: (client: GoogleGenAI, apiKey: string) => Promise<T>,
  options?: { maxAttempts?: number; label?: string }
): Promise<T> {
  const keys = getAllGeminiApiKeys();
  const maxAttempts = options?.maxAttempts ?? Math.max(keys.length * 2, 6);
  const label = options?.label ?? "Gemini API";

  let lastError: unknown;
  const now = Date.now();

  // Clean up expired cooldowns
  for (const [k, exp] of rateLimitedKeys.entries()) {
    if (now > exp) {
      rateLimitedKeys.delete(k);
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // True balanced round-robin: rotate candidate keys starting from keyIndex
    const rotated = keys.map((_, i) => keys[(keyIndex + i) % keys.length]!);
    const availableKey =
      rotated.find((k) => (rateLimitedKeys.get(k) || 0) <= Date.now()) || keys[(keyIndex + attempt) % keys.length]!;
    keyIndex = (keyIndex + 1) % keys.length;
    const client = getClientForKey(availableKey);
    const maskedKey = `${availableKey.slice(0, 6)}...${availableKey.slice(-4)}`;

    try {
      return await operation(client, availableKey);
    } catch (err: unknown) {
      lastError = err;

      if (isRateLimitError(err)) {
        // Mark this key as cooling down for 45 seconds
        rateLimitedKeys.set(availableKey, Date.now() + 45000);
        console.warn(
          `[${label}] Rate limit (429) hit on key ${maskedKey}. Cooling down for 45s. Attempt ${attempt + 1}/${maxAttempts}.`
        );

        // Check if there are other keys available right now
        const hasOtherKey = keys.some(
          (k) => k !== availableKey && (rateLimitedKeys.get(k) || 0) <= Date.now()
        );

        if (hasOtherKey) {
          // Immediately try the other key
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }

        // If ALL keys are exhausted, wait with exponential backoff
        const backoffMs = Math.min(1500 * Math.pow(1.5, attempt), 8000);
        console.warn(`[${label}] All keys cooling down. Waiting ${backoffMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      // If it's not a rate limit error, rethrow immediately
      throw err;
    }
  }

  throw lastError;
}
