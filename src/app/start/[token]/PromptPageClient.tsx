"use client";

import { useEffect } from 'react';
import PromptPage from '@/modules/prompt/PromptPage';
import posthog from 'posthog-js';

export default function PromptPageClient({ token }: { token: string }) {
  useEffect(() => {
    localStorage.setItem("lessgo_token", token);
    posthog.identify(token);
    posthog.capture('token_received', { token });
  }, [token]);

  return <PromptPage />;
}
