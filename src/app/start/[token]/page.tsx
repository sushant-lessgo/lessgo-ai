"use client"

import { useEffect } from 'react';
import { notFound } from 'next/navigation';
import PromptPage from '@/modules/prompt/PromptPage';
import validTokens from '@/data/validTokens.json';
import posthog from 'posthog-js';

type Params = {
  params: {
    token: string;
  };
};

export default function StartTokenPage({ params }: Params) {
  const { token } = params;

  useEffect(() => {
    localStorage.setItem("lessgo_token", token)

     // Identify user and capture event
    posthog.identify(token);
    posthog.capture('token_received', { token });

  }, [token]);

  if (!validTokens.includes(token)) {
    notFound();
  }

  return <PromptPage />;
}
