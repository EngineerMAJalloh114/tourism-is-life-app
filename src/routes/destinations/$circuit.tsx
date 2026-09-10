import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/destinations/$circuit")({
  component: () => <Outlet />,
});
