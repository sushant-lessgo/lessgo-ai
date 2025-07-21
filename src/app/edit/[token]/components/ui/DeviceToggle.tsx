// /app/edit/[token]/components/ui/DeviceToggle.tsx
"use client";

import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

export function DeviceToggle() {
  const { globalSettings, /* setGlobalSettings */ } = useEditStore();

  const devices = [
    { id: 'desktop', label: 'Desktop', icon: '🖥️', width: '100%' },
    { id: 'tablet', label: 'Tablet', icon: '📱', width: '768px' },
    { id: 'mobile', label: 'Mobile', icon: '📱', width: '375px' },
  ];

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {devices.map((device) => (
        <button
          key={device.id}
          onClick={() => {
            // setGlobalSettings({ deviceMode: device.id as any });
            console.log('Device mode changed to:', device.id);
          }}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${globalSettings.deviceMode === device.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
          title={`Preview in ${device.label}`}
        >
          <span className="hidden sm:inline">{device.label}</span>
          <span className="sm:hidden">{device.icon}</span>
        </button>
      ))}
    </div>
  );
}