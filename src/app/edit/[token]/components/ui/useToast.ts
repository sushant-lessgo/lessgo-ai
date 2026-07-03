// /app/edit/[token]/components/ui/useToast.ts
"use client";

import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastState: Toast[] = [];
let setToastState: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

// ToastProvider claims the singleton explicitly on mount (parent effects run
// after children's, so the provider always wins over the auto-claim below) and
// releases it on unmount so a re-mounted editor rebinds instead of dispatching
// toasts to a dead component.
export function bindToastRoot(setter: React.Dispatch<React.SetStateAction<Toast[]>>) {
  setToastState = setter;
}
export function unbindToastRoot(setter: React.Dispatch<React.SetStateAction<Toast[]>>) {
  if (setToastState === setter) setToastState = null;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  if (!setToastState) {
    setToastState = setToasts;
    toastState = toasts;
  }

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type };
    
    if (setToastState) {
      setToastState(prev => [...prev, newToast]);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    if (setToastState) {
      setToastState(prev => prev.filter(toast => toast.id !== id));
    }
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
  };
}