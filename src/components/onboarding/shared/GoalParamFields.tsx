'use client';

// src/components/onboarding/shared/GoalParamFields.tsx
// scale-05 phase 1 — per-intent goal-slot param inputs, shared by both wizard
// GoalSteps (and reused by the phase-8 intent-first goal step). Controlled via
// props (value + onChange); no store coupling. Validation is intentionally
// light (trim + basic URL/phone shape at writeback) — legacyGoalToBriefGoal in
// src/modules/brief/bridge.ts is where composition/cleanup happens.
//
// Branch order mirrors the writeback (intent-specific FIRST, then
// mechanism-generic fallback):
// - download-app  → TWO labeled store-URL fields → param.links[] (index 0 =
//                   Google Play, 1 = App Store; empties dropped at writeback).
// - rsvp          → event link + date.
// - subscribe-newsletter → renders NOTHING (M1 form treatment — the newsletter
//                   form auto-seeds in phase 4; must NOT fall through to the
//                   M4 "platform link(s)" fallback).
// - generic M2    → phone/email choice + value.
// - generic M3    → single destination URL (also shown as an OPTIONAL field
//                   for M1-primary intents that allow M3, e.g. request-demo +
//                   Calendly / book-call + scheduling link).
// - generic M4    → platform link(s).
// - M1 / M5       → nothing.

import { goalIntentMeta, type GoalIntent } from '@/modules/goals/vocabulary';
import type { GoalParamInput } from '@/modules/brief/bridge';

export interface GoalParamFieldsProps {
  intent: GoalIntent;
  value: GoalParamInput;
  onChange: (value: GoalParamInput) => void;
}

/**
 * Whether GoalParamFields renders any input for this intent — GoalSteps use
 * this to decide if auto-advance should pause for param collection.
 */
export function intentHasParamFields(intent: GoalIntent): boolean {
  if (intent === 'subscribe-newsletter') return false;
  if (intent === 'download-app' || intent === 'rsvp') return true;
  const mechanisms = goalIntentMeta[intent].mechanisms;
  const primary = mechanisms[0];
  if (primary === 'M2' || primary === 'M3' || primary === 'M4') return true;
  // M1-primary intents that allow M3 get an optional destination-URL field
  // (e.g. request-demo → Calendly).
  return primary === 'M1' && mechanisms.includes('M3');
}

/**
 * True when the intent REQUIRES at least one param entry before proceeding.
 * Today only download-app (≥1 store link). Everything else is optional.
 */
export function intentParamSatisfied(intent: GoalIntent, value: GoalParamInput): boolean {
  if (intent === 'download-app') {
    return (value.links ?? []).some((l) => l.trim().length > 0);
  }
  return true;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 ' +
  'placeholder:text-gray-400 focus:border-brand-accentPrimary focus:outline-none';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

function LabeledInput({
  label,
  type = 'url',
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function GoalParamFields({ intent, value, onChange }: GoalParamFieldsProps) {
  // ── Intent-specific branches FIRST (mirror of legacyGoalToBriefGoal) ──

  if (intent === 'subscribe-newsletter') {
    // M1 form treatment — the newsletter email-capture form auto-seeds at
    // generation (phase 4). Nothing to collect here.
    return null;
  }

  if (intent === 'download-app') {
    const links = value.links ?? ['', ''];
    const setLink = (i: number, v: string) => {
      const next = [links[0] ?? '', links[1] ?? ''];
      next[i] = v;
      onChange({ ...value, links: next });
    };
    return (
      <div className="space-y-3">
        <LabeledInput
          label="Google Play link"
          placeholder="https://play.google.com/store/apps/details?id=…"
          value={links[0] ?? ''}
          onChange={(v) => setLink(0, v)}
        />
        <LabeledInput
          label="App Store link"
          placeholder="https://apps.apple.com/app/…"
          value={links[1] ?? ''}
          onChange={(v) => setLink(1, v)}
        />
        <p className="text-xs text-gray-500">
          Add at least one store link — your download buttons point there.
        </p>
      </div>
    );
  }

  if (intent === 'rsvp') {
    return (
      <div className="space-y-3">
        <LabeledInput
          label="Event / RSVP link (optional)"
          placeholder="https://…"
          value={value.url ?? ''}
          onChange={(v) => onChange({ ...value, url: v })}
        />
        <LabeledInput
          label="Event date (optional)"
          type="date"
          value={value.date ?? ''}
          onChange={(v) => onChange({ ...value, date: v })}
        />
      </div>
    );
  }

  // ── Mechanism-generic fallback ──
  const mechanisms = goalIntentMeta[intent].mechanisms;
  const primary = mechanisms[0];

  if (primary === 'M2') {
    const mode: 'phone' | 'email' = value.email !== undefined && value.phone === undefined ? 'email' : 'phone';
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {(['phone', 'email'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                onChange(
                  m === 'phone'
                    ? { ...value, email: undefined, phone: value.phone ?? '' }
                    : { ...value, phone: undefined, email: value.email ?? '' }
                )
              }
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                mode === m
                  ? 'border-brand-accentPrimary text-brand-accentPrimary bg-brand-accentPrimary/5'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {m === 'phone' ? 'WhatsApp / phone' : 'Email'}
            </button>
          ))}
        </div>
        {mode === 'phone' ? (
          <LabeledInput
            label="WhatsApp number (with country code)"
            type="tel"
            placeholder="+91 98765 43210"
            value={value.phone ?? ''}
            onChange={(v) => onChange({ ...value, phone: v })}
          />
        ) : (
          <LabeledInput
            label="Email address"
            type="email"
            placeholder="hello@example.com"
            value={value.email ?? ''}
            onChange={(v) => onChange({ ...value, email: v })}
          />
        )}
      </div>
    );
  }

  if (primary === 'M3' || (primary === 'M1' && mechanisms.includes('M3'))) {
    const optional = primary === 'M1';
    return (
      <div className="space-y-3">
        <LabeledInput
          label={optional ? 'Destination link (optional)' : 'Destination link'}
          placeholder="https://…"
          value={value.url ?? ''}
          onChange={(v) => onChange({ ...value, url: v })}
        />
        <p className="text-xs text-gray-500">
          {optional
            ? 'e.g. a Calendly / booking link. Leave blank to collect leads with an on-page form instead.'
            : 'Where the main button sends visitors (store page, checkout, signup…).'}
        </p>
      </div>
    );
  }

  if (primary === 'M4') {
    return (
      <div className="space-y-3">
        <LabeledInput
          label="Profile / platform link"
          placeholder="https://instagram.com/yourhandle"
          value={value.links?.[0] ?? ''}
          onChange={(v) => onChange({ ...value, links: [v] })}
        />
      </div>
    );
  }

  // M1 / M5 — nothing to collect.
  return null;
}
