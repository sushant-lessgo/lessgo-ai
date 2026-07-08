'use client';

// scale-06 phase 3 — OFFER slot (WHAT: the offer / next step).
// Thin wrapper over the shared SlotBody; fields come from the engine contract
// (slot === 'offer').

import { SlotBody } from './SlotReviewCard';

export default function OfferSlot() {
  return (
    <SlotBody
      slot="offer"
      title="What are you offering?"
      description="The thing the page asks people to do."
    />
  );
}
