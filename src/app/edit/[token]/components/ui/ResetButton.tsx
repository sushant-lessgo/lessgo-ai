// /app/edit/[token]/components/ui/ResetButton.tsx
"use client";

// PHASE 8 — reskinned to the t1 bar vocabulary. t1 draws no Reset control, but
// this one works today, so (like Regen Copy) it is restyled in place, never
// dropped: ghost bar button geometry (pad 7/10, radius 8, label 500/13) in the
// coral warning family (app-review-*, the nearest app-chrome tokens to the old
// amber — decision 3 forbids inventing a hex to snap to). The hand-drawn SVG
// becomes the Material `restore` glyph. `useResetSystem`, the `hasOriginalState`
// self-hide, the modal wiring and the scope handoff are untouched.

import React, { useState } from 'react';
import { AppIcon } from '@/components/ui/icon';
import { useResetSystem } from './useResetSystem';
import { ResetConfirmationModal } from './ResetConfirmationModal';
import type { ResetScope } from '@/types/core';

export function ResetButton() {
  const [showResetModal, setShowResetModal] = useState(false);
  const { hasOriginalState, handleResetConfirm } = useResetSystem();

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleModalConfirm = async (scope: ResetScope) => {
    await handleResetConfirm(scope);
    setShowResetModal(false);
  };

  if (!hasOriginalState) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleResetClick}
        className="inline-flex flex-none items-center gap-1.5 rounded-app-badge border border-app-review-border px-2.5 py-[7px] text-[13px] font-medium text-app-review-text transition-colors hover:bg-app-review-bg"
        title="Reset to original LessGo-generated design"
      >
        <AppIcon name="restore" size={18} />
        <span>Reset</span>
      </button>

      <ResetConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}