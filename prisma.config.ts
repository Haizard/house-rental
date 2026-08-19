import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL
  ?? process.env.supabase_session_pooler
  ?? process.env.supabase_transaction_pooler
  ?? process.env.supabase_direct_connection_string
  ?? "postgresql://localhost:5432/house_rental";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: databaseUrl },
});
