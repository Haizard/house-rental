import { Bookmark, CalendarDays, ChevronRight, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";

export default async function StudentDashboard() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      savedListings: { include: { listing: true }, orderBy: { createdAt: "desc" }, take: 3 },
      leads: { include: { listing: true }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  return (
    <main className="min-h-screen px-4 pb-12 pt-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="glass-nav flex items-center justify-between px-4 py-3 sm:px-5">
          <Link className="font-semibold" href="/">Nyumba Nearby</Link>
          <Link className="button button-glass min-h-10 px-4" href="/search"><Search size={17} aria-hidden="true" /> Find a home</Link>
        </header>
        <section className="pb-8 pt-12">
          <p className="eyebrow">Student dashboard</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back, {session.user.name?.split(" ")[0] ?? "student"}.</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Keep track of homes you like and conversations you start.</p>
        </section>
        <section className="grid gap-3 sm:grid-cols-3">
          <DashboardLink href="#saved" icon={<Bookmark size={20} />} label="Saved homes" value={profile?.savedListings.length ?? 0} />
          <DashboardLink href="#leads" icon={<MessageCircle size={20} />} label="Active leads" value={profile?.leads.length ?? 0} />
          <DashboardLink href="#viewings" icon={<CalendarDays size={20} />} label="Viewings" value="Soon" />
        </section>
        <section id="saved" className="mt-10">
          <SectionHeading icon={<Bookmark size={19} />} title="Saved homes" href="/search" action="Browse homes" />
          {profile?.savedListings.length ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{profile.savedListings.map(({ listing }) => <div className="glass-surface p-4" key={listing.id}><h2 className="font-semibold">{listing.title}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">TZS {listing.rentAmount.toLocaleString()} / month</p></div>)}</div> : <EmptyState text="Homes you save will appear here." href="/search" action="Explore listings" />}
        </section>
        <section id="leads" className="mt-10">
          <SectionHeading icon={<MessageCircle size={19} />} title="Your leads" href="/search" action="Find an agent" />
          {profile?.leads.length ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{profile.leads.map((lead) => <div className="glass-surface p-4" key={lead.id}><h2 className="font-semibold">{lead.listing.title}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{lead.status.replaceAll("_", " ").toLowerCase()}</p></div>)}</div> : <EmptyState text="Start a conversation from a listing to create your first lead." href="/search" action="Browse listings" />}
        </section>
      </div>
    </main>
  );
}

function DashboardLink({ href, icon, label, value }: { href: string; icon: React.ReactNode; label: string; value: number | string }) {
  return <Link className="glass-surface flex items-center gap-3 p-4 transition hover:-translate-y-0.5" href={href}><span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span><span><strong className="block text-xl">{value}</strong><span className="text-sm text-[var(--text-secondary)]">{label}</span></span><ChevronRight className="ml-auto text-[var(--text-tertiary)]" size={18} aria-hidden="true" /></Link>;
}

function SectionHeading({ icon, title, href, action }: { icon: React.ReactNode; title: string; href: string; action: string }) {
  return <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-bold">{icon}{title}</h2><Link className="text-sm font-medium text-[var(--accent)]" href={href}>{action}</Link></div>;
}

function EmptyState({ text, href, action }: { text: string; href: string; action: string }) {
  return <div className="glass-surface mt-4 p-6"><p className="text-sm text-[var(--text-secondary)]">{text}</p><Link className="button button-glass mt-4 px-4" href={href}>{action}</Link></div>;
}
