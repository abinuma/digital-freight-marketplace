import "dotenv/config";
import { PrismaClient } from "../../../generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before initializing Prisma.");
}

const adapter = new PrismaNeon({ connectionString });
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
