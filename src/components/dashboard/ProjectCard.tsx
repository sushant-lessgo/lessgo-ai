'use client'

import posthog from 'posthog-js'
import { useRouter } from 'next/navigation'

export type Project = {
  id: string
  name: string
  status: 'Draft' | 'Published'
  updatedAt: string
  tokenId: string | null
  slug: string | null
  type: 'draft' | 'published'
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
          
          // If has finalContent, go to edit; otherwise go to create (onboarding)
          const destination = data.finalContent ? '/edit/' : '/create/'
          router.push(`${destination}${project.tokenId}`)
        } else {
          // Fallback to create for any errors
          router.push(`/create/${project.tokenId}`)
        }
      } catch (error) {
        // Fallback to create for any errors
        console.warn('Failed to check project status, defaulting to create:', error)
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
        <h3 className="text-heading4 font-heading text-brand-text mb-1">{project.name}</h3>
        <p className="text-sm text-brand-mutedText">
          {project.status} • {formatTime(project.updatedAt)}
        </p>
      </div>

      <div className="flex gap-2">
        {project.status === 'Draft' && project.tokenId && (
          <button
            onClick={handleEdit}
            className="border border-brand-accentPrimary text-brand-accentPrimary text-sm px-3 py-1 rounded-md hover:bg-brand-highlightBG transition"
          >
            Continue
          </button>
        )}

        {project.status === 'Published' && project.slug && (
          <>
            <button
              onClick={handlePreview}
              className="border text-sm px-3 py-1 rounded-md hover:bg-gray-50 transition"
            >
              Preview
            </button>
            <button
              onClick={() => router.push(`/dashboard/forms/${project.slug}`)}
              className="border border-blue-200 bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-md hover:bg-blue-100 transition"
            >
              View Forms
            </button>
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
