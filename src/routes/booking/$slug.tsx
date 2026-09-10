import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/booking/$slug")({
  component: () => <Outlet />,
});
