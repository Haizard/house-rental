"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type User = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Users</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Search, view, and manage user accounts.
        </p>
      </header>
      <UserSearch />
    </div>
  );
}

function UserSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json().catch(() => ({ data: [] }));
      setUsers(data.data ?? []);
      setSearched(true);
    });
  }

  return (
    <>
      <form className="glass-search flex items-center gap-3 p-2" onSubmit={handleSearch}>
        <Search className="ml-2 text-[var(--accent)]" size={20} aria-hidden="true" />
        <input
          className="min-h-10 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
        />
        <button className="button button-primary min-h-10 px-4 text-sm" type="submit" disabled={pending}>
          Search
        </button>
      </form>

      {searched && (
        <div className="mt-6 space-y-3">
          {users.length === 0 ? (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              No users found.
            </div>
          ) : (
            users.map((user) => <UserRow key={user.id} user={user} />)
          )}
        </div>
      )}
    </>
  );
}

function UserRow({ user }: { user: User }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function toggleActive() {
    startTransition(async () => {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      router.refresh();
    });
  }

  return (
    <article className="glass-surface flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">
            {user.firstName} {user.lastName}
          </h3>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            {user.role.toLowerCase()}
          </span>
          {!user.isActive && (
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              suspended
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          {user.email ?? "No email"}
        </p>
      </div>
      <button
        className={`button min-h-10 px-3 text-sm ${
          user.isActive ? "button-glass" : "button-primary"
        }`}
        disabled={pending}
        type="button"
        onClick={toggleActive}
      >
        {user.isActive ? "Suspend" : "Restore"}
      </button>
    </article>
  );
}
