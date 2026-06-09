'use client';

// Success confirmation shown on /dashboard after a persona change in settings.
// Mirrors the billing `?success=` inline-banner convention. Dismissing it also
// strips the `personaUpdated` query param so a refresh doesn't re-show it.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PersonaUpdatedBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    router.replace('/dashboard');
  };

  return (
    <div
      role="status"
      className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
    >
      <span>✓ Persona updated — we'll tailor what we build for you.</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-green-700 hover:text-green-900"
      >
        ✕
      </button>
    </div>
  );
}
