'use client';

// scale-06 phase 3 — UNDERSTANDING slot (WHO/WHAT groups + the differentiator
// ask). Renders every contract field whose slot === 'understanding'; only
// ask-state fields render as questions, scraped/inferred as confirmable chips.

import { SlotBody } from './SlotReviewCard';

export default function UnderstandingSlot() {
  return (
    <SlotBody
      slot="understanding"
      title="Who it's for, and why you"
      description="A couple of details so the copy lands."
    />
  );
}
