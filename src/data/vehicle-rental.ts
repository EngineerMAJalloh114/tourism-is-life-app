export type VehicleCategory =
  | "economy"
  | "sedan"
  | "suv"
  | "4x4"
  | "van"
  | "minibus"
  | "luxury"
  | "bus";

export type Transmission = "manual" | "automatic";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export type DriverOption = "self-drive" | "with-driver" | "both";

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string }[];
  seats: number;
  doors: number;
  luggage: number;
  transmission: Transmission;
  fuelType: FuelType;
  ac: boolean;
  driverAvailable: boolean;
  driverOption: DriverOption;
  location: string;
  destinations: string[];
  features: string[];
  pricing: {
    type: "per-day" | "per-trip" | "per-transfer";
    dailyRateCents?: number;
    transferRateCents?: number;
    currency: string;
  };
  availability: "available" | "limited" | "booked";
  rentalConditions: string[];
  description: string;
  popular?: boolean;
}

export interface VehicleCategoryInfo {
  slug: VehicleCategory;
  label: string;
  description: string;
  image: string;
  imageAlt: string;
  seats: string;
  luggage: string;
  transmission: string;
  startingPrice: string;
}

export interface BookingSearch {
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  vehicleType: VehicleCategory | "any";
  passengers: number;
  driverOption: DriverOption;
  airportPickup: boolean;
}

export interface BookingStep {
  id: string;
  label: string;
}

const IMG = {
  hero: "/images/beaches/tokeh-beach-hero.jpg",
  economy: "/images/vehicles/economy-elantra-city.webp",
  sedan: "/images/vehicles/sedan-camry-parked.webp",
  suv: "/images/vehicles/suv-rav4-mountains.webp",
  fourx4: "/images/vehicles/4x4-hilux-mud-trail.webp",
  van: "/images/vehicles/van-hiace-street.webp",
  minibus: "/images/vehicles/minibus-group-boarding.webp",
  luxury: "/images/vehicles/luxury-sclass-office.webp",
  bus: "/images/vehicles/bus-touring-coach.webp",
  economyCorolla: "/images/vehicles/economy-corolla-beachfront.webp",
  sedanCamry: "/images/vehicles/sedan-camry-highway.webp",
  suvLandCruiser: "/images/vehicles/suv-land-cruiser-coast.webp",
  fourx4Hilux: "/images/vehicles/4x4-suv-dirt-road.webp",
  vanHiace: "/images/vehicles/van-airport-minivan.webp",
  minibusCoaster: "/images/vehicles/minibus-rural-road.webp",
  luxuryEclass: "/images/vehicles/luxury-eclass-white.webp",
  busTourismo: "/images/vehicles/bus-luxury-coach-blue.webp",
  airport: "/images/cities/freetown-city-tour-fb.jpg",
  family: "/images/beaches/river-number-two-beach.jpg",
  adventure: "/images/mountains/mount-bintumani.jpg",
  group: "/images/culture/sierra-leone-big-market.jpg",
  business: "/images/mice/atlantic-hotel.jpg",
};

