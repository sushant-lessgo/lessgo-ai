// src/app/edit/[token]/components/editor/LocaleSettings.tsx
// i18n-phase-1 (Phase 4) — the "Languages" config panel.
//
// Small globe button in the editor header opens a popover that lets the author
// DECLARE the project's locales. Declaring a 2nd locale is how a project becomes
// multi-locale (isMultiLocale → the LanguageToggle appears; overlays start being
// authored). Adding a locale only adds an OVERLAY; the base `content` IS the
// default locale's copy (D1), so for v1 the default locale is LOCKED to the
// original/base language (switching which locale is "default" would require a
// heavier base↔overlay swap — out of scope).
//
// Config writes go straight to the store via setState (immer recipe) + a
// triggerAutoSave — there is no dedicated store action for localeConfig, and
// adding one is outside this phase's Files-touched. Each recipe also sets
// `persistence.isDirty = true` (triggerAutoSave is gated on it) and
// `localeEngaged = true`.
// CLEAR-CONTRACT (Phase-4 fix): dropping back to a single locale sets
// `localeConfig = null` + clears the removed overlay; because the store is
// `localeEngaged`, save()/export() send an EXPLICIT `null`/`{}` so the route
// CLEARS the stored config+overlay (absent would mean "preserve" → resurrection).
// The DraftSave schema is now `.nullable().optional()` to accept the null signal.
'use client';

import React from 'react';
import {
  useEditStore,
  useEditStoreApi,
} from '@/hooks/useEditStore';
import { SUPPORTED_LOCALES, isMultiLocale } from '@/lib/i18n/localeContent';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { localeLabel } from './LanguageToggle';

export function LocaleSettings() {
  const api = useEditStoreApi();
  const localeConfig = useEditStore((s) => s.localeConfig);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Gated per bilingual-editing spec: adding a 2nd locale to a single-locale
  // project is config/white-glove, not a UI flow — so this settings control only
  // appears once a project is already multi-locale.
  if (!isMultiLocale(localeConfig)) return null;

  const declared = localeConfig?.locales ?? [];
  // The base-content language: existing default, else the conventional 'en'.
  const defaultLocale = localeConfig?.defaultLocale ?? 'en';
  const isMulti = declared.length > 1;

  // Locales offered to add = everything supported that isn't already declared,
  // and never the (locked) default itself.
  const addable = SUPPORTED_LOCALES.filter(
    (l) => l !== defaultLocale && !declared.includes(l),
  );

  const flush = () => api.getState().triggerAutoSave?.();

  const addLocale = (code: string) => {
    api.setState((s: any) => {
      const cfg = s.localeConfig;
      if (!cfg || !Array.isArray(cfg.locales) || cfg.locales.length === 0) {
        // First declaration: seed with the existing (default) language + the
        // newly added one. Default stays the original/base language.
        const def = cfg?.defaultLocale || s.activeLocale || 'en';
        s.localeConfig = {
          locales: def === code ? [def] : [def, code],
          defaultLocale: def,
        };
      } else if (!cfg.locales.includes(code)) {
        cfg.locales.push(code);
      }
      // Phase-4 fix: engage the locale system + mark dirty so triggerAutoSave
      // (gated on isDirty) actually fires — a declare-then-leave must persist.
      s.localeEngaged = true;
      s.persistence.isDirty = true;
    });
    flush();
  };

  const removeLocale = async (code: string) => {
    const confirmed = await confirmDialog({
      title: `Remove ${localeLabel(code)}?`,
      message:
        `This deletes all ${localeLabel(code)} translations you have authored ` +
        `for this project. This cannot be undone.`,
      confirmLabel: 'Remove language',
      destructive: true,
    });
    if (!confirmed) return;

    api.setState((s: any) => {
      const cfg = s.localeConfig;
      if (!cfg) return;
      const remaining: string[] = cfg.locales.filter((l: string) => l !== code);
      // Drop the removed locale's overlay so it never rides a save.
      if (s.localeContent && s.localeContent[code]) {
        delete s.localeContent[code];
      }
      if (remaining.length <= 1) {
        // Back to single-locale: clear the config. save()/export() send it as an
        // EXPLICIT null/{} (engaged stays true) so the stored config + overlay are
        // CLEARED, not preserved — no resurrection on reload.
        s.localeConfig = null;
        s.activeLocale = cfg.defaultLocale;
      } else {
        // Multi→multi: keep the COMPLETE remaining map (3a full-map invariant) so
        // no surviving locale is wiped.
        cfg.locales = remaining;
        if (s.activeLocale === code) s.activeLocale = cfg.defaultLocale;
      }
      // Phase-4 fix: stay engaged (so a drop-to-single sends explicit clear) +
      // mark dirty so autosave fires.
      s.localeEngaged = true;
      s.persistence.isDirty = true;
    });
    flush();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Languages"
        className={`flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-app-ctl-sm border transition-colors ${
          isMulti
            ? 'border-app-hairline text-app-icon-muted hover:bg-app-hairline'
            : 'border-transparent text-app-icon-muted hover:bg-app-hairline'
        }`}
      >
        <GlobeIcon />
        <span className="hidden sm:inline">Languages</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Languages"
          className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
        >
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Languages
          </div>

          {/* Declared locales */}
          <ul className="space-y-1 mb-3">
            {(declared.length ? declared : [defaultLocale]).map((loc) => {
              const isDefault = loc === defaultLocale;
              return (
                <li
                  key={loc}
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-50"
                >
                  <span className="text-sm text-gray-800">
                    {localeLabel(loc)}
                    <span className="ml-1.5 text-xs text-gray-400 font-mono">
                      {loc}
                    </span>
                  </span>
                  {isDefault ? (
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-200 rounded px-1.5 py-0.5">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeLocale(loc)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Add a language */}
          {addable.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Add a language</div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {addable.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => addLocale(loc)}
                    className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                    title={localeLabel(loc)}
                  >
                    + {localeLabel(loc)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-[11px] leading-snug text-gray-400">
            The default language is your original copy and can&apos;t be changed
            here. Adding a language lets you translate each field with the
            language toggle.
          </p>
        </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3z" />
    </svg>
  );
}
