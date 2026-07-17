// ============================================================================
// DraftReplyPanel — leads-inbox "Draft reply" pane (Dashboard S4b, phase 3).
//
// Covers what the route tests can't: the CLIENT gate + state machine. Asserts
// real behaviour (which text/branch renders), not mere element presence.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo —
// same idiom as src/components/onboarding/journey/JourneyEntryStep.test.tsx).
// ============================================================================

import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import DraftReplyPanel from './DraftReplyPanel'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

let container: HTMLDivElement
let root: Root

const WITH_MESSAGE = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Hi, do you shoot destination weddings in Italy next summer?',
}

const CONTACT_ONLY = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+31 6 12345678',
}

/** Blanket single-shape fetch mock. */
function mockFetch(status: number, json: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function render(props: React.ComponentProps<typeof DraftReplyPanel>) {
  await act(async () => {
    root.render(<DraftReplyPanel {...props} />)
  })
}

async function flush(times = 4) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
  }
}

const draftButton = () =>
  Array.from(container.querySelectorAll('button')).find((b) =>
    /Draft reply/i.test(b.textContent ?? ''),
  )

const textarea = () =>
  container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Draft reply"]')

async function click(btn: Element) {
  await act(async () => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await flush()
}

/** Set a controlled textarea's value the way a real user edit would. */
async function editTextarea(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value',
  )!.set!
  await act(async () => {
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  delete process.env.NEXT_PUBLIC_LEAD_REPLY_DISABLED
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DraftReplyPanel', () => {
  it('renders nothing when the submission has no replyable message', async () => {
    const fetchMock = mockFetch(200, {})
    await render({ submissionId: 'sub_1', data: CONTACT_ONLY })

    expect(container.textContent).toBe('')
    expect(draftButton()).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders nothing when the kill-switch env is set (even with a message)', async () => {
    process.env.NEXT_PUBLIC_LEAD_REPLY_DISABLED = 'true'
    await render({ submissionId: 'sub_1', data: WITH_MESSAGE })
    expect(container.textContent).toBe('')
  })

  it('drafts on click: POSTs the submission id and shows the reply in an editable textarea', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      reply: 'Thanks for reaching out! Yes, we cover Italy weddings.',
      grounding: 'brief',
      remaining: 41,
    })
    await render({ submissionId: 'sub_42', data: WITH_MESSAGE })

    const btn = draftButton()
    expect(btn).toBeDefined()
    await click(btn!)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/leads/sub_42/draft-reply',
      expect.objectContaining({ method: 'POST' }),
    )

    const ta = textarea()
    expect(ta).not.toBeNull()
    expect(ta!.value).toBe('Thanks for reaching out! Yes, we cover Italy weddings.')
    // Copy + Regenerate now offered.
    expect(container.textContent).toContain('Copy')
    expect(container.textContent).toContain('Regenerate (1 credit)')
    // brief grounding → no "less on-brand" hint.
    expect(container.textContent).not.toContain('less on-brand')
  })

  it('shows the light-grounding hint when the draft is grounded lightly', async () => {
    mockFetch(200, { success: true, reply: 'A generic but fine reply.', grounding: 'light' })
    await render({ submissionId: 'sub_9', data: WITH_MESSAGE })
    await click(draftButton()!)

    expect(textarea()!.value).toBe('A generic but fine reply.')
    expect(container.textContent).toContain('less on-brand')
  })

  it('402 → greyed disabled button with an upgrade / top-up why-message', async () => {
    mockFetch(402, {
      success: false,
      error: 'insufficient_credits',
      message: 'Insufficient credits. Required: 1, Available: 0',
      remaining: 0,
    })
    await render({ submissionId: 'sub_5', data: WITH_MESSAGE })
    await click(draftButton()!)

    const btn = draftButton()
    expect(btn).toBeDefined()
    expect(btn!.disabled).toBe(true)
    // Assert the WHY content, not just a disabled element.
    expect(container.textContent).toContain('Upgrade or top up to draft replies.')
    expect(container.textContent).toContain('Insufficient credits')
    // No textarea in the out-of-credits state.
    expect(textarea()).toBeNull()
  })

  it('500 → inline error, retry allowed, and founder textarea edits are preserved', async () => {
    // First a successful draft, then edit it, then a failed regenerate.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, reply: 'First draft.', grounding: 'brief' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'generation_failed',
          message: 'Failed to draft a reply',
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await render({ submissionId: 'sub_7', data: WITH_MESSAGE })
    await click(draftButton()!)

    const ta = textarea()!
    expect(ta.value).toBe('First draft.')

    // Founder edits the draft.
    await editTextarea(ta, 'My hand-edited reply the AI must not clobber.')
    expect(textarea()!.value).toBe('My hand-edited reply the AI must not clobber.')

    // Regenerate fails.
    const regen = Array.from(container.querySelectorAll('button')).find((b) =>
      /Regenerate/i.test(b.textContent ?? ''),
    )
    expect(regen).toBeDefined()
    await click(regen!)

    // Error surfaced, edits preserved (controlled value), still able to retry.
    expect(container.textContent).toContain('Failed to draft a reply')
    expect(textarea()!.value).toBe('My hand-edited reply the AI must not clobber.')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('resets to idle when a different lead is selected', async () => {
    mockFetch(200, { success: true, reply: 'Draft for lead one.', grounding: 'brief' })
    await render({ submissionId: 'sub_A', data: WITH_MESSAGE })
    await click(draftButton()!)
    expect(textarea()!.value).toBe('Draft for lead one.')

    // Select another lead — same component instance, new submissionId.
    await render({ submissionId: 'sub_B', data: WITH_MESSAGE })
    await flush(1)

    expect(textarea()).toBeNull()
    expect(draftButton()).toBeDefined()
    expect(draftButton()!.disabled).toBe(false)
  })
})
