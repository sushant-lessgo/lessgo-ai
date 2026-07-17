// toolbar-standard-beta phase 4 — SocialItemsEditor's manage-items contract (jsdom).
//
// WHY AT THE UNIT LEVEL AS WELL AS e2e: the e2e case proves reorder through the real
// footer-toolbar entry point, but two invariants here are structurally unreachable
// from e2e at a sane cost:
//   - the CAP: `initializeSocialMedia` seeds maxItems: 8 (layoutActions.ts:1142), so
//     an e2e cap test would have to add EIGHT profiles through the UI one at a time.
//   - the FIRST/LAST move-button gating: only assertable by seeding a known order.
// Seeding the store directly reaches both in milliseconds.
//
// The store is REAL (`createEditStore`) — only the EditProvider plumbing is mocked,
// so `reorderSocialMediaItems`/`addSocialMediaItem`/`removeSocialMediaItem` are the
// genuine implementations (layoutActions.ts:1149-1245). A mocked store action would
// make these tests theatre: they would pin the mock, not the reorder.
//
// Repo convention (no @testing-library/react — genuinely absent): react-dom/client
// + act, driving real DOM events.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useStore } from "zustand"
import { createEditStore, type EditStoreInstance } from "@/stores/editStore"
import type { EditStore } from "@/types/store"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// The live store instance for the current test. Re-pointed in beforeEach so no
// state leaks between cases.
let store: EditStoreInstance

vi.mock("@/hooks/useEditStore", () => ({
  // Real reactivity via zustand's own useStore — an action must actually re-render
  // the list, or the "order changed in the DOM" assertions below would be vacuous.
  useEditStore: <T,>(selector: (s: EditStore) => T) => useStore(store, selector),
  useEditStoreApi: () => store,
}))

// Imported AFTER the mock is registered (vi.mock is hoisted, but keep it explicit).
import { SocialItemsEditor } from "./SocialItemsEditor"

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  store = createEditStore(`social-test-${Math.random()}`)
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  // The panel portals into document.body — clear any residue.
  document.body.innerHTML = ""
})

function mount(isVisible = true, onClose = () => {}) {
  act(() => root.render(<SocialItemsEditor isVisible={isVisible} onClose={onClose} />))
}

/** Seed N profiles through the REAL store action. */
function seed(platforms: string[]) {
  act(() => {
    store.getState().initializeSocialMedia()
    for (const p of platforms) {
      store.getState().addSocialMediaItem(p, `https://example.com/${p.toLowerCase()}`, "FaGlobe")
    }
  })
}

/** Platform names in the order the PANEL renders them (DOM order, not store order). */
function renderedOrder(): string[] {
  return Array.from(document.querySelectorAll('[data-testid="social-item-platform"]')).map(
    (el) => el.textContent?.trim() ?? "",
  )
}

/** Platform names in the order the STORE holds them. */
function storeOrder(): string[] {
  return (store.getState().socialMediaConfig?.items ?? []).map((i) => i.platform)
}

