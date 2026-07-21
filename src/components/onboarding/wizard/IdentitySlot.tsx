'use client';

// scale-06 phase 3 — IDENTITY slot (WHO/WHAT: name + one-liner).
// Thin wrapper over the shared SlotBody; fields come from the engine contract
// (slot === 'identity'), copy from the businessType wizardFields / defaults.
//
// language-settings phase 3 — the SITE LANGUAGE picker lives here, NOT in the
// engine contract: it is a site-level setting, not a copy fact, and adding a
// `wizardSlots` member / editing `inputContracts.ts` would collide head-on with
// the uniform-journey track (ruling 8). Work never renders this shell (it runs
// the journey) and derives its language from the existing `languages` question.

import { useWizardStore } from '@/hooks/useWizardStore';
import { SUPPORTED_LOCALES } from '@/lib/i18n/localeContent';
import { localeLabel } from '@/lib/i18n/localeNames';
import { SlotBody } from './SlotReviewCard';

/**
 * Compact site-language select. Default `en`; the chosen ISO code both rides the
 * generation payloads (`language`) and is persisted as `content.localeConfig`
 * immediately (slot 1 — well ahead of generation) so regen and Site Settings
 * read the same declaration.
 */
function SiteLanguageField() {
  const siteLanguage = useWizardStore((s) => s.siteLanguage);
  const setSiteLanguage = useWizardStore((s) => s.setSiteLanguage);
  const persistSiteLanguage = useWizardStore((s) => s.persistSiteLanguage);

  return (
    <div className="space-y-1.5">
      <label htmlFor="site-language" className="text-sm font-medium text-gray-800">
        Site language
      </label>
      <select
        id="site-language"
        value={siteLanguage}
        onChange={(e) => {
          setSiteLanguage(e.target.value);
          void persistSiteLanguage();
        }}
        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:border-brand-accentPrimary focus:outline-none"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {localeLabel(code)}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Your page copy will be written in this language.
      </p>
    </div>
  );
}

export default function IdentitySlot() {
  return (
    <div className="space-y-5">
      <SlotBody
        slot="identity"
        title="Let's start with the basics"
        description="Confirm what this is, or fix it."
      />
      <SiteLanguageField />
    </div>
  );
}
