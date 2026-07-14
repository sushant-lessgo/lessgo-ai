// app/edit/[token]/components/StoryInterviewPanel.tsx
// ============================================================================
// STORY-INTERVIEW PANEL — the minimal, working entry point for the work
// story-interview (Sugarman) tier (plan phase 6). Post-reveal only; NEVER in the
// main onboarding wizard flow (the ≤5-question ceiling is sacred).
//
// Three freeform answers → the dedicated work-copy regen route (via the
// `regenerateStoryFromInterview` store action). Only the `about` (story) section
// updates; proof/testimonials are untouched. Polish is scope-OUT.
//
// NOTE: the Brief (facts.work) is not yet carried by the editStore (phase-5
// field→facts writeback gap). Passing it through the editor is a documented
// follow-up; this panel is the UI + wiring entry point.
// ============================================================================
'use client';

import React, { useState } from 'react';
import { useEditStoreContext } from '@/components/EditProvider';
import { logger } from '@/lib/logger';

interface StoryInterviewPanelProps {
  /** The `about` (story) section id to regenerate (e.g. `about-abc12345`). */
  sectionId: string;
  /** Optional resolved Brief carrying facts.work (see NOTE above). */
  brief?: unknown;
}

export function StoryInterviewPanel({ sectionId, brief }: StoryInterviewPanelProps) {
  const { store } = useEditStoreContext();
  const [origin, setOrigin] = useState('');
  const [moment, setMoment] = useState('');
  const [belief, setBelief] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = origin.trim() && moment.trim() && belief.trim() && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      // regenerateStoryFromInterview is an additive work-copy-engine action not
      // declared on the shared EditStore actions type (that type file is out of
      // this phase's scope) — accessed via cast.
      const action = (store?.getState() as any)?.regenerateStoryFromInterview;
      if (typeof action !== 'function') {
        throw new Error('Story regeneration is unavailable.');
      }
      await action(sectionId, { origin, moment, belief }, brief);
    } catch (e) {
      logger.error('[StoryInterviewPanel] regenerate failed', e);
      setError(e instanceof Error ? e.message : 'Failed to rewrite the story.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" data-story-interview-panel>
      <h4 className="mb-1 text-sm font-semibold text-gray-900">Rewrite your story</h4>
      <p className="mb-3 text-xs text-gray-500">
        Answer three questions — we&apos;ll rewrite just your story section.
      </p>

      <label className="mb-2 block">
        <span className="mb-1 block text-xs font-medium text-gray-700">Where did the work begin?</span>
        <textarea
          className="w-full resize-y rounded border border-gray-300 p-2 text-sm"
          rows={2}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="One line on how it started."
        />
      </label>

      <label className="mb-2 block">
        <span className="mb-1 block text-xs font-medium text-gray-700">An unforgettable client moment</span>
        <textarea
          className="w-full resize-y rounded border border-gray-300 p-2 text-sm"
          rows={2}
          value={moment}
          onChange={(e) => setMoment(e.target.value)}
          placeholder="A specific scene you still remember."
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-medium text-gray-700">What do you believe about your craft?</span>
        <textarea
          className="w-full resize-y rounded border border-gray-300 p-2 text-sm"
          rows={2}
          value={belief}
          onChange={(e) => setBelief(e.target.value)}
          placeholder="The conviction behind the work."
        />
      </label>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? 'Rewriting…' : 'Rewrite story'}
      </button>
    </div>
  );
}
