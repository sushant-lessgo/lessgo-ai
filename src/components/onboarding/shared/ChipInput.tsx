'use client';

// scale-06 phase 3 — COPY of the service field component
// (`src/app/onboarding/service/[token]/components/fields/ChipInput.tsx`),
// re-homed under the shared onboarding tree so the unified wizard does not
// depend on the old service segment (which is deleted in phase 10). The
// original is left BYTE-UNCHANGED so the old service wizard keeps working.

import { useState } from 'react';
import { X } from 'lucide-react';

interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxChips?: number;
  ariaLabel?: string;
}

// Free-text chip input. Comma or Enter to commit. Backspace on empty input
// removes the last chip. No autocomplete — pilot ships free-text only.
export default function ChipInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  maxChips = 12,
  ariaLabel,
}: ChipInputProps) {
  const [draft, setDraft] = useState('');

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft('');
      return;
    }
    if (value.length >= maxChips) return;
    onChange([...value, trimmed]);
    setDraft('');
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2 p-2 rounded-md border border-input bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-brand-accentPrimary/30 focus-within:border-brand-accentPrimary/40"
      onClick={(e) => {
        const input = (e.currentTarget as HTMLDivElement).querySelector(
          'input'
        );
        input?.focus();
      }}
    >
      {value.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-brand-accentPrimary border border-orange-200 text-sm"
        >
          {chip}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
            className="hover:text-orange-700"
            aria-label={`Remove ${chip}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ''}
        aria-label={ariaLabel || placeholder}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-gray-400"
      />
    </div>
  );
}
