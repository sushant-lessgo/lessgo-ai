// cms-collections phase 5 — DateField MUTATION contract (jsdom).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { DateField } from "./date-field"

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

function field() {
  const el = container.querySelector<HTMLInputElement>("input")
  if (!el) throw new Error("no date input")
  return el
}

function setValue(next: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!
    setter.call(field(), next)
    field().dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("DateField", () => {
  it("is a native date input (no bespoke calendar to keep in sync)", () => {
    act(() => root.render(<DateField value="" onValueChange={() => {}} />))
    expect(field().type).toBe("date")
  })

  it("editing emits the new ISO value", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<DateField value="" onValueChange={onValueChange} />))

    setValue("2026-07-20")

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith("2026-07-20")
  })

  it("clearing emits '' (the explicit clear — never an omission)", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<DateField value="2026-07-20" onValueChange={onValueChange} />))

    setValue("")

    expect(onValueChange).toHaveBeenCalledWith("")
  })

  it("renders the controlled value and reflects a new one", () => {
    act(() => root.render(<DateField value="2026-01-02" onValueChange={() => {}} />))
    expect(field().value).toBe("2026-01-02")

    act(() => root.render(<DateField value="2026-03-04" onValueChange={() => {}} />))
    expect(field().value).toBe("2026-03-04")
  })

  it("treats undefined value as empty (never uncontrolled)", () => {
    act(() => root.render(<DateField onValueChange={() => {}} />))
    expect(field().value).toBe("")
  })
})
