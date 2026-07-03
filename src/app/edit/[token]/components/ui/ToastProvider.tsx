// /app/edit/[token]/components/ui/ToastProvider.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { bindToastRoot, unbindToastRoot } from './useToast';
import { ActionToast } from './ActionToast';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Claim the useToast singleton so showToast() calls anywhere in the editor
  // tree render here (without a mounted provider they are silent no-ops).
  useEffect(() => {
    bindToastRoot(setToasts);
    return () => unbindToastRoot(setToasts);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ActionToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}
