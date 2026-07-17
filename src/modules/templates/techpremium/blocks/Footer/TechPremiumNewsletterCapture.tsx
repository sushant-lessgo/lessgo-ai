'use client';

// src/modules/templates/techpremium/blocks/Footer/TechPremiumNewsletterCapture.tsx
// Live newsletter email capture for the published TechPremium footer. Uses the
// footer's .tp-news* classes (injected by TechPremiumFooter.published's <style>).
// Submits to the shared /api/forms/submit pipeline → FormSubmission →
// /dashboard/forms/[slug]. Rendered only when a newsletter form has been
// provisioned + connected in the editor. Renamed clone of MeridianNewsletterCapture.

import React, { useState } from 'react';
import type { MVPForm } from '@/types/core/forms';

interface TechPremiumNewsletterCaptureProps {
  form: MVPForm;
  formId: string;
  placeholder?: string;
  cta?: string;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export default function TechPremiumNewsletterCapture({
  form,
  formId,
  placeholder,
  cta,
  publishedPageId,
  pageOwnerId,
}: TechPremiumNewsletterCaptureProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldId = form.fields?.[0]?.id || 'email';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data: { [fieldId]: value },
          publishedPageId,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="tp-news-done">✓ {form.successMessage || 'Thanks for subscribing!'}</div>
    );
  }

  return (
    <form className="tp-news" onSubmit={handleSubmit}>
      <input
        className="tp-news__input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder || 'you@company.com'}
        disabled={submitting}
        aria-label="Email address"
        aria-invalid={!!error}
      />
      <button type="submit" className="tp-news__btn" disabled={submitting}>
        {submitting ? '…' : (cta || 'Subscribe')}
      </button>
    </form>
  );
}
