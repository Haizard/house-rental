"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

export function SaveListingButton({ listingId, initialSaved = false, title }: { listingId: string; initialSaved?: boolean; title: string }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggleSaved() {
    setPending(true);
    const response = await fetch(`/api/listings/${listingId}/save`, { method: saved ? "DELETE" : "POST" });
    if (response.ok) setSaved(!saved);
    setPending(false);
  }

  return <button className="save-button" type="button" aria-label={`${saved ? "Remove" : "Save"} ${title}`} aria-pressed={saved} disabled={pending} onClick={toggleSaved}><Heart size={17} fill={saved ? "currentColor" : "none"} aria-hidden="true" /></button>;
}
