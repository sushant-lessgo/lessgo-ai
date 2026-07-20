// cms-collections phase 5 — SlugInput / EditableSlugInput MUTATION contract (jsdom).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { SlugInput, EditableSlugInput } from "./slug-input"

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

function typeInto(selector: string, next: string) {
  act(() => {
    const el = container.querySelector<HTMLInputElement>(selector)!
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!
    setter.call(el, next)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("SlugInput (t12 — read-only mono suffix inside the field)", () => {
  it("typing the name emits the new name", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(<SlugInput value="Book" onValueChange={onValueChange} slug="book" />),
    )

    typeInto("[data-slug-name]", "Books")

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith("Books")
  })

  it("renders the caller-derived slug as a mono suffix and updates with it", () => {
    act(() => root.render(<SlugInput value="Books" onValueChange={() => {}} slug="books" />))
    expect(container.querySelector("[data-slug-suffix]")!.textContent).toBe("/books")

    act(() =>
      root.render(
        <SlugInput value="Case studies" onValueChange={() => {}} slug="case-studies" />,
      ),
    )
    expect(container.querySelector("[data-slug-suffix]")!.textContent).toBe("/case-studies")
  })

  it("derives nothing itself — an empty slug renders no suffix", () => {
    // Guards against someone growing a second slugify here; src/modules/cms/slug.ts
    // is the one authority.
    act(() => root.render(<SlugInput value="Books" onValueChange={() => {}} slug="" />))
    expect(container.querySelector("[data-slug-suffix]")).toBeNull()
  })

  it("the suffix is not an input (t12 slug is derived, not typed)", () => {
    act(() => root.render(<SlugInput value="Books" onValueChange={() => {}} slug="books" />))
    expect(container.querySelectorAll("input")).toHaveLength(1)
  })
})

describe("EditableSlugInput (t19 permalink line)", () => {
  it("editing the segment emits the new segment only", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(
        <EditableSlugInput
          prefix="/books/"
          value="dune"
          onValueChange={onValueChange}
        />,
      ),
    )

    typeInto("[data-slug-segment]", "dune-messiah")

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith("dune-messiah")
  })

  it("the prefix is display-only", () => {
    act(() =>
      root.render(
        <EditableSlugInput prefix="/books/" value="dune" onValueChange={() => {}} />,
      ),
    )
    expect(container.querySelector("[data-slug-prefix]")!.textContent).toBe("/books/")
    expect(container.querySelectorAll("input")).toHaveLength(1)
    expect(container.querySelector<HTMLInputElement>("[data-slug-segment]")!.value).toBe(
      "dune",
    )
  })
})
