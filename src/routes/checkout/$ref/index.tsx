import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/$ref/")({
  component: function CheckoutIndex() {
    const { ref } = Route.useParams();
    const { t } = Route.useSearch();
    return <Navigate to="/checkout/$ref/guests" params={{ ref }} search={{ t }} />;
  },
});
