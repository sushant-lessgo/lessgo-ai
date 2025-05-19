'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { currentUser } from '@clerk/nextjs/server'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import ProjectCard from '@/components/dashboard/ProjectCard'
import EmptyState from '@/components/dashboard/EmptyState'

// Replace this with real backend/API integration
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'CryptoX Landing Page',
    status: 'Draft',
    updatedAt: '2025-05-10T12:00:00Z',
  },
  {
    id: '2',
    name: 'AI SaaS Launch',
    status: 'Published',
    updatedAt: '2025-05-17T18:45:00Z',
  },
]

export default function DashboardPage() {
  useEffect(() => {
    posthog.capture('dashboard_viewed')
  }, [])

  const projects = mockProjects // Replace with data from backend/store

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      {/* Top Nav */}
      <Header />

      {/* Main content */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8">
        <DashboardHeader />

        {projects.length > 0 ? (
          <section className="space-y-4 mt-4">
            <h2 className="text-sm uppercase text-brand-mutedText tracking-wide">
              Recent Projects
            </h2>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </section>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
