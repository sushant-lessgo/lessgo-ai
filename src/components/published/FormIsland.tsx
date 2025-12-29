'use client';

import { useState } from 'react';

interface FormIslandProps {
  formId: string;
  submitButtonText: string;
  submitButtonColor?: string;
  textColor?: string;
  publishedPageId: string;
  pageOwnerId: string;
  placeholderText?: string;
  formLabel?: string;
  privacyText?: string;
}

export function FormIsland({
  formId,
  submitButtonText,
  submitButtonColor = '#3B82F6',
  textColor = '#FFFFFF',
  publishedPageId,
  pageOwnerId,
  placeholderText = 'Enter your work email',
  formLabel,
  privacyText,
}: FormIslandProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data: { email },
          publishedPageId,
          userId: pageOwnerId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Submission failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
        <div className="text-center">
          <div className="text-green-600 text-2xl mb-2">✓</div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">Thank you!</h3>
          <p className="text-green-700">Your submission has been received.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formLabel && (
        <label htmlFor={`email-${formId}`} className="text-gray-700 font-semibold block">
          {formLabel}
        </label>
      )}

      <div>
        <input
          id={`email-${formId}`}
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholderText}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ background: submitButtonColor, color: textColor }}
        className="w-full px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
      >
        {loading ? 'Submitting...' : submitButtonText}
      </button>

      {status === 'error' && (
        <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {privacyText && (
        <p className="text-center text-xs text-gray-500 mt-2">
          {privacyText}
        </p>
      )}
    </form>
  );
}
