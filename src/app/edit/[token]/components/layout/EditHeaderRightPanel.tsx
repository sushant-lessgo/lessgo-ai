// /app/edit/[token]/components/layout/EditHeaderRightPanel.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { UndoRedoButtons } from '../ui/UndoRedoButtons';
import { ResetButton } from '../ui/ResetButton';
import { PreviewButton } from '../ui/PreviewButton';

interface EditHeaderRightPanelProps {
  tokenId: string;
}

function RegenCopyConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Regenerate All Copy
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This will regenerate all page copy using the same inputs and strategy. Your text edits will be lost.
              </p>
              <button
                onClick={onConfirm}
                className="w-full text-left px-4 py-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="font-medium text-amber-900">Regenerate Copy</div>
                <div className="text-sm text-amber-700">All section text will be rewritten</div>
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditHeaderRightPanel({ tokenId }: EditHeaderRightPanelProps) {
  const { regenerateAllContent, aiGeneration } = useEditStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const isGenerating = aiGeneration?.isGenerating ?? false;
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const prevGenerating = useRef(isGenerating);

  // Detect regen completion → show toast
  useEffect(() => {
    if (prevGenerating.current && !isGenerating) {
      const hasErrors = (aiGeneration?.errors?.length ?? 0) > 0;
      setToast({
        type: hasErrors ? 'error' : 'success',
        message: hasErrors ? 'Some sections failed to regenerate' : 'Copy regenerated',
      });
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
    prevGenerating.current = isGenerating;
  }, [isGenerating, aiGeneration?.errors]);

  const handleRegenConfirm = useCallback(async () => {
    setShowConfirm(false);
    try {
      await regenerateAllContent();
    } catch {
      // Error handled by store
    }
  }, [regenerateAllContent]);

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Regen Copy */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isGenerating}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${isGenerating ? 'animate-pulse bg-amber-50 border-amber-200' : ''}`}
          title="Regenerate all page copy"
        >
          {isGenerating ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span>{isGenerating ? 'Generating...' : 'Regen Copy'}</span>
        </button>

        <UndoRedoButtons />
        <ResetButton />
        <PreviewButton tokenId={tokenId} />
      </div>

      <RegenCopyConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRegenConfirm}
      />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-opacity ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
