"use client";

import { CreditCard, Phone, Mail, User, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

type ContactInfo = {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
};

type RevealStatus = {
  status: string;
  revealedAt: string | null;
  contactInfo: ContactInfo | null;
  fee: number;
};

interface ContactRevealProps {
  conversationId: string;
  isAgent: boolean;
}

export function ContactReveal({ conversationId, isAgent }: ContactRevealProps) {
  const [reveal, setReveal] = useState<RevealStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/chat/${conversationId}/contact-reveal`);
        if (res.ok) {
          const { data } = await res.json();
          setReveal(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [conversationId]);

  async function handleRequest() {
    setPaying(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/contact-reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef: `manual_${Date.now()}` }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setReveal(data);
      }
    } catch {
      // ignore
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="animate-spin text-[var(--text-secondary)]" size={18} />
      </div>
    );
  }

  if (!reveal) return null;

  // Already revealed — show contact card
  if (reveal.status === "REVEALED" && reveal.contactInfo) {
    return (
      <div className="glass-surface mx-4 mb-4 overflow-hidden rounded-2xl border border-emerald-200">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle size={16} />
            Contact Information Revealed
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <User size={18} className="text-[var(--accent)]" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {reveal.contactInfo.firstName} {reveal.contactInfo.lastName}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Student</p>
            </div>
          </div>
          {reveal.contactInfo.phone && (
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-[var(--accent)]" />
              <a
                href={`tel:${reveal.contactInfo.phone}`}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                {reveal.contactInfo.phone}
              </a>
            </div>
          )}
          {reveal.contactInfo.email && (
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-[var(--accent)]" />
              <a
                href={`mailto:${reveal.contactInfo.email}`}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                {reveal.contactInfo.email}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Agent: show Request Contact button
  if (isAgent) {
    return (
      <div className="glass-surface mx-4 mb-4 rounded-2xl border border-dashed border-[var(--accent)]/30 p-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
            <CreditCard size={22} className="text-[var(--accent)]" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Ready to connect with this student?
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Pay a one-time fee of{" "}
            <span className="font-semibold">TZS {reveal.fee.toLocaleString()}</span>{" "}
            to reveal their contact information.
          </p>
          <button
            className="button button-primary mt-4 w-full"
            onClick={handleRequest}
            disabled={paying}
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Processing payment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Phone size={16} />
                Request Contact — TZS {reveal.fee.toLocaleString()}
              </span>
            )}
          </button>
          <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
            This is a one-time payment per student. You&apos;ll receive their phone and email.
          </p>
        </div>
      </div>
    );
  }

  // Student: show pending/none status
  return (
    <div className="glass-surface mx-4 mb-4 rounded-2xl border border-dashed border-black/10 p-4">
      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <CreditCard size={14} />
        <p>
          Your contact information will only be shared with the agent after they complete a payment.
          You&apos;ll be notified when this happens.
        </p>
      </div>
    </div>
  );
}
