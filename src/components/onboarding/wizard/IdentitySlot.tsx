'use client';

// scale-06 phase 3 — IDENTITY slot (WHO/WHAT: name + one-liner).
// Thin wrapper over the shared SlotBody; fields come from the engine contract
// (slot === 'identity'), copy from the businessType wizardFields / defaults.

import { SlotBody } from './SlotReviewCard';

export default function IdentitySlot() {
  return (
    <SlotBody
      slot="identity"
      title="Let's start with the basics"
      description="Confirm what this is, or fix it."
    />
  );
}
