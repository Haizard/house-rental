import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL
  ?? process.env.supabase_session_pooler
  ?? process.env.supabase_transaction_pooler;

if (!connectionString) throw new Error("DATABASE_URL or a Supabase pooler connection must be set before using Prisma.");

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5_000 }),
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
