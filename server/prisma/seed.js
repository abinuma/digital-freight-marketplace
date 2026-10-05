import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/index.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed a production database.");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before seeding the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const seedUsers = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "admin@freight-marketplace.test",
    name: "Marketplace Admin",
    phone: "+251900000001",
    role: "ADMIN",
    location: "Addis Ababa",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "shipper.one@freight-marketplace.test",
    name: "Selam Logistics",
    phone: "+251900000002",
    role: "SHIPPER",
    location: "Addis Ababa",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    email: "shipper.two@freight-marketplace.test",
    name: "Blue Nile Trading",
    phone: "+251900000003",
    role: "SHIPPER",
    location: "Adama",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    email: "transporter.one@freight-marketplace.test",
    name: "Abebe Transport",
    phone: "+251900000004",
    role: "TRANSPORTER",
    location: "Addis Ababa",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    email: "transporter.two@freight-marketplace.test",
    name: "Hana Freight",
    phone: "+251900000005",
    role: "TRANSPORTER",
    location: "Dire Dawa",
  },
];

const seedVehicles = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    userId: "00000000-0000-4000-8000-000000000004",
    type: "Flatbed truck",
    capacityTons: "18.00",
    plateNumber: "DEMO-TRK-001",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    userId: "00000000-0000-4000-8000-000000000005",
    type: "Box truck",
    capacityTons: "10.00",
    plateNumber: "DEMO-TRK-002",
  },
];

function daysFromToday(offset) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

const seedShipments = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    shipperId: "00000000-0000-4000-8000-000000000002",
    goodsDescription: "Bagged coffee beans for regional distribution",
    goodsType: "Agricultural produce",
    weightKg: "8500.00",
    pickupLocation: "Addis Ababa",
    pickupLat: "9.03000",
    pickupLng: "38.74000",
    deliveryLocation: "Dire Dawa",
    deliveryLat: "9.60000",
    deliveryLng: "41.86000",
    pickupDate: daysFromToday(7),
    specialRequirements: "Keep the load dry and covered.",
    status: "PUBLISHED",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    shipperId: "00000000-0000-4000-8000-000000000003",
    goodsDescription: "Packaged household supplies",
    goodsType: "Consumer goods",
    weightKg: "3200.00",
    pickupLocation: "Adama",
    pickupLat: "8.54000",
    pickupLng: "39.27000",
    deliveryLocation: "Hawassa",
    deliveryLat: "7.06000",
    deliveryLng: "38.48000",
    pickupDate: daysFromToday(2),
    specialRequirements: null,
    status: "DRAFT",
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    shipperId: "00000000-0000-4000-8000-000000000002",
    goodsDescription: "Steel reinforcement bars for a building project",
    goodsType: "Construction materials",
    weightKg: "12000.00",
    pickupLocation: "Addis Ababa",
    pickupLat: "9.03000",
    pickupLng: "38.74000",
    deliveryLocation: "Bahir Dar",
    deliveryLat: "11.59000",
    deliveryLng: "37.39000",
    pickupDate: daysFromToday(-2),
    specialRequirements: "Use suitable load restraints.",
    status: "IN_PROGRESS",
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    shipperId: "00000000-0000-4000-8000-000000000003",
    goodsDescription: "Textile rolls delivered to a wholesale warehouse",
    goodsType: "Textiles",
    weightKg: "2400.00",
    pickupLocation: "Hawassa",
    pickupLat: "7.06000",
    pickupLng: "38.48000",
    deliveryLocation: "Addis Ababa",
    deliveryLat: "9.03000",
    deliveryLng: "38.74000",
    pickupDate: daysFromToday(-14),
    specialRequirements: null,
    status: "COMPLETED",
  },
  {
    id: "00000000-0000-4000-8000-000000000205",
    shipperId: "00000000-0000-4000-8000-000000000002",
    goodsDescription: "Empty returnable packaging",
    goodsType: "Packaging",
    weightKg: "700.00",
    pickupLocation: "Dire Dawa",
    pickupLat: "9.60000",
    pickupLng: "41.86000",
    deliveryLocation: "Addis Ababa",
    deliveryLat: "9.03000",
    deliveryLng: "38.74000",
    pickupDate: daysFromToday(-30),
    specialRequirements: null,
    status: "CANCELLED",
  },
];

async function main() {
  for (const user of seedUsers) {
    const { id, ...fields } = user;
    await prisma.user.upsert({
      where: { id },
      create: { id, ...fields, emailVerified: true },
      update: { ...fields, emailVerified: true },
    });
  }

  for (const vehicle of seedVehicles) {
    const { id, userId, ...fields } = vehicle;
    await prisma.vehicle.upsert({
      where: { userId },
      create: { id, userId, ...fields },
      update: fields,
    });
  }

  for (const shipment of seedShipments) {
    const { id, ...fields } = shipment;
    await prisma.shipment.upsert({
      where: { id },
      create: { id, ...fields },
      update: fields,
    });
  }

  console.info("Development seed complete: 1 admin, 2 shippers, 2 transporters, 2 vehicles, and 5 shipments.");
}

main()
  .catch((error) => {
    console.error("Development seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
