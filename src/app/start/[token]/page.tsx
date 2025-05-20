import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PromptPageClient from './PromptPageClient'

type Params = {
  params: {
    token: string
  }
}

const DEMO_TOKEN = 'lessgodemomockdata'

export default async function StartTokenPage({ params }: Params) {
  const { token } = params
  // console.log('Token:', token)
  // ✅ Handle special-case demo token
  if (token === DEMO_TOKEN) {
    return <PromptPageClient token={token} />
  }

  // 🔍 Normal DB flow
  const dbToken = await prisma.token.findUnique({
    where: { value: token },
    include: {
      project: true,
    },
  })

  if (!dbToken || !dbToken.project) {
    notFound()
  }

  return <PromptPageClient token={token} />
}
