// components/debug/ModalDebugPanel.tsx - Debug panel for modal issues
"use client";

import React, { useState, useEffect } from 'react';
import { modalEmergencyReset } from '@/utils/modalEmergencyReset';
import { bodyScrollLock } from '@/utils/bodyScrollLock';

export function ModalDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [lockCount, setLockCount] = useState(0);
  const [modalCount, setModalCount] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      setLockCount(bodyScrollLock.getLockCount());
      setModalCount(document.querySelectorAll('[role="dialog"]').length);
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show debug panel with Ctrl+Shift+M
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-[9999] max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Modal Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-sm"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>Body Scroll Locks: {lockCount}</div>
        <div>Active Modals: {modalCount}</div>
        <div>
          Taxonomy Manager: {(window as any).__taxonomyModalManager ? '✓' : '✗'}
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <button
          onClick={() => modalEmergencyReset.reset()}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
        >
          Emergency Reset
        </button>
        <button
          onClick={() => bodyScrollLock.forceUnlock()}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
        >
          Force Unlock Scroll
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Ctrl+Shift+Alt+R: Emergency reset
        <br />
        Ctrl+Shift+M: Toggle panel
      </div>
    </div>
  );
}