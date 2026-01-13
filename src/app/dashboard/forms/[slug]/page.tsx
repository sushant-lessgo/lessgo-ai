import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import FormSubmissionsTable from '@/components/dashboard/FormSubmissionsTable'
import ExportFormCSV from './components/ExportFormCSV'
import { ArrowLeft, FileText, ClipboardList, Calendar } from 'lucide-react'
import Link from 'next/link'
import { stripHTMLTags } from '@/utils/htmlSanitization'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function FormSubmissionsPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const publishedPage = await prisma.publishedPage.findFirst({
    where: {
      slug: params.slug,
      userId,
    },
  })

  if (!publishedPage) {
    notFound()
  }

  const submissions = await prisma.formSubmission.findMany({
    where: {
      userId,
      publishedPageId: publishedPage.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Group submissions by form
  const submissionsByForm = submissions.reduce((acc, submission) => {
    const formId = submission.formId
    if (!acc[formId]) {
      acc[formId] = {
        formName: submission.formName,
        submissions: [],
      }
    }
    acc[formId].submissions.push(submission)
    return acc
  }, {} as Record<string, { formName: string; submissions: typeof submissions }>)

  const totalSubmissions = submissions.length
  const uniqueForms = Object.keys(submissionsByForm).length
  const thisMonth = submissions.filter(s => {
    const d = new Date(s.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <Header />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {stripHTMLTags(publishedPage.title || 'Untitled Page')}
          </h1>
          <a
            href={`/p/${params.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            lessgo.ai/p/{params.slug} ↗
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{totalSubmissions}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium">Forms</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{uniqueForms}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{thisMonth}</span>
          </div>
        </div>

        {/* Export */}
        {totalSubmissions > 0 && (
          <div className="flex justify-end mb-4">
            <ExportFormCSV submissions={submissions} slug={params.slug} />
          </div>
        )}

        {/* Form Submissions */}
        {totalSubmissions > 0 ? (
          <div className="space-y-6">
            {Object.entries(submissionsByForm).map(([formId, { formName, submissions }]) => (
              <div key={formId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-medium text-gray-900">
                    {formName}
                    <span className="ml-2 text-gray-400 font-normal">
                      {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                </div>
                <FormSubmissionsTable submissions={submissions} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No submissions yet
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                When visitors submit forms on your page, they appear here.
              </p>
              <Link
                href={`/p/${params.slug}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
              >
                View page
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
