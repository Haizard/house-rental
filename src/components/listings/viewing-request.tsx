"use client";

import { BookingCalendar } from "./booking-calendar";

export function ViewingRequest({
  listingId,
  agentName,
}: {
  listingId: string;
  agentName?: string;
}) {
  return <BookingCalendar listingId={listingId} agentName={agentName} />;
}