function click(el: Element | null | undefined) {
  if (!el) throw new Error("expected element to exist")
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

describe("SocialItemsEditor — manage items", () => {
  it("renders profiles in store order", () => {
    seed(["Twitter/X", "LinkedIn", "GitHub"])
    mount()
    expect(renderedOrder()).toEqual(["Twitter/X", "LinkedIn", "GitHub"])
  })

  // (1) THE REORDER INVARIANT — the phase's headline claim.
  //
  // MUTATION-PROVEN: assert the FULL ordered list, not "index 0 changed". An
  // endpoint-only assertion (e.g. only checking the moved item) can sit green while
  // the rest of the list silently permutes — and `reorderSocialMediaItems` rewrites
  // EVERY item's `order` field, so the whole list is the invariant. Breaking the
  // adjacent swap (e.g. `moveItem` becoming a no-op, or reordering with the wrong
  // delta) fails this on the exact ordering, in BOTH the DOM and the store.
  it("move-down swaps a profile with its successor (DOM + store agree)", () => {
    seed(["Twitter/X", "LinkedIn", "GitHub"])
    mount()
    expect(renderedOrder()).toEqual(["Twitter/X", "LinkedIn", "GitHub"])

    // The first row's move-down → Twitter/X and LinkedIn swap.
    const firstRow = document.querySelectorAll('[data-testid="social-item"]')[0]
    click(firstRow.querySelector('[data-testid="social-move-down"]'))

    expect(renderedOrder(), "the panel did not re-render the new order").toEqual([
      "LinkedIn",
      "Twitter/X",
      "GitHub",
    ])
    expect(storeOrder(), "the store did not persist the new order").toEqual([
      "LinkedIn",
      "Twitter/X",
      "GitHub",
    ])
    // `order` is what the config actually serialises — it must be re-indexed, not
    // left stale. A swap that moves array positions but leaves `order` untouched
    // would pass both assertions above and still be broken on reload.
    expect(store.getState().socialMediaConfig?.items.map((i) => i.order)).toEqual([0, 1, 2])
  })

  it("move-up swaps a profile with its predecessor", () => {
    seed(["Twitter/X", "LinkedIn", "GitHub"])
    mount()
    const lastRow = document.querySelectorAll('[data-testid="social-item"]')[2]
    click(lastRow.querySelector('[data-testid="social-move-up"]'))

    expect(renderedOrder()).toEqual(["Twitter/X", "GitHub", "LinkedIn"])
    expect(storeOrder()).toEqual(["Twitter/X", "GitHub", "LinkedIn"])
  })

  // (2) BOUNDARY GATING. The first row has no move-up and the last no move-down —
  // ported behaviour. If both always rendered, an out-of-range swap would be one
  // click away (guarded in `moveItem`, but the control should not exist at all).
  it("omits move-up on the first row and move-down on the last", () => {
    seed(["Twitter/X", "LinkedIn", "GitHub"])
    mount()
    const rows = document.querySelectorAll('[data-testid="social-item"]')

    expect(rows[0].querySelector('[data-testid="social-move-up"]')).toBeNull()
    expect(rows[0].querySelector('[data-testid="social-move-down"]')).not.toBeNull()
    expect(rows[2].querySelector('[data-testid="social-move-up"]')).not.toBeNull()
    expect(rows[2].querySelector('[data-testid="social-move-down"]')).toBeNull()
  })

  // (3) THE CAP. maxItems = 8 (layoutActions.ts:1142). Below the cap the "+ Add"
  // affordance is offered; AT the cap it is gone and the reason is shown.
  // Mutation: drop the `!atCap` guard and the second half fails.
  it("offers + Add below the cap and withdraws it at the cap", () => {
    seed(["A", "B", "C", "D", "E", "F", "G"]) // 7 of 8
    mount()
    expect(document.querySelector('[data-testid="social-add"]'), "+ Add missing below the cap").not.toBeNull()
    expect(document.querySelector('[data-testid="social-cap-notice"]')).toBeNull()

    act(() => {
      store.getState().addSocialMediaItem("H", "https://example.com/h", "FaGlobe")
    })

    expect(storeOrder().length).toBe(8)
    expect(
      document.querySelector('[data-testid="social-add"]'),
      "+ Add is still offered at the cap — adding would be rejected by the store",
    ).toBeNull()
    expect(document.querySelector('[data-testid="social-cap-notice"]')).not.toBeNull()
  })

  // The store itself enforces the cap (layoutActions.ts:1161). Pinned because the
  // panel's `atCap` is only a UI courtesy — this is the real gate.
  it("the store refuses a 9th profile", () => {
    seed(["A", "B", "C", "D", "E", "F", "G", "H"])
    act(() => {
      store.getState().addSocialMediaItem("I", "https://example.com/i", "FaGlobe")
    })
    expect(storeOrder()).toHaveLength(8)
    expect(storeOrder()).not.toContain("I")
  })

  it("remove drops the profile from the list", () => {
    seed(["Twitter/X", "LinkedIn"])
    mount()
    const firstRow = document.querySelectorAll('[data-testid="social-item"]')[0]
    click(firstRow.querySelector('[data-testid="social-remove"]'))

    expect(renderedOrder()).toEqual(["LinkedIn"])
    expect(storeOrder()).toEqual(["LinkedIn"])
  })

  // The prop-contract seam GlobalModals.tsx:95 depends on (via SocialProfilesPanel).
  // GlobalModals is NOT in phase 4's files-touched, so `isVisible` must keep working
  // exactly as before or the panel renders over the editor permanently.
  it("renders nothing when isVisible is false", () => {
    seed(["Twitter/X"])
    mount(false)
    expect(document.querySelector('[data-testid="social-items-editor"]')).toBeNull()
  })

  it("initialises the config lazily on first open", () => {
    expect(store.getState().socialMediaConfig).toBeUndefined()
    mount()
    expect(store.getState().socialMediaConfig).toBeDefined()
    expect(store.getState().socialMediaConfig?.maxItems).toBe(8)
  })
})
