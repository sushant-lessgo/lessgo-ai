// cms-collections phase 8B — KeyValueField MUTATION contract (jsdom).
//
// Mirrors link-pair-field.test.tsx: the pair control's ONE job is to emit the
// WHOLE `{key, value}` object with exactly one half changed. Emitting a partial
// object would silently wipe the other half of a stored spec on every keystroke.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { KeyValueField } from "./key-value-field"

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

const VALUE = { key: "Weight", value: "4.2 kg" }

describe("KeyValueField", () => {
  it("editing the spec name emits the WHOLE pair with only `key` changed", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<KeyValueField value={VALUE} onValueChange={onValueChange} />))

    typeInto("[data-stat-key]", "Mass")

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith({ key: "Mass", value: "4.2 kg" })
  })

  it("editing the value emits the WHOLE pair with only `value` changed", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<KeyValueField value={VALUE} onValueChange={onValueChange} />))

    typeInto("[data-stat-value]", "5 kg")

    expect(onValueChange).toHaveBeenCalledWith({ key: "Weight", value: "5 kg" })
  })

  it("renders both halves of the controlled value", () => {
    act(() => root.render(<KeyValueField value={VALUE} onValueChange={() => {}} />))
    expect(part("[data-stat-key]").value).toBe("Weight")
    expect(part("[data-stat-value]").value).toBe("4.2 kg")
  })

  // The property NAMES are a publish-correctness contract, not styling: a key
  // ending in href/url/link/slug is rewritten to '#' by `sanitizeContentHtml`.
  // If someone renames these to `label`/`linkValue`/etc, this bites here first.
  it("emits exactly the two stored property names, `key` and `value`", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(<KeyValueField value={{ key: "", value: "" }} onValueChange={onValueChange} />),
    )

    typeInto("[data-stat-key]", "Range")

    expect(Object.keys(onValueChange.mock.calls[0][0]).sort()).toEqual(["key", "value"])
  })
})
