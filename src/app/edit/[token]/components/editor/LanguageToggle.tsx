// src/app/edit/[token]/components/editor/LanguageToggle.tsx
// i18n-phase-1 (Phase 4) — editor language toggle.
//
// ONE toggle, no side-by-side (spec decision 3): clicking a pill sets the
// store's `activeLocale`; every Editable re-renders to that locale because the
// 3b read-site threading resolves overlay text keyed on `activeLocale`.
// Visible ONLY when the project declares >1 locale (isMultiLocale) — a legacy /
// single-locale project sees no pills at all (byte-identical editing surface).
'use client';

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { isMultiLocale } from '@/lib/i18n/localeContent';
import { LOCALE_DISPLAY_NAMES, localeLabel } from '@/lib/i18n/localeNames';

// language-settings phase 1: the display-name map + localeLabel MOVED to the
// plain module `@/lib/i18n/localeNames` (server prompt builders need names and
// may not import this `'use client'` file). Re-exported here so existing
// importers (LocaleSettings, retired in phase 2) keep compiling.
export { LOCALE_DISPLAY_NAMES, localeLabel };

// TODO(i18n): unauthored-field affordance (Phase 4 step 4) is deferred. Marking
// fields that show base fallback (no overlay value yet) in a non-default locale
// requires per-field overlay-presence checks inside the read/render sites
// (InlineTextEditorV2 / block renderers) — those are 3b files, outside this
// phase's Files-touched. Skipped to avoid scope creep; see audit.
export function LanguageToggle() {
  const localeConfig = useEditStore((s) => s.localeConfig);
  const activeLocale = useEditStore((s) => s.activeLocale);
  const setActiveLocale = useEditStore((s) => s.setActiveLocale);

  // Invisible unless the project has declared a 2nd locale.
  if (!isMultiLocale(localeConfig)) return null;

  const locales = localeConfig!.locales;

  return (
    <div
      className="flex items-center gap-0.5 rounded-app-ctl-sm border border-app-hairline bg-app-track p-0.5"
      role="group"
      aria-label="Editing language"
    >
      {locales.map((loc) => {
        const isActive = loc === activeLocale;
        const isDefault = loc === localeConfig!.defaultLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setActiveLocale(loc)}
            aria-pressed={isActive}
            title={isDefault ? `${localeLabel(loc)} (default)` : localeLabel(loc)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {loc.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
