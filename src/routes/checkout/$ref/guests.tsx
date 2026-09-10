import { createFileRoute } from "@tanstack/react-router";
import { CheckoutView } from "@/components/checkout/view";

export const Route = createFileRoute("/checkout/$ref/guests")({
  component: () => <CheckoutView step="guests" />,
});
