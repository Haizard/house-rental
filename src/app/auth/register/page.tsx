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

  return <main className="flex min-h-screen items-center justify-center px-4 py-8"><section className="glass-surface w-full max-w-md p-6 sm:p-8"><Link className="flex size-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white" href="/"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></Link><h1 className="font-t-headline text-[var(--text-primary)] mt-10 ios-title1">Create your account</h1><p className="mt-2 ios-subhead">Start saving homes and contacting local agents.</p><form className="mt-8 space-y-4" onSubmit={handleSubmit}><div className="grid gap-4 sm:grid-cols-2"><label className="block ios-subhead font-medium">First name<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="firstName" autoComplete="given-name" required /></label><label className="block ios-subhead font-medium">Last name<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="lastName" autoComplete="family-name" required /></label></div><label className="block ios-subhead font-medium">Email<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="email" type="email" autoComplete="email" required /></label><label className="block ios-subhead font-medium">Password<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>{error && <p className="text-sm text-[var(--danger)]" role="alert">{error}</p>}<button className="button button-primary w-full" disabled={pending} type="submit">{pending ? "Creating account..." : "Create account"}</button></form><p className="mt-6 text-center text-sm text-[var(--text-secondary)]">Already registered? <Link className="font-medium text-[var(--accent)]" href="/auth/sign-in">Sign in</Link></p></section></main>;
}
