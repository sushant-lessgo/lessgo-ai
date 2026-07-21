'use client';

// LanguagesPanel — language-settings phase 2.
//
// The Languages pane of the Site settings window (t16 rail: Domain / SEO /
// Social & sharing / Languages). It REPLACES the editor-header globe
// (`editor/LocaleSettings.tsx`, deleted this phase); `LanguageToggle` — the
// active-editing-locale pill group — stays in the header and is untouched.
//
// ⚠️ NO `isMultiLocale` GATE. The globe hid itself on single-locale projects, so
// a monolingual project could NEVER declare a second language from the UI (the
// only way in was a hand-edited row). That gate is the headline bug this panel
// fixes: every project sees its default-locale card and can add a language.
//
// Store writes go EXCLUSIVELY through the phase-1 store actions
// (`addLocale` / `removeLocale` / `setSwitcherStyle` in hooks/editStore/i18nActions.ts)
// — no `api.setState` recipes live here. Those actions own the
// localeEngaged / isDirty / triggerAutoSave choreography. There is no save
// button: SeoSettingsModal's `handleClose` flushes auto-save, exactly like SEO.
//
// DEFAULT LOCALE IS NON-REMOVABLE (phase-1 carry). `removeLocale` clears a
// non-English site's whole config if its DEFAULT is the one removed, silently
// re-labelling a Dutch project as English. The action has no guard of its own
// (i18nActions.ts is not in this phase's Files-touched), so this UI must never
// offer it: the default card renders no overflow menu at all, and `addable`
// excludes the default so it can't be re-added either.
//
// GREYED, NOT FAKE (spec decision 5 / "render greyed, never omit"): the
// designer's mock draws Auto-translate live and ON, and implies a
// change-site-language action. Neither exists until Spec 2, so both ship through
// <Coming> — visible, aria-disabled, tooltipped. The non-default subline is the
// honest `{n} translated fields` rather than the mock's "Auto-translated · 3
// edits", which would advertise machine translation we do not perform.

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { SUPPORTED_LOCALES, isMultiLocale } from '@/lib/i18n/localeContent';
import { localeLabel } from '@/lib/i18n/localeNames';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { AppIcon } from '@/components/ui/icon';
import { AppTooltip } from '@/components/ui/tooltip';
import { Coming } from '@/components/ui/coming';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { LocaleContentOverlay } from '@/types/core/content';

// Duplicated from SeoSettingsModal (module-local consts there, same convention):
// t16 labels 600/11.5 #3a3a44, eyebrow 700/10.5 uppercase #a6a6b0.
const LABEL = 'text-[11.5px] font-semibold text-app-label';
const EYEBROW = 'text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint';
const CARD =
  'flex items-center gap-[11px] rounded-[11px] border border-app-border-hairline px-[13px] py-[11px]';

/** Authored overlay fields for a locale — the honest subline number. */
function translatedFieldCount(overlay: LocaleContentOverlay | undefined, locale: string): number {
  const forLocale = overlay?.[locale];
  if (!forLocale) return 0;
  return Object.values(forLocale).reduce(
    (n, section) => n + Object.keys(section || {}).length,
    0,
  );
}

