// /app/edit/[token]/components/layout/LeftPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { ElementLibrary } from '../panels/ElementLibrary';
import { InputVariables } from '../panels/InputVariables';
import { CopywritingGuide } from '../panels/CopywritingGuide';
import { AIControls } from '../panels/AIControls';

interface LeftPanelProps {
  tokenId: string;
}

interface TabConfig {
  id: 'pageStructure' | 'inputVariables' | 'copywritingGuide' | 'aiControls';
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function LeftPanel({ tokenId }: LeftPanelProps) {
  const {
    leftPanel,
    sections,
    onboardingData,
    setLeftPanelTab,
    setLeftPanelWidth,
    getColorTokens,
  } = useEditStore();

  const colorTokens = getColorTokens();
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(leftPanel.width);

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'pageStructure',
      label: 'Elements',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      badge: sections.length,
    },
    {
      id: 'inputVariables',
      label: 'Inputs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: Object.keys(onboardingData.validatedFields || {}).length,
    },
    {
      id: 'copywritingGuide',
      label: 'Guide',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'aiControls',
      label: 'AI',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanel.width;
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(250, Math.min(500, startWidthRef.current + deltaX));
    setLeftPanelWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Cleanup resize listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  if (leftPanel.collapsed) {
    return null;
  }

  return (
    <aside className="h-full flex flex-col bg-white">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeftPanelTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center px-2 py-3 text-xs font-medium transition-colors relative
                ${leftPanel.activeTab === tab.id
                  ? `text-blue-600 bg-blue-50 border-b-2 border-blue-600`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-selected={leftPanel.activeTab === tab.id}
              role="tab"
            >
              <div className="flex items-center justify-center mb-1 relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-center leading-tight">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {leftPanel.activeTab === 'pageStructure' && (
          <ElementLibrary tokenId={tokenId} />
        )}
        {leftPanel.activeTab === 'inputVariables' && (
          <InputVariables tokenId={tokenId} />
        )}
        {leftPanel.activeTab === 'copywritingGuide' && (
          <CopywritingGuide />
        )}
        {leftPanel.activeTab === 'aiControls' && (
          <AIControls tokenId={tokenId} />
        )}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className={`
          absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-600 transition-colors z-10
          ${isResizing ? 'bg-blue-600' : 'bg-transparent hover:bg-gray-300'}
        `}
        onMouseDown={handleResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
      />

      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute top-0 right-0 w-px h-full bg-blue-600 shadow-lg z-20" />
      )}
    </aside>
  );
}