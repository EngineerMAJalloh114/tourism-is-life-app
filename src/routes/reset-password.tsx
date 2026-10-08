import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Old reset links land here; send them to the team reset page with the token,
 * as a permanent redirect (task A3).
 */
export const Route = createFileRoute("/reset-password")({
  validateSearch: (raw: Record<string, unknown>): { token?: string; error?: string } => ({
    ...(typeof raw.token === "string" ? { token: raw.token } : {}),
    ...(typeof raw.error === "string" ? { error: raw.error } : {}),
  }),
  beforeLoad: ({ search }) => {
    const params = new URLSearchParams();
    if (search.token) params.set("token", search.token);
    if (search.error) params.set("error", search.error);
    const query = params.toString();
    throw redirect({ href: `/team/reset-password${query ? `?${query}` : ""}`, statusCode: 301 });
  },
});
