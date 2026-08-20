import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { StudentProfileForm } from "@/components/student/profile-form";

export default async function StudentProfilePage() {
  const session = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { university: { select: { id: true, name: true } } },
  });

  const universities = await prisma.university.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Student workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Help agents understand what you&apos;re looking for.
        </p>
      </header>

      <StudentProfileForm
        profile={{
          firstName: session.user.name?.split(" ")[0] ?? "",
          lastName: session.user.name?.split(" ").slice(1).join(" ") ?? "",
          email: session.user.email ?? "",
          universityId: profile?.universityId ?? null,
          universityName: profile?.university?.name ?? null,
          budgetMin: profile?.budgetMin ?? null,
          budgetMax: profile?.budgetMax ?? null,
          preferredArea: profile?.preferredArea ?? null,
          moveInDate: profile?.moveInDate?.toISOString().split("T")[0] ?? null,
          roomType: profile?.roomType ?? null,
        }}
        universities={universities}
      />
    </div>
  );
}
