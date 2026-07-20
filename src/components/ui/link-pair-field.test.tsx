// cms-collections phase 5 — LinkPairField MUTATION contract (jsdom).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { LinkPairField } from "./link-pair-field"

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

function part(selector: string) {
  const el = container.querySelector<HTMLInputElement>(selector)
  if (!el) throw new Error(`no ${selector}`)
  return el
}

function typeInto(selector: string, next: string) {
  act(() => {
    const el = part(selector)
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!
    setter.call(el, next)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

const VALUE = { url: "https://old.example", label: "Old" }

describe("LinkPairField", () => {
  it("editing the URL emits the WHOLE pair with only url changed", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<LinkPairField value={VALUE} onValueChange={onValueChange} />))

    typeInto("[data-link-url]", "https://new.example")

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith({
      url: "https://new.example",
      label: "Old",
    })
  })

  it("editing the label emits the WHOLE pair with only label changed", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<LinkPairField value={VALUE} onValueChange={onValueChange} />))

    typeInto("[data-link-label]", "Buy now")

    expect(onValueChange).toHaveBeenCalledWith({
      url: "https://old.example",
      label: "Buy now",
    })
  })

  it("renders both halves of the controlled value", () => {
    act(() => root.render(<LinkPairField value={VALUE} onValueChange={() => {}} />))
    expect(part("[data-link-url]").value).toBe("https://old.example")
    expect(part("[data-link-label]").value).toBe("Old")
  })

  it("does NOT validate or rewrite the URL (mailto:/tel:/# must survive to toRenderModel)", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(
        <LinkPairField value={{ url: "", label: "" }} onValueChange={onValueChange} />,
      ),
    )

    typeInto("[data-link-url]", "mailto:hi@example.com")

    expect(onValueChange).toHaveBeenCalledWith({
      url: "mailto:hi@example.com",
      label: "",
    })
  })
})
