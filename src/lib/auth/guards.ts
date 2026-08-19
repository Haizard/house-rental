import { auth } from "@/lib/auth/config";
import type { UserRole } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";

export async function requireRole(role: UserRole) {
  const session = await auth();

  if (!session?.user) redirect("/auth/sign-in");
  if (session.user.role !== role) redirect("/");

  return session;
}
