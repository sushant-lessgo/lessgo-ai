// /app/edit/[token]/components/layout/EditHeaderRightPanel.tsx
"use client";

import React from 'react';
import { UndoRedoButtons } from '../ui/UndoRedoButtons';
import { ResetButton } from '../ui/ResetButton';
import { PreviewButton } from '../ui/PreviewButton';

interface EditHeaderRightPanelProps {
  tokenId: string;
}

export function EditHeaderRightPanel({ tokenId }: EditHeaderRightPanelProps) {
  return (
    <div className="flex items-center space-x-3">
      <UndoRedoButtons />
      <ResetButton />
      <PreviewButton tokenId={tokenId} />
    </div>
  );
}