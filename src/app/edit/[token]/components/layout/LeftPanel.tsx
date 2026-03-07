// app/edit/[token]/components/layout/LeftPanel.tsx - Section Outline + Read-only Inputs + Review Checklist
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { FIELD_DISPLAY_NAMES, HIDDEN_FIELD_DISPLAY_NAMES, type CanonicalFieldName } from '@/types/core/index';
import { useReviewState } from '@/hooks/useReviewState';

interface LeftPanelProps {
  tokenId: string;
}

const getSectionLabel = (sectionId: string): string => {
  const type = sectionId.split('-')[0];
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const sanitizeValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return String((value as { value: unknown }).value || '');
  }
  return String(value || '');
};

const SECTION_ICONS: Record<string, string> = {
  header: '🔝', hero: '🚀', features: '✨', testimonials: '💬',
  cta: '🎯', faq: '❓', footer: '🔚', pricing: '💰',
  results: '📊', objection: '🛡️', howitworks: '⚙️', founder: '👤',
  beforeafter: '🔄', custom: '🔧',
};

// ---------------------------------------------------------------------------
// ReviewChecklist — shown when leftPanel.activeTab === 'review'
// ---------------------------------------------------------------------------

function ReviewChecklist() {
  const { reviewItems, confirmItem, unconfirmItem, isConfirmed, getItemsBySectionId } = useReviewState();
  const sections = useStoreState(state => state.sections);
  const { store } = useEditStoreContext();

  const itemsBySection = getItemsBySectionId();

  const handleBack = () => {
    store?.getState()?.setLeftPanelTab('pageStructure');
  };

  const handleItemClick = (sectionId: string, elementKey: string) => {
    const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`);
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const el = sectionEl?.querySelector(`[data-element-key="${elementKey}"]`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleConfirmToggle = (sectionId: string, elementKey: string) => {
    if (isConfirmed(sectionId, elementKey)) {
      unconfirmItem(sectionId, elementKey);
    } else {
      confirmItem(sectionId, elementKey);
    }
  };

  if (reviewItems.length === 0) {
    return (
      <div className="p-3">
        <button
          onClick={handleBack}
          className="text-xs text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1"
        >
          <span>←</span> Back to sections
        </button>
        <p className="text-sm text-gray-400 px-2">No items to review.</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <button
        onClick={handleBack}
        className="text-xs text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1"
      >
        <span>←</span> Back to sections
      </button>

      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
        Review Checklist
      </h3>

      {sections.map(sectionId => {
        const items = itemsBySection.get(sectionId);
        if (!items?.length) return null;

        const sectionType = sectionId.split('-')[0].toLowerCase();

        return (
          <div key={sectionId} className="mb-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
              <span>{SECTION_ICONS[sectionType] || '📄'}</span>
              {getSectionLabel(sectionId)}
            </div>
            <div className="space-y-0.5">
              {items.map(item => {
                const confirmed = isConfirmed(item.sectionId, item.elementKey);
                return (
                  <div
                    key={`${item.sectionId}::${item.elementKey}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group transition-opacity ${confirmed ? 'opacity-50' : ''}`}
                  >
                    {/* Severity dot */}
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.severity === 'high' ? 'bg-red-500' : item.severity === 'config' ? 'bg-blue-500' : 'bg-amber-400'
                      }`}
                      title={
                        item.severity === 'high' ? 'Verify — AI-generated data'
                          : item.severity === 'config' ? 'Set up — needs configuration'
                          : 'Add yours — placeholder content'
                      }
                    />

                    {/* Element name — click to scroll */}
                    <button
                      onClick={() => handleItemClick(item.sectionId, item.elementKey)}
                      className={`text-sm text-left flex-1 truncate transition-colors ${
                        confirmed
                          ? 'line-through text-gray-400'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                      title={`Scroll to ${item.displayName}`}
                    >
                      {item.displayName}
                    </button>

                    {/* Confirm toggle */}
                    <button
                      onClick={() => handleConfirmToggle(item.sectionId, item.elementKey)}
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors text-xs ${
                        confirmed
                          ? 'bg-green-100 text-green-600 border border-green-200'
                          : 'border border-gray-300 text-transparent hover:border-green-400 hover:text-green-400'
                      }`}
                      title={confirmed ? 'Unmark as reviewed' : 'Mark as reviewed'}
                    >
                      ✓
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeftPanel
// ---------------------------------------------------------------------------

export function LeftPanel({ tokenId }: LeftPanelProps) {
  const router = useRouter();
  const { store } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);
  const onboardingData = useStoreState(state => state.onboardingData);
  const sections = useStoreState(state => state.sections);

  const storeState = store?.getState();
  const setLeftPanelWidth = storeState?.setLeftPanelWidth;
  const toggleLeftPanel = storeState?.toggleLeftPanel;

  const [isResizing, setIsResizing] = useState(false);
  const [inputsExpanded, setInputsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isReviewMode = leftPanel.activeTab === 'review';

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

  // Prepare read-only input fields
  const validatedEntries = Object.entries(onboardingData.validatedFields || {})
    .map(([key, value]) => ({
      label: FIELD_DISPLAY_NAMES[key as CanonicalFieldName] || key,
      value: sanitizeValue(value),
    }))
    .filter(f => f.value);

  const hiddenEntries = Object.entries(onboardingData.hiddenInferredFields || {})
    .map(([key, value]) => ({
      label: HIDDEN_FIELD_DISPLAY_NAMES[key] || FIELD_DISPLAY_NAMES[key as CanonicalFieldName] || key,
      value: sanitizeValue(value),
    }))
    .filter(f => f.value);

  const features = (onboardingData.featuresFromAI || []) as Array<{ feature: string; benefit?: string }>;

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
            {isReviewMode ? 'Review' : 'Page'}
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
            {isReviewMode ? 'Review' : 'Page'}
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
            <ReviewChecklist />
          ) : (
            <>
              {/* Section Outline */}
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

              {/* Divider */}
              <div className="border-t border-gray-200 mx-3" />

              {/* Your Inputs Accordion */}
              <div className="p-3">
                <button
                  onClick={() => setInputsExpanded(!inputsExpanded)}
                  className="w-full flex items-center justify-between px-2 py-2 hover:text-brand-text transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Inputs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-mutedText font-normal normal-case tracking-normal">
                      {validatedEntries.length + hiddenEntries.length + (features.length > 0 ? 1 : 0)} fields
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${inputsExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {inputsExpanded && (
                  <div className="mt-2 space-y-3 px-1">
                    {/* Product Description */}
                    {onboardingData.oneLiner && (
                      <div className="bg-brand-highlightBG border border-orange-100 rounded-lg p-3">
                        <div className="text-[10px] font-semibold text-brand-mutedText uppercase tracking-wider mb-1.5">Product Description</div>
                        <p className="text-sm text-brand-text leading-relaxed">{onboardingData.oneLiner}</p>
                      </div>
                    )}

                    {/* Validated Fields */}
                    {validatedEntries.map(({ label, value }) => (
                      <div key={label} className="px-1 py-1.5 border-b border-gray-100 last:border-b-0">
                        <div className="text-[10px] font-semibold text-brand-mutedText uppercase tracking-wider mb-0.5">{label}</div>
                        <p className="text-sm text-gray-800">{value}</p>
                      </div>
                    ))}

                    {/* Hidden Inferred Fields */}
                    {hiddenEntries.map(({ label, value }) => (
                      <div key={label} className="px-1 py-1.5 border-b border-gray-100 last:border-b-0">
                        <div className="text-[10px] font-semibold text-brand-mutedText uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                          {label}
                          <span className="text-[9px] font-bold text-brand-logo bg-blue-50 px-1 py-px rounded tracking-wide">AI</span>
                        </div>
                        <p className="text-sm text-gray-800">{value}</p>
                      </div>
                    ))}

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="px-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">Features</div>
                        <div className="flex flex-wrap gap-1.5">
                          {features.map((f, i) => (
                            <span key={i} className="text-xs bg-gray-50 text-brand-text border border-gray-200 px-2.5 py-1 rounded-full font-medium">
                              {f.feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change inputs & regenerate */}
                    <button
                      onClick={() => router.push(`/create/${tokenId}`)}
                      className="w-full mt-4 px-3 py-2.5 text-sm text-white bg-brand-accentPrimary hover:bg-orange-500 rounded-lg transition-colors text-center font-medium shadow-sm"
                    >
                      Change inputs & regenerate
                    </button>
                  </div>
                )}
              </div>
            </>
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
