import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-surface max-w-md p-8 text-center">
        <p className="text-6xl font-bold text-[var(--accent)]">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link className="button button-primary mt-6 px-5" href="/">
          <Home size={18} aria-hidden="true" /> Go home
        </Link>
      </div>
    </main>
  );
}
