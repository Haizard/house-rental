"use client";

import { ArrowLeft, Bed, Clock, Crown, Loader2, MapPin, Send, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type RoomRequest = {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  propertyType: string | null;
  rentMin: number | null;
  rentMax: number | null;
  roomType: string | null;
  amenities: string[];
  moveInDate: string | null;
  expiresAt: string;
  createdAt: string;
  studentName: string;
  university: string | null;
  responseCount: number;
  hasResponded: boolean;
};

export default function AgentRequestsPage() {
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ message: string; proposedRent: string }>({ message: "", proposedRent: "" });
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/agent/room-requests")
      .then((r) => r.json())
      .then((d) => {
        setRequests(d.data ?? []);
        if (d.requiresUpgrade) setRequiresUpgrade(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRespond(requestId: string) {
    setResponding(requestId);
    try {
      const res = await fetch("/api/agent/room-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomRequestId: requestId,
          message: formData.message,
          proposedRent: formData.proposedRent ? Number(formData.proposedRent) : undefined,
        }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, hasResponded: true, responseCount: r.responseCount + 1 } : r,
          ),
        );
        setFormData({ message: "", proposedRent: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to respond");
      }
    } catch {
      alert("Network error");
    }
    setResponding(null);
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link className="button button-glass mb-6 px-4" href="/agent/dashboard">
          <ArrowLeft size={18} /> Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Room Requests</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Students post what they need — offer your best room and win the gig.
        </p>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="animate-spin text-[var(--text-secondary)]" size={24} />
          </div>
        ) : requiresUpgrade ? (
          <div className="glass-surface mt-8 rounded-2xl border border-[var(--accent)]/20 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)]">
              <Crown size={28} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Pro Feature
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Room requests are available exclusively to Pro subscribers. Upgrade to access student room requests and win more deals.
            </p>
            <Link className="button button-primary mt-5 px-4" href="/agent/upgrade">
              <Crown size={16} className="mr-1.5" /> Upgrade to Pro
            </Link>
            <Link className="button button-glass mt-3 px-4" href="/agent/dashboard">
              Back to Dashboard
            </Link>
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-surface mt-8 rounded-2xl p-10 text-center">
            <Bed size={40} className="mx-auto text-[var(--text-tertiary)]" />
            <p className="mt-4 font-medium text-[var(--text-primary)]">No open requests</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Check back soon — students are always posting new room requests.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((req) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(req.expiresAt).getTime() - Date.now()) / 86400000));
              return (
                <div key={req.id} className="glass-surface rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="font-semibold text-[var(--text-primary)]">{req.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                        {req.area && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {req.area}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {daysLeft}d left
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag size={12} /> {req.responseCount} {req.responseCount === 1 ? "response" : "responses"}
                        </span>
                      </div>
                    </div>
                    {req.university && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                        {req.university}
                      </span>
                    )}
                  </div>

                  {req.description && (
                    <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-2">{req.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {req.propertyType && (
                      <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                        {req.propertyType}
                      </span>
                    )}
                    {req.rentMin && req.rentMax && (
                      <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                        TZS {req.rentMin.toLocaleString()} – {req.rentMax.toLocaleString()}/mo
                      </span>
                    )}
                    {req.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Response form */}
                  {req.hasResponded ? (
                    <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
                      ✓ You&apos;ve responded to this request
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-black/[.07] pt-4">
                      <textarea
                        className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        rows={2}
                        placeholder="Describe the room you have that matches their needs..."
                        value={responding === req.id ? formData.message : formData.message || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                      />
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="number"
                          className="flex-1 rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                          placeholder="Proposed rent (TZS/mo)"
                          value={responding === req.id ? formData.proposedRent : formData.proposedRent || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, proposedRent: e.target.value }))}
                        />
                        <button
                          className="button button-primary px-4"
                          onClick={() => handleRespond(req.id)}
                          disabled={responding === req.id || !formData.message.trim()}
                        >
                          {responding === req.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Send size={14} />
                          )}
                          Respond
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
