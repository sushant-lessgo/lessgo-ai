import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GeneratedLanding from '@/components/generatedLanding/GeneratedLanding';
import PromptPageClient from './PromptPageClient';
import { TokenProvider } from '@/context/TokenContext';

type Params = {
  params: {
    token: string;
  };
};

const DEMO_TOKEN = 'lessgodemomockdata';

export default async function StartTokenPage({ params }: Params) {
  const { token } = params;

  // ✅ Handle demo token separately
  if (token === DEMO_TOKEN) {
    return <PromptPageClient token={token} />;
  }

  // 🔍 Lookup token + project
  const dbToken = await prisma.token.findUnique({
    where: { value: token },
    include: { project: true },
  });

  if (!dbToken) {
    return notFound(); // invalid token
  }

  // ✅ If draft exists → load edit UI
  if (dbToken.project?.content) {
  return (
    <GeneratedLanding
      data={dbToken.project.content as any}
      input={''}
    />
  );
}


  // ✅ If no draft yet → show prompt input flow
  return (
    <TokenProvider tokenId={token}>
      <PromptPageClient token={token} />
    </TokenProvider>
  );
}
