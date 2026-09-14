import { createFileRoute, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { pageHead, organizationJsonLd } from "@/lib/seo";
import { VehicleDetail } from "@/components/vehicle-rental/vehicle-detail";
import { getVehicle } from "@/data/vehicle-rental";

export const Route = createFileRoute("/services/vehicle-rental/vehicles/$vehicleId")({
  head: ({ params }) => {
    const vehicle = getVehicle(params.vehicleId);
    if (!vehicle) return pageHead("Vehicle Not Found", "", "/services/vehicle-rental");
    return pageHead(
      `${vehicle.name} · Vehicle Rental · Tourism Is Life`,
      `${vehicle.description.slice(0, 160)}…`,
      `/services/vehicle-rental/vehicles/${vehicle.id}`,
    );
  },
  component: Page,
});

function Page() {
  const { vehicleId } = Route.useParams();
  const vehicle = getVehicle(vehicleId);
  if (!vehicle) throw notFound();
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <VehicleDetail vehicle={vehicle} />
    </>
  );
}