export function LanguagesPanel() {
  const storeApi = useEditStoreApi();
  const { localeConfig, localeContent, activeLocale } = useEditStore(
    useShallow((s) => ({
      localeConfig: s.localeConfig,
      localeContent: s.localeContent,
      activeLocale: s.activeLocale,
    })),
  );

  const [adding, setAdding] = React.useState(false);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Close the add-list / row menu on an outside click (same pattern the retired
  // globe popover used).
  React.useEffect(() => {
    if (!adding && !menuFor) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAdding(false);
        setMenuFor(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [adding, menuFor]);

  // Mirrors addLocale's own seeding rule (cfg.defaultLocale || activeLocale ||
  // 'en') so the card we draw IS the locale that becomes the default.
  const defaultLocale = localeConfig?.defaultLocale || activeLocale || 'en';
  const declared = localeConfig?.locales?.length ? localeConfig.locales : [defaultLocale];
  const multi = isMultiLocale(localeConfig);

  // Never the default itself (see the non-removable note above), never a
  // locale already declared.
  const addable = SUPPORTED_LOCALES.filter(
    (l) => l !== defaultLocale && !declared.includes(l),
  );

  const style = localeConfig?.switcherStyle ?? 'dropdown';

  const onAdd = (code: string) => {
    setAdding(false);
    storeApi.getState().addLocale(code);
  };

  const onRemove = async (code: string) => {
    setMenuFor(null);
    // Defence in depth: the default card renders no menu, so this is
    // unreachable — but removeLocale would wipe a non-English declaration.
    if (code === defaultLocale) return;
    const confirmed = await confirmDialog({
      title: `Remove ${localeLabel(code)}?`,
      message:
        `This deletes all ${localeLabel(code)} translations you have authored ` +
        `for this project. This cannot be undone.`,
      confirmLabel: 'Remove language',
      destructive: true,
    });
    if (!confirmed) return;
    storeApi.getState().removeLocale(code);
  };

  return (
    <div ref={rootRef}>
      <h3 className="text-[16px] font-bold text-app-ink">Languages</h3>
      <p className="mt-0.5 text-[12px] text-app-dim">
        Offer your site in more than one language.
      </p>

      <div className="mt-[18px] flex gap-[26px]">
        {/* Left column — the declared locales */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className={EYEBROW}>Languages</div>

          {declared.map((loc) => {
            const isDefault = loc === defaultLocale;
            const count = translatedFieldCount(localeContent, loc);
            return (
              <div
                key={loc}
                data-locale={loc}
                className={cn(CARD, isDefault && 'bg-app-surface-sunken')}
              >
                <span className="w-[26px] shrink-0 font-app-mono text-[12px] font-semibold text-app-dim">
                  {loc.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-app-ink">
                    {localeLabel(loc)}
                  </div>
                  {!isDefault && (
                    // HONEST subline (deviation from the mock's "Auto-translated
                    // · 3 edits"): we count the fields the author actually
                    // translated. Nothing auto-translates yet.
                    <div className="text-[10.5px] text-app-dim">
                      {count} translated {count === 1 ? 'field' : 'fields'}
                    </div>
                  )}
                </div>

                {isDefault ? (
                  <>
                    <span className="rounded-[5px] bg-app-tint px-[7px] py-0.5 text-[9.5px] font-semibold text-app-primary">
                      Default
                    </span>
                    {/* Changing which language the base copy is in needs a
                        base↔overlay swap — Spec 2. Greyed, never omitted. */}
                    <Coming what="changing the site language" side="left">
                      <AppIcon name="swap_horiz" size={17} />
                    </Coming>
                  </>
                ) : (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`Language options for ${localeLabel(loc)}`}
                      aria-haspopup="menu"
                      aria-expanded={menuFor === loc}
                      onClick={() => setMenuFor((v) => (v === loc ? null : loc))}
                      className="flex items-center rounded-app-badge p-0.5 text-app-border-strong transition-colors hover:bg-app-hover hover:text-app-ink"
                    >
                      <AppIcon name="more_horiz" size={17} />
                    </button>
                    {menuFor === loc && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-50 mt-1 w-[168px] rounded-app-ctl-sm border border-app-border-hairline bg-app-surface p-1 shadow-app-menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => onRemove(loc)}
                          className="w-full rounded-[6px] px-2.5 py-1.5 text-left text-[12px] font-medium text-app-danger transition-colors hover:bg-app-hover"
                        >
                          Remove language
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {addable.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAdding((v) => !v)}
                aria-expanded={adding}
                className="flex w-full items-center justify-center gap-[7px] rounded-[11px] border border-dashed border-app-border-strong p-2.5 text-[12px] font-semibold text-app-primary transition-colors hover:bg-app-hover"
              >
                <AppIcon name="add" size={17} />
                Add language
              </button>
              {adding && (
                <div
                  role="listbox"
                  aria-label="Add a language"
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[220px] overflow-y-auto rounded-app-ctl-sm border border-app-border-hairline bg-app-surface p-1 shadow-app-menu"
                >
                  {addable.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => onAdd(loc)}
                      className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-left text-[12px] text-app-ink transition-colors hover:bg-app-hover"
                    >
                      <span className="w-[26px] shrink-0 font-app-mono text-[11px] text-app-dim">
                        {loc.toUpperCase()}
                      </span>
                      {localeLabel(loc)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — 200 fixed */}
        <div className="flex w-[200px] shrink-0 flex-col gap-3.5">
          {/* Auto-translate: the mock draws this LIVE and ON. Nothing translates
              anything today (Spec 2), so it ships greyed rather than as a toggle
              that lies. */}
          <Coming what="auto-translate" side="left" className={cn(CARD, 'w-full')}>
            <span className="min-w-0 flex-1 leading-[1.3]">
              <span className="block text-[12px] font-semibold text-app-ink">Auto-translate</span>
              <span className="block text-[10.5px] text-app-dim">New copy, via AI</span>
            </span>
            <Switch
              checked={false}
              disabled
              aria-label="Auto-translate"
              tabIndex={-1}
              className="pointer-events-none shrink-0"
            />
          </Coming>

          <div>
            <div className={cn(LABEL, 'mb-2 block')}>Switcher style</div>
            {/* Single-locale ⇒ no published switcher exists to style. Disabled
                with a why-tooltip (NOT <Coming> — this is built, just not
                applicable yet, and "Coming soon" would be a lie). */}
            <AppTooltip
              side="left"
              label={
                multi
                  ? undefined
                  : 'Add a second language — a switcher only appears on sites with more than one.'
              }
            >
              <div
                role="group"
                aria-label="Switcher style"
                className={cn(
                  'flex rounded-app-ctl-sm bg-app-track p-[3px]',
                  !multi && 'opacity-60',
                )}
              >
                {(['dropdown', 'none'] as const).map((opt) => {
                  const selected = style === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={!multi}
                      aria-pressed={selected}
                      onClick={() => storeApi.getState().setSwitcherStyle(opt)}
                      className={cn(
                        'flex-1 rounded-[6px] py-[5px] text-center text-[11px] transition-colors disabled:cursor-not-allowed',
                        selected
                          ? 'bg-app-surface font-semibold text-app-primary shadow-[0_1px_2px_rgba(0,0,0,.07)]'
                          : 'font-medium text-app-dim',
                      )}
                    >
                      {opt === 'dropdown' ? 'Dropdown' : 'None'}
                    </button>
                  );
                })}
              </div>
            </AppTooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
