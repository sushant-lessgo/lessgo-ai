import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import FormSubmissionsTable from '@/components/dashboard/FormSubmissionsTable'
import { ArrowLeft, Download, Filter } from 'lucide-react'
import Link from 'next/link'

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

  // Find the published page
  const publishedPage = await prisma.publishedPage.findFirst({
    where: {
      slug: params.slug,
      userId,
    },
  })

  if (!publishedPage) {
    notFound()
  }

  // Get form submissions for this page
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
  }, {} as Record<string, { formName: string; submissions: any[] }>)

  const totalSubmissions = submissions.length
  const uniqueForms = Object.keys(submissionsByForm).length

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      <Header />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard"
              className="flex items-center text-brand-mutedText hover:text-brand-text transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-heading1 font-heading text-landing-textPrimary mb-2">
            Form Submissions
          </h1>
          <p className="text-brand-mutedText">
            {publishedPage.title} • <strong>{totalSubmissions}</strong> total submissions from <strong>{uniqueForms}</strong> forms
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-brand-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-mutedText">Total Submissions</p>
                <p className="text-2xl font-bold text-brand-text">{totalSubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-mutedText">Active Forms</p>
                <p className="text-2xl font-bold text-brand-text">{uniqueForms}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-mutedText">This Month</p>
                <p className="text-2xl font-bold text-brand-text">
                  {submissions.filter(s => {
                    const submissionDate = new Date(s.createdAt)
                    const now = new Date()
                    return (
                      submissionDate.getMonth() === now.getMonth() &&
                      submissionDate.getFullYear() === now.getFullYear()
                    )
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 border border-brand-border rounded-md hover:bg-gray-50 transition">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
          <button className="flex items-center px-3 py-2 bg-brand-accentPrimary text-white rounded-md hover:bg-brand-logo transition">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Form Submissions */}
        {totalSubmissions > 0 ? (
          <div className="space-y-8">
            {Object.entries(submissionsByForm).map(([formId, { formName, submissions }]) => (
              <div key={formId} className="bg-white border border-brand-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-border bg-gray-50">
                  <h3 className="text-lg font-medium text-brand-text">
                    {formName} ({submissions.length} submissions)
                  </h3>
                </div>
                <FormSubmissionsTable submissions={submissions} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-brand-text mb-2">No submissions yet</h3>
            <p className="text-brand-mutedText mb-4">
              When visitors submit forms on your published page, they'll appear here.
            </p>
            <Link 
              href={`/p/${publishedPage.slug}`}
              target="_blank"
              className="inline-flex items-center px-4 py-2 bg-brand-accentPrimary text-white rounded-md hover:bg-brand-logo transition"
            >
              View Published Page
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}