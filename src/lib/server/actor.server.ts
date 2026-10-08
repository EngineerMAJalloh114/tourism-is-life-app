/**
 * Resolve the team member behind an admin request (server-only).
 *
 * MUST keep the `.server` suffix: it imports `@tanstack/react-start/server` and
 * the Better Auth instance, which must never reach the browser bundle.
 */
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { gateIdentityEnabled } from "@/lib/auth/gate-identity.server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { auth, authConfigured } from "@/lib/auth/server";
import { getSql } from "@/lib/db";
import type { Actor } from "@/lib/server/access";
import { AuthRequiredError, ForbiddenError, isHttpError } from "@/lib/server/errors";
import { loadStaffProfile } from "@/lib/server/team/staff";

/**
 * The signed-in team member, or a typed error:
 *   - no session (signed out, expired, revoked)      -> 401
 *   - signed in but no team account                  -> 403
 *   - team account disabled or removed               -> 401, and its sessions are deleted
 *
 * The session is read with the cookie cache bypassed, so a session deleted a
 * moment ago (disable, password reset) stops working on the very next request
 * instead of up to five minutes later.
 */
export async function resolveActor(bearerToken?: string): Promise<Actor> {
  const user = await resolveSessionUser(bearerToken);
  if (!user) throw new AuthRequiredError();
  const sql = await getSql();
  const profile = await loadStaffProfile(sql, user.id);
  if (!profile) throw new ForbiddenError("This area is for the Tourism Is Life team.");
  if (profile.status !== "active") {
    await sql`delete from "session" where "userId" = ${user.id}`;
    throw new AuthRequiredError("This team account is not active.");
  }
  return { userId: user.id, email: user.email, role: profile.role, ip: requestIp() };
}

/** The client IP as Vercel's edge reports it (first `x-forwarded-for` entry), or null. */
export function requestIp(): string | null {
  const request = getRequest();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request?.headers.get("x-real-ip")?.trim();
  const ip = forwarded || real || null;
  return ip ? ip.slice(0, 64) : null;
}

/** The verified session user (cookie cache bypassed), or null when signed out. */
export async function resolveSessionUser(bearerToken?: string): Promise<{ id: string; email: string | null } | null> {
  assertSameSiteRequest();
  if (!authConfigured && !gateIdentityEnabled()) return null;
  const request = getRequest();
  if (!request) return null;
  let headers = request.headers;
  if (bearerToken) {
    headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}

/** Run `fn`; a typed error sets the matching HTTP status before it propagates. */
export async function withHttpStatus<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isHttpError(err)) setResponseStatus(err.status);
    else if (err instanceof Error && err.name === "ZodError") setResponseStatus(400);
    throw err;
  }
}
