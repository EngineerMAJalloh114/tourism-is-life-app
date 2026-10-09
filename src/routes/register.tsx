import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Public sign-up is closed and sign-in is for team accounts only (task A3).
 * The old address answers with a permanent redirect to the team page.
 */
export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    throw redirect({ href: "/team/sign-in", statusCode: 301 });
  },
});
