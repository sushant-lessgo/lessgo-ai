// app/edit/[token]/components/layout/LeftPanel.tsx - Section Outline + Review Checklist
"use client";

import { useState, useEffect } from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { useReviewState } from '@/hooks/useReviewState';

const getSectionLabel = (sectionId: string): string => {
  const type = sectionId.split('-')[0];
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const SECTION_ICONS: Record<string, string> = {
  header: '🔝', hero: '🚀', features: '✨', testimonials: '💬',
  cta: '🎯', faq: '❓', footer: '🔚', pricing: '💰',
  results: '📊', objection: '🛡️', howitworks: '⚙️', founder: '👤',
  beforeafter: '🔄', custom: '🔧',
};

// ---------------------------------------------------------------------------
// GettingStartedChecklist — shown when leftPanel.activeTab === 'review'.
// Renders the curated 4-item "Getting started" guide (auto-checked from content).
// No manual ticking: `done` is derived from live content by useReviewState.
// ---------------------------------------------------------------------------

function GettingStartedChecklist() {
  const { guideTasks } = useReviewState();
  const { store } = useEditStoreContext();

  // Only surfaces the page actually has.
  const visibleTasks = guideTasks.filter(t => t.present);

  const handleBack = () => {
    store?.getState()?.setLeftPanelTab('pageStructure');
  };

  const handleTaskClick = (target?: { sectionId: string; elementKey: string }) => {
    if (!target) return;
    const { sectionId, elementKey } = target;
    const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`);
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const el = sectionEl?.querySelector(`[data-element-key="${elementKey}"]`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  return (
    <div className="p-3">
      <button
        onClick={handleBack}
        className="text-xs text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1"
      >
        <span>←</span> Back to sections
      </button>

      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
        Setup
      </h3>

      {visibleTasks.length === 0 ? (
        <p className="text-sm text-gray-400 px-2">Nothing to set up.</p>
      ) : (
        <div className="space-y-0.5">
          {visibleTasks.map(task => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task.target)}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-gray-50 group text-left transition-colors ${
                task.done ? 'opacity-60' : ''
              }`}
              title={task.target ? `Go to ${task.label}` : task.label}
            >
              {/* Auto-check state — tick when done, open circle otherwise */}
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  task.done
                    ? 'bg-green-100 text-green-600 border border-green-200'
                    : 'border border-gray-300 text-transparent'
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span
                className={`text-sm flex-1 truncate ${
                  task.done ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-gray-900'
                }`}
              >
                {task.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeftPanel
// ---------------------------------------------------------------------------

export function LeftPanel() {
  const { store } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);
  const sections = useStoreState(state => state.sections);
  const { allComplete } = useReviewState();

  const storeState = store?.getState();
  const setLeftPanelWidth = storeState?.setLeftPanelWidth;
  const toggleLeftPanel = storeState?.toggleLeftPanel;

  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hide the Setup tab entirely once every guide task is done — even if the
  // active tab is still 'review', fall back to the sections view.
  const isReviewMode = leftPanel.activeTab === 'review' && !allComplete;

  useEffect(() => setMounted(true), []);

  // Resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= 250 && newWidth <= 500) {
        setLeftPanelWidth?.(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setLeftPanelWidth]);

  const handleSectionClick = (sectionId: string) => {
    document.querySelector(`[data-section-id="${sectionId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!mounted) return null;

  if (leftPanel.collapsed) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <button
          onClick={toggleLeftPanel}
          className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
          title="Show panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="transform -rotate-90 text-xs text-gray-400 whitespace-nowrap">
            {isReviewMode ? 'Setup' : 'Page'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full bg-white border-r border-gray-200 transition-all duration-300"
      style={{ width: `${leftPanel.width}px` }}
    >
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {isReviewMode ? 'Setup' : 'Page'}
          </h2>
          <button
            onClick={toggleLeftPanel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Hide Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isReviewMode ? (
            <GettingStartedChecklist />
          ) : (
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Sections</h3>
              <div className="space-y-0.5">
                {sections.map((sectionId, index) => (
                  <button
                    key={sectionId}
                    onClick={() => handleSectionClick(sectionId)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-brand-highlightBG transition-colors text-brand-text group flex items-center gap-2.5"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 group-hover:bg-white text-xs flex-shrink-0">
                      {SECTION_ICONS[sectionId.split('-')[0].toLowerCase()] || '📄'}
                    </span>
                    <span className="truncate font-medium">{getSectionLabel(sectionId)}</span>
                    <span className="ml-auto text-[10px] text-brand-mutedText font-mono opacity-0 group-hover:opacity-100 transition-opacity">{index + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1.5 bg-gray-100 hover:bg-brand-highlightText cursor-ew-resize transition-colors flex items-center justify-center"
        onMouseDown={handleMouseDown}
        title="Resize panel"
      >
        <div className="w-px h-6 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
}
