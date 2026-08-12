import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for seeding.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    // Console trace S0-SEED-001: seed connectivity is verified without emitting author content.
    console.log(JSON.stringify({ level: "info", step: "S0-SEED-001", event: "seed.connectivity_check" }));
    await prisma.$queryRaw`SELECT 1`;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
