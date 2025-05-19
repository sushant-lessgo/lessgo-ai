'use client'

import posthog from 'posthog-js'

export type Project = {
  id: string
  name: string
  status: 'Draft' | 'Published'
  updatedAt: string
}


type Props = {
  project: Project
  onEdit?: () => void
  onPreview?: () => void
}

export default function ProjectCard({ project, onEdit, onPreview }: Props) {
  const handleEdit = () => {
    posthog.capture('project_edit_clicked', {
      project_id: project.id,
      project_name: project.name,
    })
    onEdit?.()
  }

  const handlePreview = () => {
    posthog.capture('project_preview_clicked', {
      project_id: project.id,
      project_name: project.name,
    })
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
        <button
          onClick={handleEdit}
          className="border border-brand-accentPrimary text-brand-accentPrimary text-sm px-3 py-1 rounded-md hover:bg-brand-highlightBG transition"
        >
          Edit
        </button>
        <button
          onClick={handlePreview}
          className="border text-sm px-3 py-1 rounded-md hover:bg-gray-50 transition"
        >
          Preview
        </button>
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
