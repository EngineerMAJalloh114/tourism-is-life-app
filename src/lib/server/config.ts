import { env, isWorkspacePreview } from "@/lib/env.server";
import { safeEqual } from "@/lib/server/crypto";

/** Deployed Grok/Vercel app — never treat this as a sandbox. */
export function isDeployedRuntime(): boolean {
  return Boolean(env("GROK_PROJECT_ID"));
}

export function liveStripeConfigured(): boolean {
  return Boolean(env("STRIPE_SECRET_KEY") && env("STRIPE_WEBHOOK_SECRET"));
}

export function liveMonerooConfigured(): boolean {
  return Boolean(env("MONEROO_SECRET_KEY") && env("MONEROO_WEBHOOK_SECRET"));
}

/**
 * Demo settlement is preview-only. A deployed app, or any process with live
 * payment secrets, must never confirm a booking from a client "pay" click.
 */
export function demoPaymentsAllowed(): boolean {
  if (isDeployedRuntime()) return false;
  if (liveStripeConfigured() || liveMonerooConfigured()) return false;
  return true;
}

export function bootstrapEmailAllowed(email: string | null | undefined): boolean {
  const needle = email?.trim().toLowerCase();
  if (!needle) return false;
  if (!isDeployedRuntime()) return true;
  const allowed = env("BOOTSTRAP_ADMIN_EMAIL")?.toLowerCase();
  if (!allowed) return false;
  return allowed === needle;
}

export function productionRequiresDatabase(): void {
  if (isDeployedRuntime() && !env("DATABASE_URL")) {
    throw new Error("DATABASE_URL is required in production — refusing PGLite fallback.");
  }
}

export function cronAuthorized(header: string | null): boolean {
  const secret = env("CRON_SECRET");
  if (!secret) return isWorkspacePreview();
  if (!header) return false;
  return safeEqual(header, `Bearer ${secret}`);
}
