// ============================================================================
// CmsBoardClient — the generic CMS board host (cms-collections plan phase 9).
//
// Pins:
//   1. Load: GET /api/collections → collection rows; select → GET the bundle.
//   2. THE WRITE FUNNEL: an item edit PATCHes `/api/collections/{cid}/items/{iid}`
//      with `{tokenId, values}` — the collections API, nothing else.
//   3. The empty→null caller contract: clearing a STORED field sends explicit
//      `null` (the API's delete sentinel); a never-filled field is omitted.
//   4. 🚨 MANDATORY REGRESSION — a board mounted for a project WITH a works
//      library performs ZERO calls to `/api/work-library` and never mutates works
//      content. Asserted as the ABSENCE of such calls across the whole flow
//      (load → select → open → edit → save), not merely as the presence of the
//      right ones. The works catalog is authoritative and rides a different
//      pipeline (`applyRailEdit`/`resyncWorkContent`); a generic board that wrote
//      through it would corrupt a live customer's catalog.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo),
// mirroring WorkLibraryClient.test.tsx / ItemEditor.test.tsx.
// ============================================================================

import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import CmsBoardClient from './CmsBoardClient'
import type { CmsCollection, CmsGroup, CmsItem } from '@/modules/cms/types'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

let container: HTMLDivElement
let root: Root

interface Call {
  url: string
  method: string
  body: any
}
let calls: Call[]

const COLLECTION: CmsCollection = {
  id: 'col_1',
  projectId: 'proj_1',
  tokenId: 'tok_1',
  name: 'Projects',
  slug: 'projects',
  fieldSchema: [
    { id: 'title', name: 'Title', type: 'text_short' },
    { id: 'blurb', name: 'Blurb', type: 'text_long' },
    { id: 'cover', name: 'Cover', type: 'image' },
    { id: 'topics', name: 'Topics', type: 'tags' },
  ],
  roles: { title: 'title', cover: 'cover' },
  detailPages: true,
  layoutHint: null,
  order: 0,
}

const GROUPS: CmsGroup[] = [
  { id: 'grp_1', collectionId: 'col_1', name: 'Weddings', order: 0 },
  { id: 'grp_2', collectionId: 'col_1', name: 'Portraits', order: 1 },
]

const ITEMS: CmsItem[] = [
  {
    id: 'item_1',
    collectionId: 'col_1',
    groupId: 'grp_1',
    slug: 'oak-house',
    // `blurb` IS stored → clearing it must send an explicit null.
    values: { title: 'Oak House', blurb: 'A barn conversion.' },
    order: 0,
    slugLocked: false,
  },
  {
    id: 'item_2',
    collectionId: 'col_1',
    groupId: 'grp_2',
    slug: 'river-mill',
    values: { title: 'River Mill' },
    order: 1,
    slugLocked: false,
  },
]

/** Stub fetch for the collections API. Records EVERY call, whatever the URL. */
function stubFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    calls.push({ url, method, body })

    if (method === 'PATCH') {
      // Echo a plausible server item so the host can adopt it.
      const merged = { ...ITEMS[0], values: { ...ITEMS[0].values, ...(body?.values ?? {}) } }
      return { ok: true, status: 200, json: async () => ({ item: merged }) } as unknown as Response
    }
    if (url.startsWith('/api/collections?')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ collections: [COLLECTION] }),
      } as unknown as Response
    }
    if (url.startsWith('/api/collections/col_1?')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ collection: COLLECTION, groups: GROUPS, items: ITEMS }),
      } as unknown as Response
    }
    return { ok: false, status: 404, json: async () => ({ error: 'nope' }) } as unknown as Response
  })
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)
  return fetchMock
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

function q<T extends Element = HTMLElement>(sel: string): T | null {
  return container.querySelector<T>(sel)
}
function must<T extends Element = HTMLElement>(sel: string): T {
  const el = q<T>(sel)
  if (!el) throw new Error(`not found: ${sel}`)
  return el
}
async function click(sel: string) {
  await act(async () => {
    ;(must(sel) as HTMLElement).click()
  })
  await flush()
}
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function mount(props: { hasWorkLibrary?: boolean } = {}) {
  await act(async () => {
    root.render(<CmsBoardClient tokenId="tok_1" hasWorkLibrary {...props} />)
  })
  await flush()
}