export const vehicleCategories: VehicleCategoryInfo[] = [
  {
    slug: "economy",
    label: "Economy",
    description: "Affordable everyday travel around Freetown and short distances.",
    image: IMG.economy,
    imageAlt: "Economy sedan for private tours and city travel in Sierra Leone",
    seats: "4 seats",
    luggage: "2 bags",
    transmission: "Manual / Auto",
    startingPrice: "From $35/day",
  },
  {
    slug: "sedan",
    label: "Sedan",
    description: "Comfortable city and intercity travel with air conditioning.",
    image: IMG.sedan,
    imageAlt: "Comfortable sedan for city and intercity travel",
    seats: "4–5 seats",
    luggage: "3 bags",
    transmission: "Auto",
    startingPrice: "From $55/day",
  },
  {
    slug: "suv",
    label: "SUV",
    description: "Perfect for families, adventure and longer journeys across Sierra Leone.",
    image: IMG.suv,
    imageAlt: "SUV suitable for family tours and travel across Sierra Leone",
    seats: "5–7 seats",
    luggage: "4–5 bags",
    transmission: "Auto",
    startingPrice: "From $80/day",
  },
  {
    slug: "4x4",
    label: "4x4",
    description: "Suitable for difficult terrain and remote destinations like Bintumani and Gola.",
    image: IMG.fourx4,
    imageAlt: "4x4 vehicle for adventure and rural tours on rugged terrain",
    seats: "4–5 seats",
    luggage: "4 bags",
    transmission: "Manual / Auto",
    startingPrice: "From $120/day",
  },
  {
    slug: "van",
    label: "Van",
    description: "Ideal for small groups and tour parties with extra luggage space.",
    image: IMG.van,
    imageAlt: "Passenger van for group airport transfers and tours",
    seats: "7–9 seats",
    luggage: "6–8 bags",
    transmission: "Manual / Auto",
    startingPrice: "From $100/day",
  },
  {
    slug: "minibus",
    label: "Minibus",
    description: "Comfortable for medium groups and airport transfers.",
    image: IMG.minibus,
    imageAlt: "Tourist minibus for group excursions and transfers",
    seats: "10–14 seats",
    luggage: "8–10 bags",
    transmission: "Manual / Auto",
    startingPrice: "From $150/day",
  },
  {
    slug: "luxury",
    label: "Luxury",
    description: "Premium transportation for special journeys and VIP travel.",
    image: IMG.luxury,
    imageAlt: "Luxury car for VIP tourism and private transfers",
    seats: "4 seats",
    luggage: "3 bags",
    transmission: "Auto",
    startingPrice: "From $180/day",
  },
  {
    slug: "bus",
    label: "Bus",
    description: "Group transport for large tours, corporate events, and long-distance travel.",
    image: IMG.bus,
    imageAlt: "Tour coach for large tourist groups and corporate travel",
    seats: "25–40 seats",
    luggage: "20+ bags",
    transmission: "Manual / Auto",
    startingPrice: "From $350/day",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "toyota-corolla-economy",
    name: "Toyota Corolla",
    category: "economy",
    image: IMG.economyCorolla,
    imageAlt: "Toyota Corolla economy sedan for private tours in Sierra Leone",
    gallery: [{ src: IMG.economyCorolla, alt: "Toyota Corolla economy sedan" }],
    seats: 4,
    doors: 4,
    luggage: 2,
    transmission: "manual",
    fuelType: "petrol",
    ac: true,
    driverAvailable: true,
    driverOption: "both",
    location: "Freetown",
    destinations: ["freetown", "freetown-peninsula", "banana-island"],
    features: ["Air Conditioning", "Bluetooth", "USB Charging", "Fuel Efficient"],
    pricing: { type: "per-day", dailyRateCents: 3500, currency: "USD" },
    availability: "available",
    rentalConditions: ["Valid driving license required for self-drive", "Fuel not included", "Minimum rental: 1 day"],
    description: "Reliable economy vehicle ideal for city travel and short-distance trips around Freetown and the peninsula.",
    popular: true,
  },
  {
    id: "toyota-camry-sedan",
    name: "Toyota Camry",
    category: "sedan",
    image: IMG.sedanCamry,
    imageAlt: "Toyota Camry sedan for comfortable intercity travel",
    gallery: [{ src: IMG.sedanCamry, alt: "Toyota Camry sedan on the road" }],
    seats: 5,
    doors: 4,
    luggage: 3,
    transmission: "automatic",
    fuelType: "petrol",
    ac: true,
    driverAvailable: true,
    driverOption: "both",
    location: "Freetown",
    destinations: ["freetown", "freetown-peninsula", "bo", "kenema"],
    features: ["Air Conditioning", "Automatic Transmission", "Bluetooth", "Leather Seats", "USB Charging"],
    pricing: { type: "per-day", dailyRateCents: 5500, currency: "USD" },
    availability: "available",
    rentalConditions: ["Valid driving license required for self-drive", "Fuel not included", "Minimum rental: 1 day"],
    description: "Comfortable sedan for city and intercity travel. Smooth automatic transmission with premium comfort features.",
    popular: true,
  },
  {
    id: "toyota-land-cruiser",
    name: "Toyota Land Cruiser",
    category: "suv",
    image: IMG.suvLandCruiser,
    imageAlt: "Toyota Land Cruiser SUV for family tours and adventure travel",
    gallery: [{ src: IMG.suvLandCruiser, alt: "Toyota Land Cruiser SUV on coastal road" }],
    seats: 7,
    doors: 4,
    luggage: 5,
    transmission: "automatic",
    fuelType: "diesel",
    ac: true,
    driverAvailable: true,
    driverOption: "both",
    location: "Freetown",
    destinations: ["freetown", "bintumani", "wara-wara", "bumbuna-falls", "gola"],
    features: ["4WD", "Air Conditioning", "Roof Rack", "Bluetooth", "USB Charging", "Spacious Interior"],
    pricing: { type: "per-day", dailyRateCents: 8000, currency: "USD" },
    availability: "available",
    rentalConditions: ["4WD experience recommended for self-drive", "Fuel not included", "Minimum rental: 1 day", "Additional insurance required for off-road"],
    description: "Powerful SUV perfect for families, adventure trips, and longer journeys across Sierra Leone's diverse terrain.",
    popular: true,
  },
  {
    id: "toyota-hilux-4x4",
    name: "Toyota Hilux",
    category: "4x4",
    image: IMG.fourx4Hilux,
    imageAlt: "Toyota Hilux 4x4 for rugged terrain and remote expeditions",
    gallery: [{ src: IMG.fourx4Hilux, alt: "Toyota Hilux 4x4 on dirt road" }],
    seats: 4,
    doors: 4,
    luggage: 4,
    transmission: "manual",
    fuelType: "diesel",
    ac: true,
    driverAvailable: true,
    driverOption: "both",
    location: "Makeni",
    destinations: ["bintumani", "wara-wara", "outamba-kilimi", "gola", "kono"],
    features: ["4x4", "Air Conditioning", "High Ground Clearance", "Bluetooth", "Roof Rack"],
    pricing: { type: "per-day", dailyRateCents: 12000, currency: "USD" },
    availability: "limited",
    rentalConditions: ["Experienced driver recommended for remote areas", "Fuel not included", "Minimum rental: 2 days", "Additional insurance required"],
    description: "Rugged 4x4 built for difficult terrain and remote destinations. Ideal for northern and eastern circuit expeditions.",
  },
  {
    id: "toyota-hiace-van",
    name: "Toyota Hiace",
    category: "van",
    image: IMG.vanHiace,
    imageAlt: "Toyota Hiace passenger van for group tours and airport transfers",
    gallery: [{ src: IMG.vanHiace, alt: "Toyota Hiace van for group travel" }],
    seats: 8,
    doors: 4,
    luggage: 6,
    transmission: "manual",
    fuelType: "diesel",
    ac: true,
    driverAvailable: true,
    driverOption: "with-driver",
    location: "Freetown",
    destinations: ["freetown", "bo", "kenema", "makeni", "turtle-islands"],
    features: ["Air Conditioning", "Group Seating", "Bluetooth", "USB Charging", "Extra Luggage Space"],
    pricing: { type: "per-day", dailyRateCents: 10000, currency: "USD" },
    availability: "available",
    rentalConditions: ["Driver included", "Fuel not included", "Minimum rental: 1 day", "Advance booking recommended"],
    description: "Spacious van ideal for small groups and tour parties. Comfortable seating for up to 8 passengers with ample luggage space.",
    popular: true,
  },
  {
    id: "toyota-coaster-minibus",
    name: "Toyota Coaster",
    category: "minibus",
    image: IMG.minibusCoaster,
    imageAlt: "Toyota Coaster minibus for group tours and airport transfers",
    gallery: [{ src: IMG.minibusCoaster, alt: "Toyota Coaster minibus for group travel" }],
    seats: 12,
    doors: 2,
    luggage: 8,
    transmission: "manual",
    fuelType: "diesel",
    ac: true,
    driverAvailable: true,
    driverOption: "with-driver",
    location: "Freetown",
    destinations: ["freetown", "bo", "kenema", "makeni", "turtle-islands", "banana-island"],
    features: ["Air Conditioning", "Group Seating", "Bluetooth", "USB Charging", "Extra Luggage Space"],
    pricing: { type: "per-day", dailyRateCents: 15000, currency: "USD" },
    availability: "available",
    rentalConditions: ["Driver included", "Fuel not included", "Minimum rental: 1 day", "Advance booking recommended"],
    description: "Comfortable minibus for medium groups. Perfect for airport transfers, group tours, and corporate travel.",
  },
  {
    id: "mercedes-sedan-luxury",
    name: "Mercedes-Benz E-Class",
    category: "luxury",
    image: IMG.luxuryEclass,
    imageAlt: "Mercedes-Benz E-Class luxury sedan for VIP tourism and private transfers",
    gallery: [{ src: IMG.luxuryEclass, alt: "Mercedes-Benz E-Class luxury vehicle" }],
    seats: 4,
    doors: 4,
    luggage: 3,
    transmission: "automatic",
    fuelType: "petrol",
    ac: true,
    driverAvailable: true,
    driverOption: "both",
    location: "Freetown",
    destinations: ["freetown", "freetown-peninsula", "bo", "kenema"],
    features: ["Premium Interior", "Air Conditioning", "Automatic Transmission", "Bluetooth", "Leather Seats", "USB Charging"],
    pricing: { type: "per-day", dailyRateCents: 18000, currency: "USD" },
    availability: "limited",
    rentalConditions: ["Valid driving license required for self-drive", "Fuel not included", "Minimum rental: 1 day", "Premium insurance included"],
    description: "Premium luxury sedan for special journeys and VIP travel. First-class comfort and style for business and leisure.",
  },
  {
    id: "mercedes-bus-group",
    name: "Mercedes-Benz Tourismo",
    category: "bus",
    image: IMG.busTourismo,
    imageAlt: "Mercedes-Benz Tourismo tour coach for large tourist groups",
    gallery: [{ src: IMG.busTourismo, alt: "Mercedes-Benz Tourismo luxury coach" }],
    seats: 32,
    doors: 2,
    luggage: 20,
    transmission: "manual",
    fuelType: "diesel",
    ac: true,
    driverAvailable: true,
    driverOption: "with-driver",
    location: "Freetown",
    destinations: ["freetown", "bo", "kenema", "makeni", "turtle-islands", "banana-island", "gola"],
    features: ["Air Conditioning", "Reclining Seats", "Bluetooth", "USB Charging", "Extra Luggage Space", "WC"],
    pricing: { type: "per-day", dailyRateCents: 35000, currency: "USD" },
    availability: "available",
    rentalConditions: ["Driver included", "Fuel not included", "Minimum rental: 1 day", "Advance booking essential"],
    description: "Large coach for group tours, corporate events, and long-distance travel. Fully air-conditioned with premium seating.",
  },
];

