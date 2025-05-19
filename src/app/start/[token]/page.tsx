import { notFound } from 'next/navigation';
import validTokens from '@/data/validTokens.json';
import PromptPageClient from './PromptPageClient';

type Params = {
  params: {
    token: string;
  };
};

export default function StartTokenPage({ params }: Params) {
  const { token } = params;

  if (!validTokens.includes(token)) {
    notFound(); // ✅ runs server-side, fully supported
  }

  return <PromptPageClient token={token} />;
}
