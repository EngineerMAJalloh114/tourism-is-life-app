import { getRequestIP } from "@tanstack/react-start/server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { consumeRateLimit } from "@/lib/server/rate-limit";

export async function guardPublicMutation(bucket: string, limit: number, windowMs: number) {
  assertSameSiteRequest();
  let ip = "unknown";
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    ip = "local";
  }
  const result = await consumeRateLimit(`${bucket}:${ip}`, limit, windowMs);
  if (!result.ok) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }
}
