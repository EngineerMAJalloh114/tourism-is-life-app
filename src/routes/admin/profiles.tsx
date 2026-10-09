import { createFileRoute, redirect } from "@tanstack/react-router";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";

/** Public team profiles are a collection; this menu entry opens it (team.profiles: ADMIN and SUPER_ADMIN). */
export const Route = createFileRoute("/admin/profiles")({
  beforeLoad: ({ context }) => {
    requirePageCapability(context.access, "team.profiles");
    throw redirect({ to: "/admin/collections/$collection", params: { collection: "team-profiles" } });
  },
  errorComponent: AdminRouteError,
});
