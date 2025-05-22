// app/p/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function PublishedPage({ params }: PageProps) {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug }
  })

  if (!page) return notFound()

  return (
    <html>
      <head>
        <title>{page.title || 'Untitled Page'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div
          dangerouslySetInnerHTML={{ __html: page.htmlContent }}
        />
      </body>
    </html>
  )
}
