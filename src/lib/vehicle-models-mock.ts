export const RIDE_CATEGORIES = ["Pika Padrão", "SUV", "VIP"] as const;
export type RideCategory = (typeof RIDE_CATEGORIES)[number];

export type VehicleModelRecord = {
  id: string;
  brand: string;
  model: string;
  year: number;
  bodyType: string;
  status: "ativo" | "inativo";
  category: RideCategory;
  disponivel: boolean;
  imageSrc: string;
};

/** Placeholder fleet photo (Unsplash) — same visual for all cards like the design mock. */
export const DEFAULT_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=480&q=80";

export const initialVehicleModels: VehicleModelRecord[] = [
  {
    id: "1",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    bodyType: "Sedan",
    status: "ativo",
    category: "VIP",
    disponivel: true,
    imageSrc: DEFAULT_VEHICLE_IMAGE,
  },
  {
    id: "2",
    brand: "BMW",
    model: "Série 5",
    year: 2023,
    bodyType: "Luxo",
    status: "ativo",
    category: "Pika Padrão",
    disponivel: true,
    imageSrc: DEFAULT_VEHICLE_IMAGE,
  },
  {
    id: "3",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    bodyType: "Sedan",
    status: "inativo",
    category: "Pika Padrão",
    disponivel: false,
    imageSrc: DEFAULT_VEHICLE_IMAGE,
  },
  {
    id: "4",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    bodyType: "Sedan",
    status: "ativo",
    category: "SUV",
    disponivel: true,
    imageSrc: DEFAULT_VEHICLE_IMAGE,
  },
  {
    id: "5",
    brand: "Tesla",
    model: "Modelo 3",
    year: 2024,
    bodyType: "Sedan",
    status: "inativo",
    category: "Pika Padrão",
    disponivel: false,
    imageSrc: DEFAULT_VEHICLE_IMAGE,
  },
  {
    id: "6",
    brand: "Hyundai",
    model: "i30",
    year: 2020,
    bodyType: "Hatch",
    status: "inativo",
    category: "SUV",
    disponivel: false,
    imageSrc: DEFAULT_VEHICLE_IMAGE,
  },
];

export const BODY_TYPES = ["Sedan", "Luxo", "Hatch", "SUV", "Minivan"] as const;
