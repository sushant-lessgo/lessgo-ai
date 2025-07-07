// /app/edit/[token]/components/ui/ResetButton.tsx
"use client";

import React, { useState } from 'react';
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
        onClick={handleResetClick}
        className="px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors border border-amber-200"
        title="Reset to original LessGo-generated design"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset</span>
        </div>
      </button>

      <ResetConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}