/** Walk to an open item editor on item_1 — the state every write test needs. */
async function openFirstItem() {
  await mount()
  await click('[data-collection-row="col_1"]')
  await click('[data-item-row="item_1"]')
  expect(q('[data-testid="cms-item-editor"]')).not.toBeNull()
}

const patchCalls = () => calls.filter((c) => c.method === 'PATCH')
const workLibraryCalls = () => calls.filter((c) => c.url.includes('/api/work-library'))

beforeEach(() => {
  calls = []
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  stubFetch()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('CmsBoardClient — load', () => {
  it('lists collections from GET /api/collections', async () => {
    await mount()
    expect(q('[data-collection-row="col_1"]')?.textContent).toContain('Projects')
    expect(calls[0].url).toContain('/api/collections?tokenId=tok_1')
  })

  it('loads the bundle and renders items when a collection is picked', async () => {
    await mount()
    await click('[data-collection-row="col_1"]')
    expect(q('[data-item-row="item_1"]')?.textContent).toContain('Oak House')
    expect(q('[data-item-row="item_2"]')?.textContent).toContain('River Mill')
    expect(calls.some((c) => c.url.startsWith('/api/collections/col_1?'))).toBe(true)
  })

  it('filters items by group', async () => {
    await mount()
    await click('[data-collection-row="col_1"]')
    const select = must<HTMLSelectElement>('[data-testid="cms-group-filter"]')
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value'
      )!.set!
      setter.call(select, 'grp_2')
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flush()
    expect(q('[data-item-row="item_1"]')).toBeNull()
    expect(q('[data-item-row="item_2"]')).not.toBeNull()
  })

  it('shows the works-library deep link, and it only navigates', async () => {
    await mount()
    const link = must<HTMLAnchorElement>('[data-testid="cms-works-link"]')
    expect(link.getAttribute('href')).toBe('/dashboard/tok_1/work')
    // `works` itself is NOT listed as a collection in this board (v1 ruling).
    expect(q('[data-testid="cms-collection-list"]')?.textContent).not.toContain('Works library')
  })

  it('omits the works row when the project has no works library', async () => {
    await mount({ hasWorkLibrary: false })
    expect(q('[data-testid="cms-works-link"]')).toBeNull()
  })
})

describe('CmsBoardClient — the write funnel', () => {
  it('PATCHes the collections item API with tokenId + values', async () => {
    await openFirstItem()
    setNativeValue(must<HTMLInputElement>('[data-field="title"]'), 'Oak House II')
    await click('[data-testid="cms-item-save"]')

    const patches = patchCalls()
    expect(patches).toHaveLength(1)
    expect(patches[0].url).toBe('/api/collections/col_1/items/item_1')
    expect(patches[0].body.tokenId).toBe('tok_1')
    expect(patches[0].body.values.title).toBe('Oak House II')
  })

  it('sends explicit null for a CLEARED stored field (the delete sentinel)', async () => {
    await openFirstItem()
    setNativeValue(must<HTMLTextAreaElement>('[data-field="blurb"]'), '   ')
    await click('[data-testid="cms-item-save"]')

    const body = patchCalls()[0].body
    expect(Object.prototype.hasOwnProperty.call(body.values, 'blurb')).toBe(true)
    expect(body.values.blurb).toBeNull()
  })

  it('omits a never-filled field rather than nulling it', async () => {
    await mount()
    await click('[data-collection-row="col_1"]')
    await click('[data-item-row="item_2"]') // item_2 has no stored `blurb`
    await click('[data-testid="cms-item-save"]')

    const body = patchCalls()[0].body
    expect(Object.prototype.hasOwnProperty.call(body.values, 'blurb')).toBe(false)
  })

  it('never sends media values (read-only here) and says why', async () => {
    await openFirstItem()
    const media = must('[data-field="cover"]')
    expect(media.getAttribute('data-readonly')).toBe('media')
    expect(media.getAttribute('title')).toContain('media picker')
    await click('[data-testid="cms-item-save"]')
    expect(Object.prototype.hasOwnProperty.call(patchCalls()[0].body.values, 'cover')).toBe(false)
  })

  it('routes a group change through the same funnel', async () => {
    await openFirstItem()
    const select = must<HTMLSelectElement>('[data-testid="cms-item-group"]')
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value'
      )!.set!
      setter.call(select, 'grp_2')
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await flush()
    const patches = patchCalls()
    expect(patches).toHaveLength(1)
    expect(patches[0].url).toBe('/api/collections/col_1/items/item_1')
    expect(patches[0].body.groupId).toBe('grp_2')
  })
})

