'use client';

import { useEffect, useState } from 'react';
import { OutOfCreditsModal } from './OutOfCreditsModal';
import {
  subscribeCreditsBlocked,
  type CreditsBlockedEvent,
} from '@/lib/billing/creditsBlockedBus';

/**
 * CreditsBlockedHost — renders the out-of-credits modal for whatever tree it is
 * mounted in (billing-beta phase 4).
 *
 * ⚠️ MOUNT IT OR THE BLOCK IS SILENT. `creditsBlockedBus` emits into a Set of
 * listeners; with no host mounted, an emit is a no-op and the credit block
 * disappears exactly the way it did before this slice. Any tree that can spend
 * credits needs this host. Mounted today in `src/app/edit/[token]/page.tsx`
 * (inside ToastProvider). Onboarding does NOT use it — it renders an inline
 * notice instead (no modal chrome in the wizard).
 *
 * Last-emit-wins: a second block while the modal is open just refreshes the
 * numbers.
 */
export function CreditsBlockedHost() {
  const [event, setEvent] = useState<CreditsBlockedEvent | null>(null);

  useEffect(() => subscribeCreditsBlocked((e) => setEvent(e)), []);

  if (!event) return null;

  return (
    <OutOfCreditsModal
      isOpen
      onClose={() => setEvent(null)}
      creditsRequired={event.required}
      creditsAvailable={event.available}
    />
  );
}
