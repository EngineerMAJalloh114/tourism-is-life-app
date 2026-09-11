import { env, isWorkspacePreview } from "@/lib/env.server";
import { safeEqual } from "@/lib/server/crypto";

/**
 * Deployed Grok/Vercel app — never treat this as a sandbox. The exact inverse
 * of `isWorkspacePreview()` (single source of truth lives there).
 */
export function isDeployedRuntime(): boolean {
  return !isWorkspacePreview();
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

/**
 * Whether `email` may claim the (single-use, `bootstrap_lock`-guarded)
 * SUPER_ADMIN bootstrap.
 *
 * `BOOTSTRAP_ADMIN_EMAIL`, when set, is the *only* address allowed to claim —
 * in every environment, not just when deployed. When it is not set, any
 * verified session email is allowed, but only outside a real deployment
 * (local/sandbox convenience); a deployment with no configured admin email is
 * locked, not open.
 *
 * IMPORTANT — this restricts *who is allowed to attempt* the claim, it does
 * NOT verify that the account attempting it actually owns that email address.
 * Email/password sign-up here has no email-verification step yet (that lands
 * with the Resend / password-reset task), so whichever account first
 * registers with `BOOTSTRAP_ADMIN_EMAIL` and calls the bootstrap endpoint wins
 * the single-use `bootstrap_lock` claim, permanently. The approved owner MUST
 * register and claim SUPER_ADMIN immediately after `BOOTSTRAP_ADMIN_EMAIL` is
 * configured, before the URL is shared with anyone else.
 */
export function bootstrapEmailAllowed(email: string | null | undefined): boolean {
  const needle = email?.trim().toLowerCase();
  if (!needle) return false;
  const allowed = env("BOOTSTRAP_ADMIN_EMAIL")?.trim().toLowerCase();
  if (allowed) return allowed === needle;
  if (!isDeployedRuntime()) return true;
  return false;
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
