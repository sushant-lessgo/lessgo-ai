'use client';

// Universal entry flow (scale-02 phase 5, D1): input → confirm → manual, plus a
// serve-redirect out of the confirm step. scale-06 phase 3 adds LOAD-DETECTION:
// on mount we fetch the project; a DB-confirmed brief (Project.brief non-null +
// audienceType set) whose copyEngine ∈ WIZARD_ENGINES renders the UNIFIED WIZARD
// (net-new post-confirm landing AND reload/resume-mid-wizard). A confirmed brief
// whose engine is NOT yet migrated is FORWARDED to its old per-audience wizard.
// No persisted brief ⇒ the in-memory entry flow (input|confirm|manual).
//
// Firewall: this segment imports only pure @/modules/brief + rollout + fetch. The
// wizard dispatcher (WizardShell + template-adjacent slot code) is DYNAMICALLY
// imported so it never enters the entry bundle.

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { AudienceType, TemplateId } from '@/types/service';
import { WIZARD_ENGINES } from '@/modules/wizard/rollout';
import Logo from '@/components/shared/Logo';
import EntryInputStep from './components/EntryInputStep';
import ConfirmBriefStep from './components/ConfirmBriefStep';
import ManualOnboardStep from './components/ManualOnboardStep';

// FIREWALL: dynamic-import the wizard dispatcher so the entry path stays
// firewall-pure and slot code stays out of the entry bundle.
const WizardShell = dynamic(
  () => import('@/components/onboarding/wizard/WizardShell'),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 text-center text-gray-500">Loading your page…</div>
    ),
  }
);

type EntryStep = 'input' | 'confirm' | 'manual' | 'wizard';

interface WizardData {
  brief: Brief;
  audienceType: AudienceType | null;
  templateId: TemplateId | null;
}

export default function EntryOnboardingPage() {
  const params = useParams();
  const tokenId = (params?.token as string) ?? '';

  // Undetermined until load-detection resolves (avoids flashing the input step
  // before we know a confirmed brief exists).
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<EntryStep>('input');
  const [rawInput, setRawInput] = useState('');
  const [briefDraft, setBriefDraft] = useState<Brief | null>(null);
  const [missing, setMissing] = useState<string>('rungA:unclassified');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);

  // Load-detection: does a DB-confirmed brief already exist for this token?
  useEffect(() => {
    if (!tokenId) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
        if (!res.ok) {
          if (!cancelled) setChecking(false);
          return;
        }
        const json = await res.json();
        const brief = json?.brief as Brief | null;
        const audienceType = (json?.audienceType ?? null) as AudienceType | null;
        const templateId = (json?.templateId ?? null) as TemplateId | null;

        // A confirmed brief requires both a persisted brief and a resolved
        // audienceType (both written together at /api/brief/confirm serve).
        const confirmed = !!brief && !!audienceType && !!brief.copyEngine;
        if (confirmed && brief) {
          if (WIZARD_ENGINES.has(brief.copyEngine!)) {
            // Migrated engine → render the unified wizard here.
            if (!cancelled) {
              setWizardData({ brief, audienceType, templateId });
              setStep('wizard');
              setChecking(false);
            }
            return;
          }
          // Not-yet-migrated (trust/work until phases 8/9) → forward to its old
          // wizard route; NEVER render the unified wizard for it.
          window.location.assign(`/onboarding/${audienceType}/${tokenId}`);
          return; // leave `checking` true — the page is unloading.
        }
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center">
          <Logo size={80} />
        </div>
      </div>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            {checking && (
              <div className="py-12 flex items-center justify-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {!checking && step === 'wizard' && wizardData && (
              <WizardShell
                tokenId={tokenId}
                brief={wizardData.brief}
                audienceType={wizardData.audienceType}
                templateId={wizardData.templateId}
              />
            )}

            {!checking && step === 'input' && (
              <EntryInputStep
                onSuccess={(input, draft) => {
                  setRawInput(input);
                  setBriefDraft(draft);
                  setStep('confirm');
                }}
              />
            )}

            {!checking && step === 'confirm' && briefDraft && (
              <ConfirmBriefStep
                tokenId={tokenId}
                briefDraft={briefDraft}
                onDraftCorrected={setBriefDraft}
                onManual={(missingTags) => {
                  setMissing(missingTags);
                  setStep('manual');
                }}
              />
            )}

            {!checking && step === 'manual' && briefDraft && (
              <ManualOnboardStep
                rawInput={rawInput}
                briefDraft={briefDraft}
                missing={missing}
                leadId={leadId}
                onLeadCreated={setLeadId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
