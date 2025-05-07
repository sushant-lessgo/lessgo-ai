import { notFound } from 'next/navigation';
import PromptPage from '@/modules/prompt/PromptPage';
import validTokens from '@/data/validTokens.json';

type Params = {
  params: {
    token: string;
  };
};

export default function StartTokenPage({ params }: Params) {
  const { token } = params;

  if (!validTokens.includes(token)) {
    notFound();
  }

  return <PromptPage />;
}
