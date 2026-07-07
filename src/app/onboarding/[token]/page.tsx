'use client';

// Universal entry flow (scale-02 phase 5, D1): input → confirm → manual,
// plus a serve-redirect out of the confirm step. Local useState only — NO new
// zustand store; the classified draft lives in memory (mirrors the wizard
// stores' in-memory pattern; reload = restart entry, acceptable).
//
// Firewall: pure @/modules/brief + fetch — no template resolver/registry/
// renderer/block imports anywhere in this segment.

import { useState } from 'react';
import { useParams } from 'next/navigation';
import type { Brief } from '@/types/brief';
import Logo from '@/components/shared/Logo';
import EntryInputStep from './components/EntryInputStep';
import ConfirmBriefStep from './components/ConfirmBriefStep';
import ManualOnboardStep from './components/ManualOnboardStep';

type EntryStep = 'input' | 'confirm' | 'manual';

export default function EntryOnboardingPage() {
  const params = useParams();
  const tokenId = (params?.token as string) ?? '';

  const [step, setStep] = useState<EntryStep>('input');
  const [rawInput, setRawInput] = useState('');
  const [briefDraft, setBriefDraft] = useState<Brief | null>(null);
  const [missing, setMissing] = useState<string>('rungA:unclassified');
  const [leadId, setLeadId] = useState<string | null>(null);

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
            {step === 'input' && (
              <EntryInputStep
                onSuccess={(input, draft) => {
                  setRawInput(input);
                  setBriefDraft(draft);
                  setStep('confirm');
                }}
              />
            )}

            {step === 'confirm' && briefDraft && (
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

            {step === 'manual' && briefDraft && (
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
