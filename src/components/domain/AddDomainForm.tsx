'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface Props {
  slug: string;
  cooldownUntil?: number | null;
  onAdded: () => void;
}

export default function AddDomainForm({ slug, cooldownUntil, onAdded }: Props) {
  const [domain, setDomain] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cooldownSecs =
    cooldownUntil && cooldownUntil > Date.now()
      ? Math.ceil((cooldownUntil - Date.now()) / 1000)
      : 0;
  const disabled = submitting || !domain.trim() || cooldownSecs > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, customDomain: domain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add domain');
        return;
      }
      onAdded();
    } catch {
      setError("Couldn't reach server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 mb-1">Attach a custom domain</h3>
        <p className="text-sm text-gray-600">
          We&apos;ll guide you through ownership verification and DNS setup.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Domain
        </label>
        <Input
          type="text"
          placeholder="mysite.com or www.mysite.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={submitting}
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">
          Works for apex (mysite.com) or any subdomain you own.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {cooldownSecs > 0 && (
        <p className="text-xs text-gray-500">
          Waiting {cooldownSecs}s before adding a new domain…
        </p>
      )}

      <Button type="submit" disabled={disabled} className="w-full">
        {submitting ? 'Adding…' : 'Continue'}
      </Button>
    </form>
  );
}
