"use client";

import { useEffect } from 'react';
import PromptPage from '@/modules/prompt/PromptPage';
import posthog from 'posthog-js';

export default function PromptPageClient({ token }: { token: string }) {
  useEffect(() => {
    // Store the token locally for session continuity
    localStorage.setItem("lessgo_token", token);
    // console.log("Token:", token);
    // Identify user anonymously by token (works before login)
    posthog.identify(token, {
      method: 'token_only',
    });

    // Track that the token-based page was viewed
    posthog.capture('start_page_viewed', {
      token,
    });
  }, [token]);

  return <PromptPage />;
}
