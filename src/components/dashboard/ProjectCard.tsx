'use client'

import posthog from 'posthog-js'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { stripHTMLTags } from '@/utils/htmlSanitization'

export type Project = {
  id: string
  name: string
  status: 'Draft' | 'Published'
  updatedAt: string
  tokenId: string | null
  slug: string | null
  type: 'unified'
  publishedAt?: string
}

type Props = {
  project: Project
  onEdit?: () => void
  onPreview?: () => void
}

export default function ProjectCard({ project, onEdit, onPreview }: Props) {
  const router = useRouter()

  const handleEdit = async () => {
    posthog.capture('project_edit_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    if (project.tokenId) {
      // Check if project has completed onboarding
      try {
        const response = await fetch(`/api/loadDraft?tokenId=${project.tokenId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Enhanced routing logic to handle different project states
          if (data.finalContent && data.stepIndex === 999) {
            // Generation is complete with usable page data - go directly to edit
            logger.debug('Project has generated page, routing to edit mode')
            router.push(`/edit/${project.tokenId}`)
          } else if (data.stepIndex >= 6 && data.featuresFromAI?.length > 0) {
            // Onboarding complete, has features, show generated page first
            logger.debug('Project ready for generation, routing to generate page')
            router.push(`/generate/${project.tokenId}`)
          } else if (data.finalContent) {
            // Has some final content but not from complete generation - go to edit
            logger.debug('Project has content, routing to edit mode') 
            router.push(`/edit/${project.tokenId}`)
          } else {
            // Still in onboarding flow
            logger.debug('Project in onboarding, routing to create flow')
            router.push(`/create/${project.tokenId}`)
          }
        } else {
          // Fallback to create for any errors
          router.push(`/create/${project.tokenId}`)
        }
      } catch (error) {
        // Fallback to create for any errors
        logger.warn('Failed to check project status, defaulting to create:', error)
        router.push(`/create/${project.tokenId}`)
      }
    }

    onEdit?.()
  }

  const handlePreview = () => {
    posthog.capture('project_preview_clicked', {
      project_id: project.id,
      project_name: project.name,
    })

    if (project.slug) {
      window.open(`/p/${project.slug}`, '_blank')
    }

    onPreview?.()
  }

  return (
    <div className="border border-brand-border rounded-md p-4 flex items-center justify-between hover:shadow-sm transition duration-200 bg-white">
      <div>
        <h3 className="text-heading4 font-heading text-brand-text mb-1">{stripHTMLTags(project.name || '')}</h3>
        <p className="text-sm text-brand-mutedText">
          {project.status}
          {project.slug && ` at /p/${project.slug}`}
          {' • '}
          {formatTime(project.updatedAt)}
        </p>
      </div>

      <div className="flex gap-2">
        {/* Draft projects: Continue button */}
        {project.status === 'Draft' && project.tokenId && (
          <button
            onClick={handleEdit}
            className="border border-brand-accentPrimary text-brand-accentPrimary text-sm px-3 py-1 rounded-md hover:bg-brand-highlightBG transition"
          >
            Continue
          </button>
        )}

        {/* Published projects: Edit + View Live + Analytics + Forms */}
        {project.status === 'Published' && project.tokenId && (
          <>
            <button
              onClick={handleEdit}
              className="border text-sm px-3 py-1 rounded-md hover:bg-gray-50 transition"
            >
              Edit
            </button>
            {project.slug && (
              <>
                <button
                  onClick={handlePreview}
                  className="border border-brand-accentPrimary bg-brand-accentPrimary text-white text-sm px-3 py-1 rounded-md hover:bg-orange-500 transition"
                >
                  View Live
                </button>
                <button
                  onClick={() => router.push(`/dashboard/analytics/${project.slug}`)}
                  className="border border-purple-200 bg-purple-50 text-purple-600 text-sm px-3 py-1 rounded-md hover:bg-purple-100 transition"
                >
                  Analytics
                </button>
                <button
                  onClick={() => router.push(`/dashboard/forms/${project.slug}`)}
                  className="border border-blue-200 bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-md hover:bg-blue-100 transition"
                >
                  Forms
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
