/**
 * creditsBlockedBus — the seam between "an AI op was refused for credits" and
 * "the user is told about it" (billing-beta phase 4).
 *
 * WHY A BUS: the editor's AI actions live in the zustand store slice
 * (`src/hooks/editStore/aiActions.ts`), which has no React tree to render into,
 * and there is NO app-wide toast/modal root to reach for (the editor's
 * ToastProvider is editor-scoped; the dashboard mounts its own). Rather than
 * invent a global root or widen the store shape, the store EMITS and a mounted
 * host (`CreditsBlockedHost`) RENDERS. Same idiom as the editor's toast
 * singleton (`src/app/edit/[token]/components/ui/useToast.ts`), but with a Set
 * of listeners instead of one setter, so a stale unmounted host can never
 * swallow an event.
 *
 * ⚠️ An emit with NO subscriber is a silent block — exactly the bug this slice
 * exists to kill. Any tree that can spend credits must mount a host; the e2e
 * (`e2e/billing-beta.spec.ts`) is what proves the editor's host is really
 * mounted+subscribed. Vitests on either end alone cannot see that.
 *
 * Client-safe: no prisma, no React, no `@/` alias in the module graph.
 */

import type { InsufficientCreditsInfo } from './insufficientCredits';

/** What the host needs to render the modal. Either number may be absent — the
 *  normalizer returns `{}` for a 402 with an unrecognized body. */
export type CreditsBlockedEvent = InsufficientCreditsInfo;

type Listener = (event: CreditsBlockedEvent) => void;

const listeners = new Set<Listener>();

/** Subscribe; returns an unsubscribe fn (effect-cleanup shaped). */
export function subscribeCreditsBlocked(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Announce a credit block. NEVER throws: it is called from `catch`-adjacent
 * paths in the store, and a listener blowing up must not convert "blocked" into
 * an unrelated crash (or worse, swallow the original error).
 */
export function emitCreditsBlocked(event: CreditsBlockedEvent): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // A broken host must not break the op that reported the block.
    }
  }
}

/** Test-only: drop all listeners between cases. */
export function __resetCreditsBlockedBus(): void {
  listeners.clear();
}
