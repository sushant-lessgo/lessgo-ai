'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useEditStore } from '@/hooks/useEditStore';

const JURISDICTIONS = ['US', 'EU', 'UK', 'Global'] as const;
type Jurisdiction = typeof JURISDICTIONS[number];

const DATA_OPTIONS = [
  { id: 'email', label: 'Email address' },
  { id: 'name', label: 'Name / profile info' },
  { id: 'payment', label: 'Payment information' },
  { id: 'usage', label: 'Usage / behavioral data' },
  { id: 'ip', label: 'IP address / device info' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

type Phase = 'form' | 'editing';

export function PrivacyPolicyEditor({ isOpen, onClose, companyName: initialName }: Props) {
  const store = useEditStore();
  const existing = store.legalPages?.privacy;

  const [phase, setPhase] = useState<Phase>(existing ? 'editing' : 'form');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    companyName: initialName || store.title || '',
    jurisdiction: (existing?.metadata?.jurisdiction as Jurisdiction) || 'Global',
    dataCollected: existing?.metadata?.dataCollected || ['email'],
    cookiesUsed: existing?.metadata?.cookiesUsed ?? false,
    analyticsUsed: existing?.metadata?.analyticsUsed ?? false,
    contactEmail: existing?.metadata?.contactEmail || '',
    websiteUrl: '',
  });

  const [markdown, setMarkdown] = useState(existing?.content || '');

  useEffect(() => {
    if (!isOpen) return;
    if (existing) {
      setPhase('editing');
      setMarkdown(existing.content);
    } else {
      setPhase('form');
      setMarkdown('');
    }
  }, [isOpen, existing]);

  if (!isOpen) return null;

  const toggleData = (id: string) => {
    setForm((f) => ({
      ...f,
      dataCollected: f.dataCollected.includes(id)
        ? f.dataCollected.filter((d) => d !== id)
        : [...f.dataCollected, id],
    }));
  };

  const generate = async () => {
    if (!form.companyName.trim() || !form.contactEmail.trim()) {
      alert('Company name and contact email are required.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-privacy-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: store.tokenId,
          jurisdiction: form.jurisdiction,
          dataCollected: form.dataCollected,
          cookiesUsed: form.cookiesUsed,
          analyticsUsed: form.analyticsUsed,
          contactEmail: form.contactEmail,
          companyName: form.companyName,
          websiteUrl: form.websiteUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.message || 'Generation failed. Please try again.');
        return;
      }
      setMarkdown(data.content);
      setPhase('editing');
    } catch (err: any) {
      alert(err?.message || 'Network error during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = () => {
    if (!confirm('Regenerate will cost 2 credits and replace your current draft. Continue?')) return;
    setPhase('form');
  };

  const save = () => {
    if (!markdown.trim()) {
      alert('Privacy policy cannot be empty.');
      return;
    }
    store.setLegalPage('privacy', {
      content: markdown,
      metadata: {
        jurisdiction: form.jurisdiction,
        dataCollected: form.dataCollected,
        cookiesUsed: form.cookiesUsed,
        analyticsUsed: form.analyticsUsed,
        contactEmail: form.contactEmail,
      },
    });
    if (typeof store.triggerAutoSave === 'function') {
      try { store.triggerAutoSave(); } catch {}
    }
    onClose();
  };

  const removePolicy = () => {
    if (!confirm('Remove the privacy policy from this project?')) return;
    store.setLegalPage('privacy', undefined);
    if (typeof store.triggerAutoSave === 'function') {
      try { store.triggerAutoSave(); } catch {}
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch justify-center p-0 md:p-6">
      <div className="bg-white w-full md:max-w-5xl md:rounded-lg shadow-xl flex flex-col max-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Privacy Policy</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              AI-generated — review with a lawyer before publishing.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {phase === 'form' && (
            <div className="p-6 space-y-5 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / product name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL (optional)</label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select
                  value={form.jurisdiction}
                  onChange={(e) => setForm({ ...form, jurisdiction: e.target.value as Jurisdiction })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  {JURISDICTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Affects regional rights language (GDPR, CCPA, etc.).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data your product collects</label>
                <div className="space-y-2">
                  {DATA_OPTIONS.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={form.dataCollected.includes(opt.id)}
                        onChange={() => toggleData(opt.id)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={form.cookiesUsed}
                    onChange={(e) => setForm({ ...form, cookiesUsed: e.target.checked })}
                  />
                  Uses cookies
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={form.analyticsUsed}
                    onChange={(e) => setForm({ ...form, analyticsUsed: e.target.checked })}
                  />
                  Uses analytics
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="privacy@example.com"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating…' : 'Generate (2 credits)'}
                </button>
              </div>
            </div>
          )}

          {phase === 'editing' && (
            <div className="flex flex-col h-full">
              {/* Mobile tabs */}
              <div className="md:hidden border-b border-gray-200 flex">
                <button
                  onClick={() => setMobileTab('edit')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${mobileTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setMobileTab('preview')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${mobileTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Preview
                </button>
              </div>

              <div className="flex-1 grid md:grid-cols-2 gap-0 md:gap-4 p-0 md:p-4 overflow-hidden">
                <div className={`${mobileTab !== 'edit' ? 'hidden md:block' : ''} overflow-auto`}>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="w-full h-full min-h-[400px] p-4 md:border md:rounded-md border-gray-200 font-mono text-sm text-gray-900 resize-none focus:outline-none"
                    placeholder="Privacy policy markdown…"
                  />
                </div>
                <div className={`${mobileTab !== 'preview' ? 'hidden md:block' : ''} overflow-auto`}>
                  <div className="p-4 md:border md:rounded-md border-gray-200 prose prose-sm max-w-none h-full">
                    <ReactMarkdown>{markdown || '*Preview will appear here.*'}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'editing' && (
          <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-gray-200">
            <button
              onClick={removePolicy}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove policy
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={regenerate}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
              >
                Regenerate (2 credits)
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrivacyPolicyEditor;
