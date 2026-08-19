"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Unable to create your account.");
      setPending(false);
      return;
    }
    router.push("/auth/sign-in");
  }

  return <main className="flex min-h-screen items-center justify-center px-4 py-8"><section className="glass-surface w-full max-w-md p-6 sm:p-8"><Link className="text-sm font-medium text-[var(--accent)]" href="/">Nyumba Nearby</Link><h1 className="mt-10 text-3xl font-bold">Create your account</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Start saving homes and contacting local agents.</p><form className="mt-8 space-y-4" onSubmit={handleSubmit}><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">First name<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="firstName" autoComplete="given-name" required /></label><label className="block text-sm font-medium">Last name<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="lastName" autoComplete="family-name" required /></label></div><label className="block text-sm font-medium">Email<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="email" type="email" autoComplete="email" required /></label><label className="block text-sm font-medium">Password<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>{error && <p className="text-sm text-red-600" role="alert">{error}</p>}<button className="button button-primary w-full" disabled={pending} type="submit">{pending ? "Creating account..." : "Create account"}</button></form><p className="mt-6 text-center text-sm text-[var(--text-secondary)]">Already registered? <Link className="font-medium text-[var(--accent)]" href="/auth/sign-in">Sign in</Link></p></section></main>;
}
