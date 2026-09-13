import { createFileRoute, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { pageHead, organizationJsonLd } from "@/lib/seo";
import { VehicleBooking } from "@/components/vehicle-rental/vehicle-booking";
import { getVehicle } from "@/data/vehicle-rental";

export const Route = createFileRoute("/services/vehicle-rental/book/$vehicleId")({
  head: ({ params }) => {
    const vehicle = getVehicle(params.vehicleId);
    if (!vehicle) return pageHead("Vehicle Enquiry", "", "/services/vehicle-rental");
    return pageHead(`Enquire about ${vehicle.name} | Tourism Is Life`, `Send a rental enquiry for the ${vehicle.name} for your Sierra Leone journey.`, `/services/vehicle-rental/book/${vehicle.id}`);
  },
  component: Page,
});

function Page() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <VehicleBooking />
    </>
  );
}
