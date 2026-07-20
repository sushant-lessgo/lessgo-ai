// cms-collections phase 5 — ItemPager MUTATION contract (jsdom).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { ItemPager } from "./item-pager"

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

const prev = () => container.querySelector<HTMLButtonElement>("[data-pager-prev]")!
const next = () => container.querySelector<HTMLButtonElement>("[data-pager-next]")!
const label = () => container.querySelector("[data-pager-label]")!.textContent

describe("ItemPager — emits the right index", () => {
  it("next emits index+1, prev emits index-1 (absolute, zero-based)", () => {
    const onIndexChange = vi.fn()
    act(() => root.render(<ItemPager index={2} total={24} onIndexChange={onIndexChange} />))

    act(() => next().click())
    expect(onIndexChange).toHaveBeenLastCalledWith(3)

    act(() => prev().click())
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    expect(onIndexChange).toHaveBeenCalledTimes(2)
  })

  it("renders the one-based label", () => {
    act(() => root.render(<ItemPager index={2} total={24} onIndexChange={() => {}} />))
    expect(label()).toBe("Item 3 of 24")
  })

  it("arrow keys move as well", () => {
    const onIndexChange = vi.fn()
    act(() => root.render(<ItemPager index={5} total={10} onIndexChange={onIndexChange} />))

    act(() =>
      void container
        .querySelector('[role="group"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
    )
    expect(onIndexChange).toHaveBeenLastCalledWith(6)

    act(() =>
      void container
        .querySelector('[role="group"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })),
    )
    expect(onIndexChange).toHaveBeenLastCalledWith(4)
  })
})

describe("ItemPager — bounds", () => {
  it("prev is disabled at the first item, next at the last", () => {
    act(() => root.render(<ItemPager index={0} total={3} onIndexChange={() => {}} />))
    expect(prev().disabled).toBe(true)
    expect(next().disabled).toBe(false)

    act(() => root.render(<ItemPager index={2} total={3} onIndexChange={() => {}} />))
    expect(prev().disabled).toBe(false)
    expect(next().disabled).toBe(true)
  })

  it("does not emit past the bounds even if a click is forced through", () => {
    // The handler guards independently of the `disabled` attribute — a disabled
    // button that still fired would navigate the item editor to index -1.
    const onIndexChange = vi.fn()
    act(() => root.render(<ItemPager index={0} total={3} onIndexChange={onIndexChange} />))

    act(() => prev().click())
    act(() =>
      void container
        .querySelector('[role="group"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })),
    )

    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it("both ends disabled and an empty label when there are no items", () => {
    const onIndexChange = vi.fn()
    act(() => root.render(<ItemPager index={0} total={0} onIndexChange={onIndexChange} />))
    expect(prev().disabled).toBe(true)
    expect(next().disabled).toBe(true)
    expect(label()).toBe("No items")

    act(() => next().click())
    expect(onIndexChange).not.toHaveBeenCalled()
  })
})
