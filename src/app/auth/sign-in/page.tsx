"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (result?.error) {
      setError("The email or password is not correct.");
      setPending(false);
      return;
    }
    router.push("/student/dashboard");
  }

  return <main className="flex min-h-screen items-center justify-center px-4 py-8"><section className="glass-surface w-full max-w-md p-6 sm:p-8"><Link className="text-sm font-medium text-[var(--accent)]" href="/">Nyumba Nearby</Link><h1 className="mt-10 text-3xl font-bold">Welcome back</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Sign in to manage saved homes and conversations.</p><form className="mt-8 space-y-4" onSubmit={handleSubmit}><label className="block text-sm font-medium">Email<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="email" type="email" autoComplete="email" required /></label><label className="block text-sm font-medium">Password<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="password" type="password" autoComplete="current-password" minLength={8} required /></label>{error && <p className="text-sm text-red-600" role="alert">{error}</p>}<button className="button button-primary w-full" disabled={pending} type="submit">{pending ? "Signing in..." : "Sign in"}</button></form><p className="mt-6 text-center text-sm text-[var(--text-secondary)]">New here? <Link className="font-medium text-[var(--accent)]" href="/auth/register">Create a student account</Link></p><p className="mt-2 text-center text-sm text-[var(--text-secondary)]">Are you a housing agent? <Link className="font-medium text-[var(--accent)]" href="/auth/agent-signup">Join as an agent</Link></p></section></main>;
}
