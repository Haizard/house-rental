import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const connectionString = process.env.supabase_session_pooler;
if (!connectionString) {
  throw new Error("supabase_session_pooler must be set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ADMIN_EMAIL = "admin@nyumbanearby.com";
const ADMIN_PASSWORD = "Admin123!";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`);
    } else {
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { role: "ADMIN" },
      });
      console.log(`🔄 Promoted ${ADMIN_EMAIL} to ADMIN`);
    }
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await hash(ADMIN_PASSWORD, 12),
      firstName: "Platform",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin created:`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   ID:       ${user.id}`);
  console.log(`\n⚠️  Change the password after first login!`);
}

main()
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
