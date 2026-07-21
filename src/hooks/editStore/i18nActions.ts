// src/hooks/editStore/i18nActions.ts — language-settings phase 1.
//
// The locale MUTATORS, extracted from LocaleSettings.tsx's local `api.setState`
// closures into real store actions (plan ruling 1). Why they moved:
//  · the new LanguagesPanel (phase 2) and any future caller need them;
//  · `i18nStoreState.test.ts` used to SIMULATE these closures with its own
//    setState recipes — a drift trap (the test could stay green while the UI
//    diverged). Tests now drive the real actions;
//  · the engaged / isDirty / triggerAutoSave choreography is invariant-bearing
//    (see below) and must live in exactly one place.
//
// THE CHOREOGRAPHY (do not "simplify"): every mutator sets
//   localeEngaged = true      → save()/export() then emit an EXPLICIT
//                               `localeConfig: null` / `localeContent: {}` on a
//                               clear, so the route CLEARS instead of preserving
//                               (absent means "preserve" → resurrection on reload);
//   persistence.isDirty = true → triggerAutoSave is GATED on isDirty; without
//                               this a declare-then-leave silently never persists.
// Confirmation is NOT here — `confirmDialog` stays in the UI layer.

import type { EditStore } from '@/types/store';
import type { LocaleConfig } from '@/types/core/content';

export const createI18nActions = (set: any, get: () => EditStore) => {
  const flush = () => get().triggerAutoSave?.();

  return {
    // Verbatim move of LocaleSettings.addLocale: first declaration seeds
    // [default, added] with the ORIGINAL language as default (base `content` IS
    // the default locale's copy — switching which locale is default would need a
    // base↔overlay swap, out of scope).
    addLocale: (code: string) => {
      set((s: any) => {
        const cfg = s.localeConfig;
        if (!cfg || !Array.isArray(cfg.locales) || cfg.locales.length === 0) {
          const def = cfg?.defaultLocale || s.activeLocale || 'en';
          s.localeConfig = {
            locales: def === code ? [def] : [def, code],
            defaultLocale: def,
          };
        } else if (!cfg.locales.includes(code)) {
          cfg.locales.push(code);
        }
        s.localeEngaged = true;
        s.persistence.isDirty = true;
      });
      flush();
    },

    // Moved from LocaleSettings.removeLocale with ONE deliberate change — the
    // drop-to-single branch (ruling 10).
    //
    // OLD: remaining ≤ 1 ⇒ `localeConfig = null`, unconditionally.
    // WHY THAT IS A DATA-LOSS BUG once onboarding declares a site language:
    // localeConfig is then the ONLY durable record of a NON-English site
    // language. A Dutch project that adds English and removes it again would go
    // to null → on load `activeLocale` re-derives to 'en' → regen reads no
    // locale → the prompt says "write in English" → the site regenerates itself
    // into the exact bug this feature exists to fix.
    // NEW: keep `{ locales:[def], defaultLocale:def }` when the surviving
    // default is NOT 'en' (a legal single-locale declaration — isMultiLocale is
    // false, so no multi-locale surface reacts); clear to null when it IS 'en',
    // because English is the platform default and null preserves the legacy
    // zero-diff contract.
    removeLocale: (code: string) => {
      set((s: any) => {
        const cfg = s.localeConfig;
        if (!cfg) return;
        // The site's DEFAULT locale is not removable — it IS the declaration of
        // the site language, and base `content` is its copy. Enforced HERE (not
        // only in LanguagesPanel, which hides the menu on the default card):
        // these are public store actions, so a future caller removing a
        // non-English default would otherwise fall into the drop-to-single
        // branch and erase the declaration — ruling-10 data loss through a
        // different door.
        if (code === cfg.defaultLocale) return;
        const remaining: string[] = cfg.locales.filter((l: string) => l !== code);
        // Drop the removed locale's overlay so it never rides a save.
        if (s.localeContent && s.localeContent[code]) {
          delete s.localeContent[code];
        }
        if (remaining.length <= 1) {
          const def: string = remaining[0] ?? cfg.defaultLocale;
          if (def === 'en') {
            // Platform default → clear (legacy zero-diff). save()/export() send
            // an EXPLICIT null/{} because the store stays engaged.
            s.localeConfig = null;
          } else {
            // Ruling 10: PRESERVE the declared non-English site language.
            s.localeConfig = {
              locales: [def],
              defaultLocale: def,
              ...(cfg.switcherStyle ? { switcherStyle: cfg.switcherStyle } : {}),
            };
          }
          // `def` rather than the old `cfg.defaultLocale`: identical in every
          // reachable case (the UI cannot remove the default), but it keeps
          // activeLocale inside the surviving declaration if that ever changes.
          s.activeLocale = def;
        } else {
          // Multi→multi: keep the COMPLETE remaining map (3a full-map invariant)
          // so no surviving locale is wiped.
          cfg.locales = remaining;
          if (s.activeLocale === code) s.activeLocale = cfg.defaultLocale;
        }
        s.localeEngaged = true;
        s.persistence.isDirty = true;
      });
      flush();
    },

    // Publish-layer widget style. NO-OP when there is no config to hang it on —
    // materializing a config here would break the zero-diff contract for a
    // legacy/monolingual project.
    setSwitcherStyle: (style: LocaleConfig['switcherStyle']) => {
      set((s: any) => {
        const cfg = s.localeConfig;
        if (!cfg) return;
        cfg.switcherStyle = style;
        s.localeEngaged = true;
        s.persistence.isDirty = true;
      });
      flush();
    },
  };
};
