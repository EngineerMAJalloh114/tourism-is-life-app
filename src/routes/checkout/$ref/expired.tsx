import { createFileRoute } from "@tanstack/react-router";
import { CheckoutView } from "@/components/checkout/view";

export const Route = createFileRoute("/checkout/$ref/expired")({
  component: () => <CheckoutView step="expired" />,
});
