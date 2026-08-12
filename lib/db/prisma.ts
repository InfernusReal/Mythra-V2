import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { mythraPrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.mythraPrisma) {
    const env = getEnv();
    globalForPrisma.mythraPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
      transactionOptions: { maxWait: 5_000, timeout: 10_000 }
    });
  }
  return globalForPrisma.mythraPrisma;
}