export const pickupLocations = [
  "Freetown",
  "Freetown International Airport",
  "Bo",
  "Kenema",
  "Makeni",
  "Banana Islands",
  "Tokeh Beach",
  "Tacugama",
  "Bunce Island",
  "Bumbuna Falls",
  "Tiwai Island",
  "Turtle Islands",
  "Gola Rainforest",
  "Mount Bintumani",
  "Custom Location",
];

export const destinationsList = [
  "Freetown",
  "Freetown Peninsula",
  "Banana Islands",
  "Tokeh Beach",
  "Tacugama",
  "Bunce Island",
  "Bumbuna Falls",
  "Wara Wara Mountains",
  "Mount Bintumani",
  "Bo",
  "Tiwai Island",
  "Turtle Islands",
  "Gola Rainforest",
  "Kenema",
  "Kono",
  "Custom Destination",
];

export const vehicleTypeOptions: { value: VehicleCategory | "any"; label: string }[] = [
  { value: "any", label: "All Vehicle Types" },
  { value: "economy", label: "Economy" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "4x4", label: "4x4" },
  { value: "van", label: "Van" },
  { value: "minibus", label: "Minibus" },
  { value: "luxury", label: "Luxury" },
  { value: "bus", label: "Bus" },
];

export const driverOptions: { value: DriverOption; label: string }[] = [
  { value: "both", label: "Any" },
  { value: "self-drive", label: "Self Drive" },
  { value: "with-driver", label: "With Driver" },
];

