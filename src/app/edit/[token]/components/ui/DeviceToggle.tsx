// /app/edit/[token]/components/ui/DeviceToggle.tsx
"use client";

import React from 'react';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';

/**
 * Preview-mode device toggle (editor-route-consolidation phase 4).
 *
 * Only desktop + mobile are in scope: the store's `globalSettings.deviceMode`
 * is a 2-value union (`'desktop' | 'mobile'`), so the legacy tablet button was
 * dropped. Each button drives the dedicated `setDeviceMode` action (NOT the
 * generic `setGlobalSettings`) and the active device wears the raised chip.
 * Highlight reads from the `globalSettings.deviceMode` selector.
 *
 * Mounted only in preview mode (EditHeaderRightPanel). In `mobile` the editor
 * swaps the inline canvas for a true-viewport iframe (MobilePreviewFrame).
 */
export function DeviceToggle() {
  // Render-read: single scalar (no whole-store subscription).
  const deviceMode = useEditStore((s) => s.globalSettings.deviceMode);
  const storeApi = useEditStoreApi();

  const devices: { id: 'desktop' | 'mobile'; label: string }[] = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
  ];

  return (
    <div
      role="group"
      aria-label="Preview device"
      className="inline-flex flex-none items-center gap-1 rounded-app-ctl-sm bg-app-track p-[3px]"
    >
      {devices.map((device) => (
        <button
          key={device.id}
          type="button"
          aria-current={deviceMode === device.id}
          onClick={() => storeApi.getState().setDeviceMode(device.id)}
          className={`inline-flex items-center rounded-[7px] px-3 py-1 text-[13px] font-medium transition-colors ${
            deviceMode === device.id
              ? 'bg-app-surface text-app-ink shadow-app-card'
              : 'text-app-muted hover:text-app-ink'
          }`}
          title={`Preview in ${device.label}`}
        >
          {device.label}
        </button>
      ))}
    </div>
  );
}
