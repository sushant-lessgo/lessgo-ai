import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import { isTestimonialsEnabled } from '@/lib/testimonials/flag'
import { listTestimonialsByOwner } from '@/lib/testimonials/repo'
import TestimonialModerationList from '@/components/dashboard/testimonials/TestimonialModerationList'

export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {
  if (!isTestimonialsEnabled()) notFound()

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const testimonials = await listTestimonialsByOwner(userId)

  const counts = {
    total: testimonials.length,
    pending: testimonials.filter((t) => t.status === 'pending').length,
    approved: testimonials.filter((t) => t.status === 'approved').length,
    rejected: testimonials.filter((t) => t.status === 'rejected').length,
  }

  const stats = [
    { label: 'Total', value: counts.total, Icon: MessageSquare },
    { label: 'Pending', value: counts.pending, Icon: Clock },
    { label: 'Approved', value: counts.approved, Icon: CheckCircle2 },
    { label: 'Rejected', value: counts.rejected, Icon: XCircle },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <Header />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Testimonials</h1>
          <p className="text-sm text-gray-500">
            Collect, moderate, and manage customer testimonials for your landing pages.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="text-3xl font-bold text-gray-900">{value}</span>
            </div>
          ))}
        </div>

        <TestimonialModerationList initial={testimonials} />
      </main>
      <Footer />
    </div>
  )
}