export function getVehicle(id: string) {
  return vehicles.find((v) => v.id === id);
}

export function getVehiclesForCategory(category: VehicleCategory) {
  return vehicles.filter((v) => v.category === category);
}

export function getPopularVehicles() {
  return vehicles.filter((v) => v.popular);
}

export function filterVehicles(search: Partial<BookingSearch>) {
  return vehicles.filter((v) => {
    if (search.vehicleType && search.vehicleType !== "any" && v.category !== search.vehicleType) return false;
    if (search.passengers && v.seats < search.passengers) return false;
    if (search.driverOption && search.driverOption !== "both" && v.driverOption !== search.driverOption && v.driverOption !== "both") return false;
    if (search.pickupLocation && v.location !== search.pickupLocation && !v.destinations.includes(search.pickupLocation.toLowerCase().replace(/ /g, "-"))) {
      if (search.pickupLocation !== "Custom Location" && v.location !== search.pickupLocation) return false;
    }
    if (search.destination && !v.destinations.includes(search.destination.toLowerCase().replace(/ /g, "-"))) return false;
    return true;
  });
}

export function sortVehicles(list: Vehicle[], sortBy: string) {
  const arr = [...list];
  switch (sortBy) {
    case "price-asc":
      return arr.sort((a, b) => (a.pricing.dailyRateCents ?? 0) - (b.pricing.dailyRateCents ?? 0));
    case "price-desc":
      return arr.sort((a, b) => (b.pricing.dailyRateCents ?? 0) - (a.pricing.dailyRateCents ?? 0));
    case "seats-desc":
      return arr.sort((a, b) => b.seats - a.seats);
    case "seats-asc":
      return arr.sort((a, b) => a.seats - b.seats);
    case "recommended":
    default:
      return arr.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  }
}

export function formatPrice(cents: number | undefined, currency = "USD") {
  if (cents == null) return "Request a quote";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export const bookingSteps: BookingStep[] = [
  { id: "vehicle", label: "Vehicle" },
  { id: "journey", label: "Journey" },
  { id: "services", label: "Services" },
  { id: "details", label: "Details" },
  { id: "review", label: "Review" },
  { id: "confirmation", label: "Confirmation" },
];
