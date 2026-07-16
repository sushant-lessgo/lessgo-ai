// ui-foundation Phase 5 — SegmentedControl interactive behavior (jsdom).
// No @testing-library/react in the repo, so we drive a real DOM via
// react-dom/client + React.act and dispatch native events.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach } from "vitest"

import { SegmentedControl } from "./segmented-control"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

const OPTIONS = [
  { value: "url", label: "URL" },
  { value: "page", label: "Page" },
  { value: "email", label: "Email" },
]

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

function radios() {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]'))
}

function Harness({ initial = "url" }: { initial?: string }) {
  const [value, setValue] = React.useState(initial)
  return (
    <>
      <SegmentedControl
        aria-label="Link type"
        value={value}
        onValueChange={setValue}
        options={OPTIONS}
      />
      <output data-testid="value">{value}</output>
    </>
  )
}

describe("SegmentedControl", () => {
  it("renders a radiogroup with a radio per option and marks the value checked", () => {
    act(() => root.render(<Harness />))
    expect(container.querySelector('[role="radiogroup"]')).toBeTruthy()
    const r = radios()
    expect(r).toHaveLength(3)
    expect(r[0].getAttribute("aria-checked")).toBe("true")
    expect(r[1].getAttribute("aria-checked")).toBe("false")
    // roving tabindex: only the selected radio is tabbable
    expect(r[0].tabIndex).toBe(0)
    expect(r[1].tabIndex).toBe(-1)
  })

  it("changes value on click", () => {
    act(() => root.render(<Harness />))
    act(() => radios()[2].click())
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("email")
    expect(radios()[2].getAttribute("aria-checked")).toBe("true")
  })

  it("moves selection with ArrowRight / ArrowLeft and wraps", () => {
    act(() => root.render(<Harness />))
    const fire = (key: string) =>
      act(() => {
        const el = document.activeElement ?? radios()[0]
        el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
      })
    radios()[0].focus()
    fire("ArrowRight")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("page")
    fire("ArrowRight")
    fire("ArrowRight") // wrap 2 -> 0
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("url")
    fire("ArrowLeft") // wrap 0 -> 2
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("email")
  })

  it("Home/End jump to first/last", () => {
    act(() => root.render(<Harness initial="page" />))
    const fire = (key: string) =>
      act(() => {
        const el = document.activeElement ?? radios()[1]
        el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
      })
    radios()[1].focus()
    fire("End")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("email")
    fire("Home")
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe("url")
  })
})
