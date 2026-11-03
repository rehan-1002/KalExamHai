import "server-only";
import { GoogleGenAI } from "@google/genai";

// Cache GoogleGenAI instances by API key
const clientCache = new Map<string, GoogleGenAI>();

// Track rate limit cooldowns per key (key -> cooldown expiration timestamp)
const rateLimitedKeys = new Map<string, number>();

let keyIndex = 0;

/**
 * Returns the active generation model, automatically overriding any stale or deprecated
 * 2.5/2.0 values lingering in Vercel environment variables to gemini-3.5-flash.
 */
export function getGenerationModel(): string {
  const envModel = process.env.GEMINI_MODEL_GENERATION?.trim();
  if (!envModel || envModel.includes("2.5") || envModel.includes("2.0")) {
    return "gemini-3.5-flash";
  }
  return envModel;
}

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
 * Checks whether an error is a retryable transient error:
 * - 429: Rate limit / Resource exhausted
 * - 503: Service Unavailable / Model overloaded / High demand
 * - 500 / 502 / 504: Internal server error / Gateway timeout
 */
export function isTransientGeminiError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { status?: number; statusCode?: number; code?: number; message?: string };
  const status = anyErr.status || anyErr.statusCode || anyErr.code;
  if (status === 429 || status === 503 || status === 500 || status === 502 || status === 504) {
    return true;
  }
  const msg = String(anyErr.message || anyErr || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("quota exceeded") ||
    msg.includes("too many requests") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("try again later")
  );
}

// Backward compatibility alias
export const isRateLimitError = isTransientGeminiError;

/**
 * Formats raw Gemini API errors into clean, student-friendly error messages.
 */
export function formatGeminiErrorMessage(err: unknown): string {
  if (!err) return "AI generation failed. Please try again.";
  const msg = String((err as { message?: string })?.message || err || "");
  if (
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE")
  ) {
    return "Google AI servers are experiencing temporary peak traffic (503 High Demand). Please wait a few seconds and retry.";
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "API rate limit momentarily reached. Please wait a few seconds and try again.";
  }
  return msg;
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
 * Handles both 429 (rate limits) and 503 (high demand / overloaded) with zero user-facing crash.
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

      if (isTransientGeminiError(err)) {
        const anyErr = err as { status?: number; statusCode?: number; code?: number; message?: string };
        const status = anyErr.status || anyErr.statusCode || anyErr.code;
        const is429 = status === 429 || String(anyErr.message || "").includes("429");
        const is503 =
          status === 503 ||
          String(anyErr.message || "").toLowerCase().includes("503") ||
          String(anyErr.message || "").toLowerCase().includes("overloaded") ||
          String(anyErr.message || "").toLowerCase().includes("high demand");

        if (is429) {
          // Put this specific key on cooldown
          rateLimitedKeys.set(availableKey, Date.now() + 45000);
          console.warn(`[${label}] Rate limit (429) on key ${maskedKey}. Cooling down for 45s.`);

          // If another key is available, switch immediately (<100ms)
          const hasOtherKey = keys.some(
            (k) => k !== availableKey && (rateLimitedKeys.get(k) || 0) <= Date.now()
          );
          if (hasOtherKey) {
            await new Promise((r) => setTimeout(r, 100));
            continue;
          }
        }

        // For 503 (High Demand / Overloaded) or all keys cooling down:
        // Exponential backoff with random jitter (prevents thundering herd)
        const jitter = Math.floor(Math.random() * 400);
        const backoffMs = Math.min(1000 * Math.pow(1.5, attempt) + jitter, 6000);
        console.warn(
          `[${label}] ${is503 ? "Model high demand (503)" : "Transient error"}. Rotating key and waiting ${Math.round(backoffMs)}ms (attempt ${attempt + 1}/${maxAttempts})...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      // If it's a non-retryable error (e.g. 400 bad prompt syntax), throw immediately
      throw err;
    }
  }

  throw lastError;
}
