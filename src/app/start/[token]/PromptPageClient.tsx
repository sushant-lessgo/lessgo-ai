'use client';

import { useEffect } from 'react';
import PromptPage from '@/modules/prompt/PromptPage';
import posthog from 'posthog-js';
import { TokenProvider } from '@/context/TokenContext';

export default function PromptPageClient({ token }: { token: string }) {
  useEffect(() => {
    // Store the token locally for session continuity
    localStorage.setItem('lessgo_token', token);

    // Identify user anonymously by token (works before login)
    posthog.identify(token, {
      method: 'token_only',
    });

    // Track that the token-based page was viewed
    posthog.capture('start_page_viewed', {
      token,
    });

    // Warn user before refresh or tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  return (
    <TokenProvider tokenId={token}>
      <PromptPage />
    </TokenProvider>
  );
}
