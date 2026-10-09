import { createMiddleware } from "@tanstack/react-start";

/**
 * The one middleware every admin server function uses. It puts the verified
 * team member on `context.actor`, or answers 401 (signed out, inactive account)
 * or 403 (not a team account). Each operation then checks its own capability
 * (`adminOperation`), and any typed error it throws keeps its HTTP status
 * (403, 404, 409, 400) instead of becoming a 500.
 *
 * Structural test: every `createServerFn` under `src/lib/server/admin/` must
 * use this middleware (`src/lib/server/admin/structure.test.ts`).
 */
export const staffMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Live preview only (partitioned iframe cookies); null when deployed.
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { resolveActor, withHttpStatus } = await import("./actor.server");
    return withHttpStatus(async () => {
      const actor = await resolveActor(context.bearerToken);
      return next({ context: { actor } });
    });
  });
