import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { AgentProfileForm } from "@/components/agent/profile-form";

export default async function AgentProfilePage() {
  const session = await requireRole("AGENT");

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Your public profile that students see when choosing an agent.
        </p>
      </header>

      <AgentProfileForm
        profile={{
          businessName: profile?.businessName ?? "",
          bio: profile?.bio ?? "",
          photoUrl: profile?.photoUrl ?? null,
          firstName: profile?.user.firstName ?? "",
          lastName: profile?.user.lastName ?? "",
          email: profile?.user.email ?? "",
          verification: profile?.verification ?? "UNVERIFIED",
          rating: profile ? Number(profile.rating) : 0,
          totalReviews: profile?.totalReviews ?? 0,
        }}
      />
    </div>
  );
}
