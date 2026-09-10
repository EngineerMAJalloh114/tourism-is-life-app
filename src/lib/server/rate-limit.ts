import { reservationBackend } from "@/services/reservations";

type Bucket = { tokens: number; resetAt: number };

const memory = new Map<string, Bucket>();

const MAX_KEYS = 20_000;

function prune(now: number) {
  if (memory.size < MAX_KEYS) return;
  for (const [k, v] of memory) {
    if (v.resetAt <= now) memory.delete(k);
    if (memory.size < MAX_KEYS / 2) break;
  }
  if (memory.size >= MAX_KEYS) {
    const first = memory.keys().next().value;
    if (first) memory.delete(first);
  }
}

async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    const res = await fetch(url.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["INCR", key]),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: number };
    const n = Number(json.result);
    if (n === 1) {
      await fetch(url.replace(/\/$/, ""), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["EXPIRE", key, windowSec]),
      });
    }
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number; retryAfterMs: number }> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  if (reservationBackend() === "upstash") {
    const n = await upstashIncr(`til:rl:${key}`, windowSec);
    if (n !== null) {
      return {
        ok: n <= limit,
        remaining: Math.max(0, limit - n),
        retryAfterMs: windowMs,
      };
    }
  }
  const now = Date.now();
  prune(now);
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    memory.set(key, { tokens: limit - 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: windowMs };
  }
  if (current.tokens <= 0) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }
  current.tokens -= 1;
  return { ok: true, remaining: current.tokens, retryAfterMs: current.resetAt - now };
}

export function resetRateLimitForTests() {
  memory.clear();
}
