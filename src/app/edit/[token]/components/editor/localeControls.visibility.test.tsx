// locale-control VISIBILITY + real-store interaction (jsdom).
//
// language-settings phase 2 rewrote this file. It used to lock TWO header
// controls; there is only ONE now — the globe (`LocaleSettings`) was RETIRED and
// its job moved into Site settings → Languages (`ui/LanguagesPanel.tsx`), where
// a monolingual project can actually reach it. So this file locks:
//
//  1. `LanguageToggle` renders IFF the project is multi-locale
//     (isMultiLocale(localeConfig)) — unchanged contract, it is still the only
//     `setActiveLocale` UI;
//  2. clicking a pill drives the REAL store's `activeLocale` (store state +
//     aria-pressed are asserted, so a no-op setActiveLocale or a detached
//     handler fails — inert-assertion lesson: mutate the real thing);
//  3. the globe is GONE from the header cluster at every locale state — asserted
//     against the real `EditorDesignControls`, not against absence of an import,
//     so re-mounting any globe/"Languages" popover in the bar fails here.
//
// The store is REAL (`createEditStore`) — only the EditProvider plumbing is mocked
// (vi.mock re-points useEditStore/useEditStoreApi at the test instance via zustand
// useStore), so `setActiveLocale` is the genuine implementation and the pills
// re-render reactively. Repo convention: react-dom/client + act, no
// @testing-library (genuinely absent).

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
  // Real reactivity via zustand's own useStore — an action must actually
  // re-render the pills, or the aria-pressed / active-state assertions would be
  // vacuous.
  useEditStore: <T,>(selector: (s: EditStore) => T) => useStore(store, selector),
  useEditStoreApi: () => store,
}))

// `useReviewState` is only used by the OTHER cluster in EditHeader.tsx, but the
// module is imported at load time — stub it so this file needs no review plumbing.
vi.mock("@/hooks/useReviewState", () => ({
  useReviewState: () => ({ allComplete: true }),
}))

// Imported AFTER the mocks are registered (vi.mock is hoisted, but keep it explicit).
import { LanguageToggle } from "./LanguageToggle"
import { EditorDesignControls } from "../layout/EditHeader"

const BILINGUAL = { locales: ["en", "nl"], defaultLocale: "en" } as const
const SINGLE = { locales: ["en"], defaultLocale: "en" } as const

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  store = createEditStore(`locale-vis-${Math.random()}`)
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.innerHTML = ""
})

/** Point the store at a given localeConfig (or null) before mounting. */
function setConfig(config: unknown) {
  act(() => {
    store.setState((s: any) => {
      s.localeConfig = config
      s.activeLocale = (config as any)?.defaultLocale ?? "en"
      // writer/template-module ⇒ EditorDesignControls renders NO design popover,
      // so the globe assertions below are about the locale controls only and
      // this file doesn't drag in the theme-popover tree.
      s.audienceType = "writer"
      s.templateId = "granth"
    })
  })
}

function mount(node: React.ReactElement) {
  act(() => root.render(node))
}

function click(el: Element | null | undefined) {
  if (!el) throw new Error("expected element to exist")
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

/** The locale pills rendered by LanguageToggle (the group's buttons). */
function pills(): HTMLButtonElement[] {
  const group = container.querySelector('[role="group"][aria-label="Editing language"]')
  return group ? Array.from(group.querySelectorAll("button")) : []
}

describe("locale controls — visibility gate", () => {
  // (a) bilingual → the pill group renders.
  it("renders the locale pills when the project is multi-locale", () => {
    setConfig(BILINGUAL)
    mount(<LanguageToggle />)
    const labels = pills().map((b) => b.textContent?.trim())
    expect(labels).toEqual(["EN", "NL"])
  })

  // (b) single-locale AND null → renders null (empty container).
  it("renders NOTHING for a single-locale project (the toggle self-hides)", () => {
    setConfig(SINGLE)
    mount(<LanguageToggle />)
    expect(container.innerHTML).toBe("")
  })

  it("renders NOTHING when localeConfig is null (legacy project)", () => {
    setConfig(null)
    mount(<LanguageToggle />)
    expect(container.innerHTML).toBe("")
  })

  // (c) INTERACTION — real store mutation, not endpoint theatre.
  //
  // Clicking the NL pill must drive the REAL store's `activeLocale` to 'nl' AND
  // move `aria-pressed`. A detached/no-op handler (or a broken setActiveLocale)
  // leaves activeLocale at 'en' and the pressed state on EN — failing here.
  it("clicking the NL pill sets the real store activeLocale and moves aria-pressed", () => {
    setConfig(BILINGUAL)
    mount(<LanguageToggle />)

    // Before: EN active/pressed, NL not.
    expect(store.getState().activeLocale).toBe("en")
    let [en, nl] = pills()
    expect(en.getAttribute("aria-pressed")).toBe("true")
    expect(nl.getAttribute("aria-pressed")).toBe("false")

    click(nl)

    // After: the REAL store moved to 'nl' and the pills re-rendered pressed-state.
    expect(store.getState().activeLocale, "store activeLocale did not move to nl").toBe("nl")
    ;[en, nl] = pills()
    expect(en.getAttribute("aria-pressed")).toBe("false")
    expect(nl.getAttribute("aria-pressed")).toBe("true")
  })
})

describe("the header globe is retired", () => {
  // Mounted against the REAL left cluster, so this fails if anyone re-mounts a
  // languages popover in the bar — not merely if an import comes back.
  for (const [name, config] of [
    ["multi-locale", BILINGUAL],
    ["single-locale", SINGLE],
    ["legacy (null config)", null],
  ] as const) {
    it(`renders no globe / Languages popover trigger in the header (${name})`, () => {
      setConfig(config)
      mount(<EditorDesignControls />)

      expect(
        container.querySelector('button[title="Languages"]'),
        "the retired LocaleSettings globe is back in the header",
      ).toBeNull()
      expect(
        container.querySelector('[role="dialog"][aria-label="Languages"]'),
        "a Languages popover is back in the header",
      ).toBeNull()
      // The globe was the header's only `aria-haspopup="dialog"` trigger.
      expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()
      expect(container.textContent).not.toContain("Languages")
    })
  }

  it("still mounts the LanguageToggle pills in the header when multi-locale", () => {
    setConfig(BILINGUAL)
    mount(<EditorDesignControls />)
    expect(
      container.querySelector('[role="group"][aria-label="Editing language"]'),
      "LanguageToggle must SURVIVE the globe retirement — it is the only setActiveLocale UI",
    ).not.toBeNull()
  })
})
