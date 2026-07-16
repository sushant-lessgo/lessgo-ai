'use client'

import posthog from 'posthog-js'
import { logger } from '@/lib/logger'

/**
 * continueRouting — the state-aware "open this project" router.
 *
 * ⚠️ LOAD-BEARING — ported VERBATIM from the retired `ProjectCard.handleEdit`
 * (`src/components/dashboard/ProjectCard.tsx:41-84`, dashboard-workspace-ia
 * phase 2 / B4). FOUR branches + TWO error fallbacks. Do NOT simplify:
 *
 *   1. finalContent && stepIndex === 999          → /edit/{token}
 *   2. stepIndex >= 6 && featuresFromAI?.length>0 → /generate/{token}
 *   3. finalContent (bare, stepIndex ≠ 999)       → /edit/{token}   ← easy to drop;
 *      without it, content-bearing drafts silently bounce back to onboarding.
 *   4. else                                       → /onboarding/product/{token}
 *   fallback !response.ok                         → /onboarding/product/{token}
 *   fallback catch                                → /onboarding/product/{token}
 *
 * 🚨 PostHog SINGLE CALL SITE (B5): `project_edit_clicked` fires HERE and nowhere
 * else. Every editor entry point (card primary button, `•••` "Open editor", and
 * phase 3's WorkspaceHeader "Open editor") calls this util and must NOT capture the
 * event itself — otherwise double-fire. Never hard-code `/edit/{token}` at a call
 * site: it 404s while a draft is still mid-onboarding.
 */

export interface ContinueRoutingProject {
  id: string
  name: string
  tokenId: string | null
}

/** Minimal shape of next/navigation's router — keeps this util test/DOM-agnostic. */
export interface ContinueRoutingRouter {
  push: (href: string) => void
}

export async function continueRouting(
  project: ContinueRoutingProject,
  router: ContinueRoutingRouter
): Promise<void> {
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
          router.push(`/onboarding/product/${project.tokenId}`)
        }
      } else {
        // Fallback to create for any errors
        router.push(`/onboarding/product/${project.tokenId}`)
      }
    } catch (error) {
      // Fallback to create for any errors
      logger.warn('Failed to check project status, defaulting to create:', error)
      router.push(`/onboarding/product/${project.tokenId}`)
    }
  }
}
