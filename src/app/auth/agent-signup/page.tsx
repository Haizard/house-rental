"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export default function AgentSignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);

  async function handleAccountSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    // Step 1: Create account
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        role: "AGENT",
      }),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      setError(result?.error ?? "Unable to create account.");
      setPending(false);
      return;
    }

    // Step 2: Auto sign-in
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Account created but sign-in failed — redirect to sign-in page
      router.push("/auth/sign-in");
      return;
    }

    setStep(1);
    setPending(false);
  }

  async function handleBusinessSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/agent-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: form.get("businessName"),
        bio: form.get("bio") || undefined,
      }),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      setError(result?.error ?? "Unable to create business profile.");
      setPending(false);
      return;
    }

    router.push("/agent/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="glass-surface w-full max-w-md p-6 sm:p-8">
        <Link className="text-sm font-medium text-[var(--accent)]" href="/">
          Nyumba Nearby
        </Link>

        {step === 0 ? (
          <>
            <div className="mt-8 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <Building2 size={20} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-bold">Join as an agent</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  List properties and connect with students.
                </p>
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleAccountSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  First name
                  <input
                    className="glass-search mt-2 w-full px-3 py-3 outline-none"
                    name="firstName"
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Last name
                  <input
                    className="glass-search mt-2 w-full px-3 py-3 outline-none"
                    name="lastName"
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Email
                <input
                  className="glass-search mt-2 w-full px-3 py-3 outline-none"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  className="glass-search mt-2 w-full px-3 py-3 outline-none"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button button-primary w-full"
                disabled={pending}
                type="submit"
              >
                {pending ? "Creating account..." : "Create account"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mt-8 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-bold">Business profile</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Tell students about your agency.
                </p>
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleBusinessSubmit}>
              <label className="block text-sm font-medium">
                Business name
                <input
                  className="glass-search mt-2 w-full px-3 py-3 outline-none"
                  name="businessName"
                  placeholder="e.g. Mwanaisha Homes"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Bio (optional)
                <textarea
                  className="glass-search mt-2 min-h-20 w-full resize-y px-3 py-3 outline-none"
                  name="bio"
                  placeholder="Describe your areas and specialties"
                  maxLength={500}
                />
              </label>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button button-primary w-full"
                disabled={pending}
                type="submit"
              >
                {pending ? "Saving..." : "Complete registration"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already registered?{" "}
          <Link
            className="font-medium text-[var(--accent)]"
            href="/auth/sign-in"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
