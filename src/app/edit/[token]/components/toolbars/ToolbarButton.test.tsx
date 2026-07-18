// toolbar-standard-beta phase 3.5 — ToolbarButton's disabled contract (jsdom).
//
// WHY THIS EXISTS AT THE UNIT LEVEL (do not "fix" this by growing the e2e seed):
// phase 3.5's mutation (iv) — "remove the onClick disabled guard" — cannot be
// falsified by `e2e/toolbar-dispatch.spec.ts`, because every pre-existing disabled
// state is STRUCTURALLY UNREACHABLE in the e2e seed:
//   - `pageHelpers.ts:91-99` always seeds `sections = [header, ...body, footer]`, so
//     `sectionIndex === 0` is always the header and `length - 1` is always the
//     footer, and `CHROME_HIDDEN_ACTIONS` hides move-up/move-down on both. The
//     disabled move buttons therefore never render for a selectable section.
//   - the other real disables (regen-locale-lock, sparkle mid-generation) need
//     `localeConfig` / an in-flight generation the seed doesn't produce.
// No amount of e2e seeding reaches the guard as cheaply or as directly as mounting
// the primitive. This file pins the PRIMITIVE's contract instead.
//
// Follows the repo convention (no @testing-library/react): react-dom/client + act,
// driving real DOM events.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { ToolbarButton } from "./ToolbarButton"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function button() {
  const el = container.querySelector<HTMLButtonElement>('[data-action="regen"]')
  if (!el) throw new Error("ToolbarButton did not render a [data-action] element")
  return el
}

describe("ToolbarButton — disabled contract", () => {
  // (1) THE GUARD. This is phase 3.5 mutation (iv): delete the `if (disabled)`
  // early-return in handleClick and this MUST fail.
  it("does NOT call onClick when disabled", () => {
    const onClick = vi.fn()
    act(() =>
      root.render(
        <ToolbarButton
          data-action="regen"
          label="Regenerate"
          disabled
          disabledTitle="Locked while translating"
          onClick={onClick}
        />,
      ),
    )

    act(() => button().click())

    expect(onClick).not.toHaveBeenCalled()
  })

  // (2) THE ENABLED CONTROL. Without this, deleting handleClick's `onClick?.(e)`
  // entirely would still make (1) pass — a guard that never fires anything is
  // vacuously green.
  it("calls onClick exactly once when enabled", () => {
    const onClick = vi.fn()
    act(() =>
      root.render(
        <ToolbarButton data-action="regen" label="Regenerate" onClick={onClick} />,
      ),
    )

    act(() => button().click())

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // (3) The claim that goes with the guard.
  it("sets aria-disabled=true only when disabled", () => {
    act(() =>
      root.render(
        <ToolbarButton
          data-action="regen"
          label="Regenerate"
          disabled
          disabledTitle="Locked while translating"
        />,
      ),
    )
    expect(button().getAttribute("aria-disabled")).toBe("true")

    act(() => root.render(<ToolbarButton data-action="regen" label="Regenerate" />))
    const aria = button().getAttribute("aria-disabled")
    expect(aria === null || aria === "false").toBe(true)
  })

  // (4) Founder ruling 9: the "why" tooltip is the ENTIRE mitigation for shipping
  // greyed buttons (naayom C2 — dead buttons read as bugs). Pin it so a refactor
  // can't silently drop the reason.
  it("shows disabledTitle as the tooltip when disabled, and title when enabled", () => {
    act(() =>
      root.render(
        <ToolbarButton
          data-action="regen"
          label="Regenerate"
          title="Regenerate section"
          disabled
          disabledTitle="Locked while translating"
        />,
      ),
    )
    expect(button().getAttribute("title")).toBe("Locked while translating")

    act(() =>
      root.render(
        <ToolbarButton
          data-action="regen"
          label="Regenerate"
          title="Regenerate section"
          disabledTitle="Locked while translating"
        />,
      ),
    )
    expect(button().getAttribute("title")).toBe("Regenerate section")
  })

  // (5) THE POINT OF THE WHOLE aria-disabled PATTERN. A natively-disabled button
  // dispatches no mouse events, isn't focusable, and loses its tooltip — which
  // would silently break Design ▾ inertness reasoning AND (4) above. If someone
  // "helpfully" reinstates native `disabled`, this fails.
  it("is NOT natively disabled when disabled=true", () => {
    act(() =>
      root.render(
        <ToolbarButton
          data-action="regen"
          label="Regenerate"
          disabled
          disabledTitle="Locked while translating"
        />,
      ),
    )
    expect(button().disabled).toBe(false)
  })

  // (6) The e2e hook itself.
  it("renders data-action", () => {
    act(() => root.render(<ToolbarButton data-action="regen" label="Regenerate" />))
    expect(button().getAttribute("data-action")).toBe("regen")
  })

  // (7) The focus-retention mechanism: mousedown must be preventDefault'd when
  // disabled so a toolbar press can't blur the contenteditable.
  it("preventDefaults mousedown when disabled", () => {
    act(() =>
      root.render(
        <ToolbarButton
          data-action="regen"
          label="Regenerate"
          disabled
          disabledTitle="Locked while translating"
        />,
      ),
    )

    const evt = new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    act(() => {
      button().dispatchEvent(evt)
    })

    expect(evt.defaultPrevented).toBe(true)
  })

  it("does not preventDefault mousedown when enabled", () => {
    act(() => root.render(<ToolbarButton data-action="regen" label="Regenerate" />))

    const evt = new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    act(() => {
      button().dispatchEvent(evt)
    })

    expect(evt.defaultPrevented).toBe(false)
  })
})
