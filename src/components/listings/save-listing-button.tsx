"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { haptic } from "@/lib/ui/haptics";

export function SaveListingButton({ listingId, initialSaved = false, title }: { listingId: string; initialSaved?: boolean; title: string }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggleSaved() {
    setPending(true);
    const response = await fetch(`/api/listings/${listingId}/save`, { method: saved ? "DELETE" : "POST" });
    if (response.ok) {
      setSaved(!saved);
      haptic(saved ? "light" : "success");
    }
    setPending(false);
  }

  return <button className="save-button" type="button" aria-label={`${saved ? "Remove" : "Save"} ${title}`} aria-pressed={saved} disabled={pending} onClick={toggleSaved}><Heart size={17} fill={saved ? "currentColor" : "none"} className={saved ? "animate-heart-pop" : ""} aria-hidden="true" /></button>;
}
