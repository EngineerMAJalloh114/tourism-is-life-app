import { createMiddleware } from "@tanstack/react-start";

/** Resolves a session if present; does not throw when the visitor is a guest. */
export const optionalAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    assertSameSiteRequest();
    const user = await getSessionUser(context.bearerToken);
    return next({
      context: {
        userId: user?.id ?? null as string | null,
        email: user?.email ?? null as string | null,
      },
    });
  });
