'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  userPersonas,
  userPersonaLabels,
  userPersonaDescriptions,
  type UserPersona,
} from '@/types/service';
import Logo from '@/components/shared/Logo';

interface PersonaPromptProps {
  /**
   * Where to navigate after persona is saved. May be a page route or the
   * literal '/api/start' — in which case we re-fetch /api/start and
   * window.open the URL it returns (new project flow).
   */
  next?: string;
  /**
   * Existing persona value (for "edit" mode in account settings). When
   * present, that card renders pre-selected.
   */
  initialPersona?: UserPersona | null;
  /**
   * Header copy. Defaults to first-time prompt; settings page overrides.
   */
  heading?: string;
  subheading?: string;
  /**
   * Hide the logo header (used inside dashboard / settings frames).
   */
  embedded?: boolean;
}

export default function PersonaPrompt({
  next = '/dashboard',
  initialPersona = null,
  heading = 'Who are you?',
  subheading = 'Pick the option that fits best — we use this to tailor what we build for you.',
  embedded = false,
}: PersonaPromptProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<UserPersona | null>(initialPersona);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(persona: UserPersona) {
    if (saving) return;
    setSelected(persona);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || body?.error || 'Failed to save persona');
      }

      // Hand off based on `next` shape:
      // - '/api/start' → re-trigger project create + open in new tab
      // - any other path → same-tab router.push
      if (next === '/api/start') {
        const startRes = await fetch('/api/start');
        const { url } = await startRes.json();
        window.open(url, '_blank');
        router.push('/dashboard');
      } else {
        router.push(next);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Try again.');
      setSaving(false);
    }
  }

  const grid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {userPersonas.map((p) => {
        const isSelected = selected === p;
        return (
          <button
            key={p}
            onClick={() => handleSelect(p)}
            disabled={saving}
            className={`text-left p-4 rounded-lg border transition-all ${
              isSelected
                ? 'border-brand-accentPrimary bg-brand-accentPrimary/5 ring-2 ring-brand-accentPrimary/20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${saving && !isSelected ? 'opacity-50' : ''} disabled:cursor-not-allowed`}
          >
            <div className="font-medium text-gray-900">
              {userPersonaLabels[p]}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {userPersonaDescriptions[p]}
            </div>
          </button>
        );
      })}
    </div>
  );

  const inner = (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-gray-900">{heading}</h1>
        <p className="text-gray-600 mt-2 mb-6">{subheading}</p>
        {grid}
        {error && (
          <p className="text-sm text-red-600 mt-4" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );

  if (embedded) return inner;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center">
          <Logo size={30} />
        </div>
      </div>
      <div className="pt-24 pb-16 px-4">{inner}</div>
    </div>
  );
}
