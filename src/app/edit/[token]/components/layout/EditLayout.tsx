// /app/edit/[token]/components/layout/EditLayout.tsx
"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { useEditor } from '@/hooks/useEditor';
import { GlobalAppHeader } from './GlobalAppHeader';
import { LeftPanel } from './LeftPanel';
import { MainContent } from './MainContent';
import { useAutoSave } from '@/hooks/useAutoSave';
import { GlobalFormBuilder } from '@/components/layout/GlobalFormBuilder';
import { LayoutChangeModal } from '../ui/LayoutChangeModal';
import { modalEmergencyReset } from '@/utils/modalEmergencyReset';
import { ModalDebugPanel } from '@/components/debug/ModalDebugPanel';
import { VariableThemeInjector } from '@/modules/Design/ColorSystem/VariableThemeInjector';
import { usesTemplateModule } from '@/types/service';
import { useTemplateModule } from '@/modules/templates/useTemplateReady';

interface EditLayoutProps {
  tokenId: string;
}


export function EditLayout({ tokenId }: EditLayoutProps) {
  // Get store context and state
  const { store } = useEditStoreContext();
  
  // Use selectors for state
  const leftPanel = useStoreState(state => state.leftPanel);
  const mode = useStoreState(state => state.mode);

  // Get actions from store
  const storeState = store?.getState();
  const {
    updateViewportInfo,
    handleKeyboardShortcut,
    getColorTokens,
  } = storeState || {};
  
  // Get theme and background system for variable integration
  const theme = useStoreState(state => state.theme);
  const onboardingData = useStoreState(state => state.onboardingData);

  // Template-backed projects (Meridian/Hearth/Lex) theme via CSS vars on :root,
  // injected by the template's own ThemeInjector — NOT the legacy product
  // VariableThemeInjector. Mirror LandingPageRenderer so edit == preview/published.
  const audienceType = useStoreState(state => state.audienceType);
  const templateId = useStoreState(state => state.templateId);
  const variantId = useStoreState(state => state.variantId);
  const paletteId = useStoreState(state => state.paletteId);
  // Neutral mood (vestria bone/slate) — lives in Project.themeValues.mood.
  // Select the scalar (string identity → reactive to loadFromDraft hydration
  // AND the VestriaThemePopover's updateMeta({themeValues}) live toggle).
  const mood = useStoreState(
    state => (state.themeValues as Record<string, any> | null)?.mood as string | undefined
  );
  const usesTemplate = usesTemplateModule(audienceType, templateId);
  const { tmpl } = useTemplateModule(audienceType, templateId);
  const effectivePalette = (paletteId as any) || tmpl?.defaultPaletteId;
  const effectiveVariant = (variantId as any) || tmpl?.defaultVariantId;

  // Initialize unified editor system
  const editor = useEditor();

  useAutoSave({
    enableAutoSave: true,
  });

  const colorTokens = getColorTokens ? getColorTokens() : {};
  
  // Prepare background system for variable theme injector
  const backgroundSystem = React.useMemo(() => {
    if (!theme?.colors?.sectionBackgrounds) return undefined;
    
    return {
      primary: theme.colors.sectionBackgrounds.primary || 'bg-gray-800',
      secondary: theme.colors.sectionBackgrounds.secondary || 'bg-gray-50',
      neutral: theme.colors.sectionBackgrounds.neutral || 'bg-white',
      baseColor: theme.colors.baseColor,
      accentColor: theme.colors.accentColor,
      accentCSS: theme.colors.accentCSS || 'bg-purple-600',
    };
  }, [theme]);

  // Handle responsive viewport changes
  useEffect(() => {
    const handleResize = () => {
      updateViewportInfo?.();
    };

    window.addEventListener('resize', handleResize);
    
    // Initial viewport setup
    updateViewportInfo?.();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateViewportInfo]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyboardShortcut?.(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyboardShortcut]);

  // Initialize modal emergency reset on component mount
  useEffect(() => {
    // This ensures the emergency reset is available
    modalEmergencyReset.enableDiagnosticMode();
  }, []);

  // Prevent context menu in edit mode for cleaner UX
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    if (mode !== 'preview') {
      event.preventDefault();
    }
  }, [mode]);

  // ──────────────────────────────────────────────────────────────────────────
  // `.app-chrome` ATTACH MAP (phase 3) — read before adding/moving a wrapper.
  //
  // `.app-chrome` re-bases font-family (Onest) + ink. It MUST wrap chrome only.
  // If it ever wraps the CANVAS, generated blocks inherit the app font in the
  // EDITOR but not when published → editor↔published divergence (a known past
  // incident: docs/architecture/phase11aArchitectureGaps.md, dual-renderer).
  //
  // Attached to exactly three regions, each a LEAF-side wrapper:
  //   1. the top-bar wrapper        (GlobalAppHeader — the single t1 bar)
  //   2. the rail wrapper           (LeftPanel)
  //   3. the modal roots            (GlobalFormBuilder / LayoutChangeModal
  //                                  / ModalDebugPanel)
  //
  // PHASE 4 CHANGED THIS MAP: there used to be a FOURTH attach point around a
  // nested <EditHeader> inside the right content column. That row is gone —
  // collapsed into the single bar (#1) — so the wrapper went with it. The right
  // content column still must NEVER carry `.app-chrome`: it holds <MainContent>,
  // the canvas. Wrapping the column would put the canvas inside .app-chrome.
  // That is the whole hazard; it is why the bar spans the frame instead.
  //
  // The `shell` root below deliberately does NOT carry `.app-chrome`: it is the
  // canvas's ancestor. It keeps its Inter base, which the canvas inherits today.
  // ──────────────────────────────────────────────────────────────────────────
  const shell = (
      <div
        className="h-screen flex flex-col bg-app-frame font-inter"
        onContextMenu={handleContextMenu}
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
      {/* THE editor bar (t1): one 56px full-width row ABOVE the rail — it spans
          the frame, which is why the rail starts below it. */}
      <div className="app-chrome flex-none">
        <GlobalAppHeader tokenId={tokenId} />
      </div>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Collapsible */}
        <div
          className={`
            app-chrome
            transition-all duration-300 ease-in-out border-r border-app-border-frame bg-app-surface
            ${leftPanel.collapsed
              ? 'w-12 lg:w-12'
              : `w-[${leftPanel.width}px]`
            }
            lg:relative absolute lg:static z-40
            ${leftPanel.collapsed ? '' : 'shadow-lg lg:shadow-none'}
          `}
          style={{
            width: leftPanel.collapsed ? '48px' : `${leftPanel.width}px`,
            maxWidth: leftPanel.collapsed ? '48px' : '500px',
            minWidth: leftPanel.collapsed ? '48px' : '250px',
          }}
        >
          <LeftPanel />
        </div>

        {/* Mobile Overlay for Left Panel */}
        {!leftPanel.collapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden"
            onClick={() => storeState?.toggleLeftPanel?.()}
          />
        )}

        {/* Right Content Area.
            NOT `.app-chrome`, and it no longer contains any chrome to justify it:
            <MainContent> (the editor CANVAS) is all that lives here now that the
            second header row is collapsed into the bar. See the attach map. */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Main Content Area — CANVAS. Must stay outside every .app-chrome. */}
          <MainContent tokenId={tokenId} />
        </div>
      </div>

      {/* Live Region for Screen Reader Announcements */}
      <div
        id="edit-store-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="absolute -left-[10000px] w-px h-px overflow-hidden"
      />
      
      {/* Modal roots — chrome, so `.app-chrome`. Zero-size wrapper: every modal
          inside renders fixed/portalled, so this adds no layout box; it exists
          only to give in-place (non-portalled) modal DOM the app font. */}
      <div className="app-chrome contents">
        {/* MVP Form Builder Modal */}
        <GlobalFormBuilder />

        {/* Layout Change Modal */}
        <LayoutChangeModal />

        {/* Modal Debug Panel - Only in development */}
        {process.env.NODE_ENV === 'development' && <ModalDebugPanel />}
      </div>
      </div>
  );

  // Template-backed projects: theme via the template's own ThemeInjector (CSS
  // vars on :root) so the editor matches preview/published. Until the module
  // loads, render the shell un-themed (blocks fall back briefly) rather than
  // blanking the whole editor chrome.
  if (usesTemplate) {
    if (!tmpl) return shell;
    const ThemeInjector = tmpl.ThemeInjector;
    return (
      <ThemeInjector
        paletteId={effectivePalette}
        variantId={effectiveVariant}
        // Neutral mood (vestria) — undefined for other templates / unset
        // drafts; injectors default it (bone). Mirrors LandingPageRenderer.
        mood={mood}
      >
        {shell}
      </ThemeInjector>
    );
  }

  // Legacy product projects: keep the variable-based product theme injector.
  return (
    <VariableThemeInjector
      tokenId={tokenId}
      backgroundSystem={backgroundSystem}
      businessContext={onboardingData}
    >
      {shell}
    </VariableThemeInjector>
  );
}