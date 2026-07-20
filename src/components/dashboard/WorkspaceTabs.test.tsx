// src/components/dashboard/WorkspaceTabs.test.tsx
//
// The Content (CMS) tab's greyed-vs-live states. The rule being pinned is the
// greyed-placeholder discipline: a project with no collections still SEES the tab,
// disabled with a why-tooltip — it is never hidden. A tab that silently appears
// later is a capability the user never learns they have.
//
// `@testing-library` is not installed in this repo — mount with createRoot + act.

import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const pathname = { current: '/dashboard/tok_1' }
vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}))
// next/link is a client component that needs a router context; the bar only needs
// it to render an <a href>.
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) =>
    React.createElement('a', { href, ...rest }, children),
}))

import WorkspaceTabs from './WorkspaceTabs'

let container: HTMLDivElement
let root: Root

async function render(props: Partial<React.ComponentProps<typeof WorkspaceTabs>> = {}) {
  await act(async () => {
    root.render(<WorkspaceTabs tokenId="tok_1" {...props} />)
  })
}

const tabByLabel = (label: string): HTMLElement | null => {
  const nodes = Array.from(container.querySelectorAll('a, button'))
  return (nodes.find((n) => n.textContent?.trim().startsWith(label)) as HTMLElement) ?? null
}

const labels = () =>
  Array.from(container.querySelectorAll('a, button')).map((n) =>
    (n.textContent || '').trim().replace(/\s+/g, ' ')
  )

beforeEach(() => {
  pathname.current = '/dashboard/tok_1'
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('WorkspaceTabs — the Content tab', () => {
  it('renders GREYED with a why-tooltip when the project has no collections', async () => {
    await render({ hasCollections: false })

    const tab = tabByLabel('Content')
    expect(tab).not.toBeNull()
    // It is shown, not hidden — the whole point.
    expect(labels()).toContain('Content')
    expect(tab!.tagName).toBe('BUTTON')
    expect((tab as HTMLButtonElement).disabled).toBe(true)
    expect(tab!.getAttribute('aria-disabled')).toBe('true')
    // The why-tooltip must actually say where collections come from.
    expect(tab!.getAttribute('title')).toMatch(/no collections yet/i)
    expect(tab!.getAttribute('title')).toMatch(/editor/i)
    // Greyed, and NOT a link.
    expect(tab!.className).toContain('opacity-50')
    expect(container.querySelector('a[href="/dashboard/tok_1/cms"]')).toBeNull()
  })

  it('renders a real LINK once the project has collections', async () => {
    await render({ hasCollections: true })

    const tab = tabByLabel('Content')
    expect(tab).not.toBeNull()
    expect(tab!.tagName).toBe('A')
    expect(tab!.getAttribute('href')).toBe('/dashboard/tok_1/cms')
    // Not greyed, and carries no disabled affordance.
    expect(tab!.className).not.toContain('opacity-50')
    expect(tab!.getAttribute('aria-disabled')).toBeNull()
    expect(tab!.getAttribute('title')).toBeNull()
    expect(container.querySelector('[data-tab-disabled="cms"]')).toBeNull()
  })

  it('marks Content active on the cms route (and only there)', async () => {
    pathname.current = '/dashboard/tok_1/cms'
    await render({ hasCollections: true })

    expect(tabByLabel('Content')!.getAttribute('aria-current')).toBe('page')
    expect(tabByLabel('Blog')!.getAttribute('aria-current')).toBeNull()
    expect(tabByLabel('Overview')!.getAttribute('aria-current')).toBeNull()
  })

  it('sits after Blog, with and without the work tab', async () => {
    await render({ hasCollections: true })
    expect(labels()).toEqual([
      'Overview',
      'Blog',
      'Content',
      'Leads',
      'Testimonials',
      'Analytics',
      'Grow',
    ])

    await render({ hasCollections: true, showWorkTab: true })
    expect(labels()).toEqual([
      'Overview',
      'Your work',
      'Blog',
      'Content',
      'Leads',
      'Testimonials',
      'Analytics',
      'Grow',
    ])
  })

  it('is NOT template-gated — the greyed state is the only gate', async () => {
    // The collection block is a SHARED block, so `showWorkTab` (the template
    // capability signal) must not influence Content at all.
    await render({ hasCollections: true, showWorkTab: false })
    expect(tabByLabel('Content')!.tagName).toBe('A')

    await render({ hasCollections: false, showWorkTab: true })
    expect(tabByLabel('Content')!.tagName).toBe('BUTTON')
  })

  it('leaves Grow greyed regardless of collections (no regression)', async () => {
    await render({ hasCollections: true })
    const grow = tabByLabel('Grow') as HTMLButtonElement
    expect(grow.disabled).toBe(true)
    expect(grow.className).toContain('opacity-50')
  })
})
