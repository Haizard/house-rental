import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.supabase_session_pooler ?? "postgresql://localhost:5432/house_rental";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: databaseUrl },
});
