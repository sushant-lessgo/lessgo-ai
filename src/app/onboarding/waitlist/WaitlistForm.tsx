'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { usePostHog } from 'posthog-js/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserPersona } from '@/types/service';

interface WaitlistFormProps {
  persona: UserPersona;
}

export default function WaitlistForm({ persona }: WaitlistFormProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useUser();

  const initialEmail = user?.primaryEmailAddress?.emailAddress ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitted) return;

    setError(null);

    try {
      const domain = email.split('@')[1] || 'unknown';
      posthog?.capture('service_waitlist_signup', {
        persona,
        email,
        emailDomain: domain,
        projectType: 'service',
      });
      setSubmitted(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setError('Something went wrong. Try again.');
    }
  }

  if (submitted) {
    return (
      <div className="text-sm text-gray-700">
        Thanks — we&apos;ll be in touch. Heading back to your dashboard…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="waitlist-email" className="text-gray-700">
          Email
        </Label>
        <Input
          id="waitlist-email"
          type="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={!valid}
          className="bg-brand-accentPrimary hover:bg-orange-500"
        >
          Notify me
        </Button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to dashboard
        </button>
      </div>
    </form>
  );
}
