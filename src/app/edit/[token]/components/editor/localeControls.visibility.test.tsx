// bilingual-editing phase 2 — locale-control VISIBILITY + real-store interaction (jsdom).
//
// Locks the phase-1 re-mount: the two editor-chrome locale controls
// (LanguageToggle + LocaleSettings) must render IFF the project is multi-locale
// (isMultiLocale(localeConfig)), and clicking a locale pill must drive the REAL
// store's `activeLocale` — not merely fire a handler. The click case asserts
// store state + aria-pressed, so a no-op `setActiveLocale` or a detached handler
// fails it (inert-assertion lesson: mutate the real thing or it isn't a test).
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

// Imported AFTER the mock is registered (vi.mock is hoisted, but keep it explicit).
import { LanguageToggle } from "./LanguageToggle"
import { LocaleSettings } from "./LocaleSettings"

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
  // (a) bilingual → BOTH controls render.
  it("renders both locale pills AND the LocaleSettings globe when the project is multi-locale", () => {
    setConfig(BILINGUAL)
    mount(<LanguageToggle />)
    const labels = pills().map((b) => b.textContent?.trim())
    expect(labels).toEqual(["EN", "NL"])

    // Fresh subtree for LocaleSettings so the two mounts don't collide.
    act(() => root.render(<LocaleSettings />))
    const globe = container.querySelector('button[aria-haspopup="dialog"]')
    expect(globe, "LocaleSettings globe trigger should render when multi-locale").not.toBeNull()
    expect(globe!.getAttribute("title")).toBe("Languages")
  })

  // (b) single-locale AND null → BOTH render null (empty container).
  it("renders NOTHING for a single-locale project (both controls self-hide)", () => {
    setConfig(SINGLE)
    mount(
      <>
        <LanguageToggle />
        <LocaleSettings />
      </>,
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders NOTHING when localeConfig is null (legacy project)", () => {
    setConfig(null)
    mount(
      <>
        <LanguageToggle />
        <LocaleSettings />
      </>,
    )
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
