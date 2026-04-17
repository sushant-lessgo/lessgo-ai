'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { EditProvider } from '@/components/EditProvider';
import { useEditStoreLegacy } from '@/hooks/useEditStoreLegacy';

export default function PreviewPrivacyPage() {
  const params = useParams();
  const tokenId = params?.token as string;

  if (!tokenId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid URL</h2>
          <p className="text-gray-600">No token provided in URL</p>
        </div>
      </div>
    );
  }

  return (
    <EditProvider
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        resetOnTokenChange: false,
      }}
    >
      <PrivacyContent tokenId={tokenId} />
    </EditProvider>
  );
}

function PrivacyContent({ tokenId }: { tokenId: string }) {
  const { legalPages, theme, title } = useEditStoreLegacy();
  const privacy = legalPages?.privacy;

  const themeColors = (theme?.colors as any) || {};
  const bgColor = themeColors.background || themeColors.backgroundPrimary || '#FFFFFF';
  const textColor = themeColors.text || themeColors.textPrimary || '#111827';

  if (!privacy?.content) {
    return (
      <main
        style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}
        className="py-12 md:py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">No Privacy Policy Yet</h1>
          <p className="opacity-70 mb-6">
            Open the editor and click <strong>+ Add Privacy Policy</strong> in the footer to create one.
          </p>
          <a
            href={`/preview/${tokenId}`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            ← Back to preview
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}
      className="py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        {title && <p className="text-sm opacity-70 mb-6">For {title}</p>}
        {privacy.updatedAt && (
          <p className="text-xs opacity-60 mb-8">
            Last updated: {new Date(privacy.updatedAt).toLocaleDateString()}
          </p>
        )}
        <article className="prose prose-neutral max-w-none">
          <ReactMarkdown>{privacy.content}</ReactMarkdown>
        </article>
        <p className="mt-12 pt-6 border-t border-gray-200 text-xs opacity-60">
          This privacy policy was generated with AI assistance. For legal advice, consult a lawyer.
        </p>
        <p className="mt-6 text-sm">
          <a href={`/preview/${tokenId}`} className="underline hover:opacity-80">
            ← Back to preview
          </a>
        </p>
      </div>
    </main>
  );
}