describe('CmsBoardClient — 🚨 works isolation (mandatory regression)', () => {
  it('performs ZERO /api/work-library calls across the whole flow', async () => {
    // hasWorkLibrary=true → this project HAS a works catalog, the corruption case.
    await openFirstItem()
    setNativeValue(must<HTMLInputElement>('[data-field="title"]'), 'Oak House II')
    await click('[data-testid="cms-item-save"]')

    // Anti-vacuity: the flow really did talk to the server…
    expect(calls.length).toBeGreaterThan(2)
    expect(patchCalls().length).toBeGreaterThan(0)
    // …and every single request went to the collections API.
    expect(workLibraryCalls()).toEqual([])
    for (const c of calls) {
      expect(c.url.startsWith('/api/collections')).toBe(true)
    }
  })

  it('never issues a non-collections write of any kind', async () => {
    await openFirstItem()
    setNativeValue(must<HTMLInputElement>('[data-field="title"]'), 'X')
    await click('[data-testid="cms-item-save"]')

    const writes = calls.filter((c) => c.method !== 'GET')
    expect(writes.length).toBeGreaterThan(0)
    for (const w of writes) {
      expect(w.url).toMatch(/^\/api\/collections\//)
      // No works-shaped payload can reach a works route from here.
      expect(w.body).not.toHaveProperty('groups')
    }
  })

  it('the source imports neither the works API nor the edit store', async () => {
    // Structural companion to the call-count assertions: those only see what a
    // MOUNT does, so a lazily-triggered works write (or an edit-store import,
    // which is the phase's other hard rule) could hide from them. This reads the
    // module text and bites on the import itself.
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const src = readFileSync(
      join(process.cwd(), 'src/components/dashboard/cms/CmsBoardClient.tsx'),
      'utf8'
    )
    const imports = src
      .split('\n')
      .filter((l) => /^\s*import\s|from '(.*)'/.test(l) && l.includes("from '"))
      .join('\n')
    expect(imports).not.toContain('work-library')
    expect(imports).not.toContain('hooks/editStore')
    expect(imports).not.toContain('useEditStore')
    // …and no runtime fetch string for the works route anywhere in the file.
    expect(src.replace(/\/api\/work-library`? → `applyRailEdit`/g, '')).not.toMatch(
      /fetch\([^)]*work-library/
    )
  })

  it('the shared values module it imports is itself store-free (one hop deeper)', async () => {
    // The guard above only reads THIS file's imports, so a clean-looking import of
    // a dirty module would slip past it. `@/modules/cms/values` is the one module
    // this board shares with the edit-store-bound `ItemEditor`, which makes it the
    // obvious back door — so follow that hop explicitly.
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const src = readFileSync(join(process.cwd(), 'src/modules/cms/values.ts'), 'utf8')

    const importLines = src.split('\n').filter((l) => /^\s*import\s/.test(l))
    // Anti-vacuity: the file really does have imports to inspect.
    expect(importLines.length).toBeGreaterThan(0)
    // Type-only imports are erased at runtime, so nothing can be reached through
    // them. Every import in that module must be one.
    for (const line of importLines) {
      expect(line).toMatch(/^\s*import\s+type\s/)
    }
    // Bite on module SPECIFIERS, not prose: that module's docblock names
    // `src/hooks/editStore/**` deliberately, to record why it is banned there.
    const specifiers = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
    expect(specifiers.length).toBeGreaterThan(0)
    for (const s of specifiers) {
      expect(s).not.toContain('editStore')
      expect(s).not.toContain('useEditStore')
      expect(s).not.toContain('work-library')
    }
  })
})
