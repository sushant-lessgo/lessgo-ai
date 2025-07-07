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