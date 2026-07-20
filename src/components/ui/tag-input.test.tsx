// cms-collections phase 5 — TagInput MUTATION contract (jsdom).
// react-dom/client + React.act, real DOM events (no @testing-library/react).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { TagInput } from "./tag-input"

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

function draftInput() {
  const el = container.querySelector<HTMLInputElement>("[data-tag-draft]")
  if (!el) throw new Error("no draft input")
  return el
}

function type(text: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!
    setter.call(draftInput(), text)
    draftInput().dispatchEvent(new Event("input", { bubbles: true }))
  })
}

function press(key: string) {
  act(() => {
    draftInput().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  })
}

function pills() {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-tag]")).map(
    (el) => el.dataset.tag,
  )
}

describe("TagInput — add", () => {
  it("Enter adds a pill and calls back with the NEW array", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={["fiction"]} onValueChange={onValueChange} />))

    type("poetry")
    press("Enter")

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(["fiction", "poetry"])
  })

  it("comma also commits", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={[]} onValueChange={onValueChange} />))
    type("essays")
    press(",")
    expect(onValueChange).toHaveBeenCalledWith(["essays"])
  })

  it("renders one pill per value and shows the added tag after a controlled round-trip", () => {
    function Harness() {
      const [tags, setTags] = React.useState<string[]>([])
      return <TagInput value={tags} onValueChange={setTags} />
    }
    act(() => root.render(<Harness />))
    expect(pills()).toEqual([])

    type("fiction")
    press("Enter")
    expect(pills()).toEqual(["fiction"])

    type("poetry")
    press("Enter")
    expect(pills()).toEqual(["fiction", "poetry"])
  })

  it("ignores blank/whitespace and duplicates (a tag list is a set)", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={["fiction"]} onValueChange={onValueChange} />))

    type("   ")
    press("Enter")
    type("fiction")
    press("Enter")

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("trims the committed tag", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={[]} onValueChange={onValueChange} />))
    type("  poetry  ")
    press("Enter")
    expect(onValueChange).toHaveBeenCalledWith(["poetry"])
  })

  it("blur commits an uncommitted draft (type a tag, then click Save)", () => {
    // The Save-ordering hazard: a leftover draft that vanishes on blur is the
    // classic "my last tag didn't save" bug.
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={["fiction"]} onValueChange={onValueChange} />))

    type("poetry")
    // React 17+ delegates onBlur to the native `focusout` (a `blur` event does
    // not reach it) — dispatching `blur` here would sit green forever.
    act(() => draftInput().dispatchEvent(new FocusEvent("focusout", { bubbles: true })))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(["fiction", "poetry"])
  })

  it("blur with an empty draft does NOT mutate the value", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={["fiction"]} onValueChange={onValueChange} />))

    // React 17+ delegates onBlur to the native `focusout` (a `blur` event does
    // not reach it) — dispatching `blur` here would sit green forever.
    act(() => draftInput().dispatchEvent(new FocusEvent("focusout", { bubbles: true })))

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("Escape clears the draft WITHOUT mutating the value", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<TagInput value={["fiction"]} onValueChange={onValueChange} />))
    type("poetry")
    press("Escape")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(draftInput().value).toBe("")
  })
})

describe("TagInput — remove", () => {
  it("✕ removes the RIGHT pill", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(
        <TagInput value={["fiction", "poetry", "essays"]} onValueChange={onValueChange} />,
      ),
    )

    act(() =>
      container.querySelector<HTMLButtonElement>('[data-tag-remove="poetry"]')!.click(),
    )

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(["fiction", "essays"])
  })

  it("Backspace on an empty draft removes the LAST pill only", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(<TagInput value={["fiction", "poetry"]} onValueChange={onValueChange} />),
    )

    press("Backspace")
    expect(onValueChange).toHaveBeenCalledWith(["fiction"])
  })

  it("Backspace with a non-empty draft does NOT remove a pill", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(<TagInput value={["fiction", "poetry"]} onValueChange={onValueChange} />),
    )

    type("es")
    press("Backspace")
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
