// ============================================================================
// WorkLibraryClient — the "Your work" dashboard host (work-library-board P5).
//
// Pins three host behaviours:
//   1. GET payload → CorrectionBoard props (groups + blur map render).
//   2. Every verb commits the FULL rebuilt array through `PUT /api/work-library`.
//   3. Dashboard hide is flag-mode: the photo dims and gains a Restore affordance
//      (hide-not-destroy), and the committed ref carries `hidden:true`.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo),
// mirroring UnderstoodRail.test.tsx. `fetch` is stubbed to serve GET + PUT.
// ============================================================================

import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import WorkLibraryClient from './WorkLibraryClient'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

let container: HTMLDivElement
let root: Root

const GET_PAYLOAD = () => ({
  groups: [
    {
      name: 'Weddings',
      kind: 'category',
      slug: 'weddings',
      photos: [{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }],
    },
    {
      name: 'Portraits',
      kind: 'category',
      slug: 'portraits',
      photos: [{ id: 'ph_p1', url: 'https://cdn.example.com/p1.jpg' }],
    },
  ],
  blurByUrl: {
    'https://cdn.example.com/w1.jpg': 'data:image/png;base64,BLURW1',
  },
})

interface PutCapture {
  body: { tokenId: string; groups: any[] }
}

/** Stub fetch: GET → the payload; PUT → echo the sent groups (server-authoritative). */
function stubFetch(captures: PutCapture[]) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (method === 'PUT') {
      const body = JSON.parse(init!.body as string)
      captures.push({ body })
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, groups: body.groups }),
      } as Response
    }
    // GET
    return {
      ok: true,
      status: 200,
      json: async () => GET_PAYLOAD(),
    } as Response
  })
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)
  return fetchMock
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

const testid = <T extends Element>(id: string) =>
  container.querySelector<T>(`[data-testid="${id}"]`)

async function click(el: Element | null) {
  expect(el, 'element to click').not.toBeNull()
  await act(async () => {
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await flush()
}

async function mount() {
  await act(async () => {
    root.render(<WorkLibraryClient tokenId="tok_test" />)
  })
  await flush()
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('WorkLibraryClient — GET payload → board props', () => {
  it('renders the loaded groups and paints the blur behind a thumbnail', async () => {
    stubFetch([])
    await mount()

    // Both groups render with their verbatim names.
    expect(testid('correction-group-name-0')?.textContent).toContain('Weddings')
    expect(testid('correction-group-name-1')?.textContent).toContain('Portraits')

    // The thumbnail with a blur entry paints the blur data-url as a background.
    const thumb = testid<HTMLDivElement>('correction-photo-0-0')
    expect(thumb).not.toBeNull()
    expect(thumb!.style.backgroundImage).toContain('BLURW1')

    // The Update-site CTA deep-links to the /preview publish flow (phase-6
    // fallback path — the direct-from-board primary was DOA on shape mismatch).
    const cta = testid<HTMLAnchorElement>('work-update-site')
    expect(cta).not.toBeNull()
    expect(cta!.tagName).toBe('A')
    expect(cta!.getAttribute('href')).toBe('/preview/tok_test')
  })
})

describe('WorkLibraryClient — hide commits the full array + shows Restore', () => {
  it('flag-mode hide PUTs the full array with hidden:true and renders Restore', async () => {
    const captures: PutCapture[] = []
    stubFetch(captures)
    await mount()

    await click(testid('correction-hide-0-0'))

    // Exactly one PUT with the FULL rebuilt array (both groups present).
    expect(captures).toHaveLength(1)
    expect(captures[0].body.tokenId).toBe('tok_test')
    expect(captures[0].body.groups).toHaveLength(2)
    expect(captures[0].body.groups[1].name).toBe('Portraits')

    // The hidden photo carries the flag (hide-not-destroy — still in the array).
    const g0 = captures[0].body.groups[0]
    expect(g0.photos[0].id).toBe('ph_w1')
    expect(g0.photos[0].hidden).toBe(true)

    // Restore affordance now rendered for the dimmed photo.
    expect(testid('correction-restore-0-0')).not.toBeNull()
  })
})
