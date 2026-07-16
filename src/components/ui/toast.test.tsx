// ui-foundation Phase 5 — Toast enqueue / auto-dismiss / variant (jsdom).
// react-dom/client + React.act harness (no @testing-library/react in repo).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { ToastProvider, useToast, type ToastOptions } from "./toast"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

let container: HTMLDivElement
let root: Root
let trigger: (message: string, options?: ToastOptions) => string

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

function Trigger() {
  const { toast } = useToast()
  trigger = toast
  return null
}

function mount() {
  act(() =>
    root.render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    )
  )
}

// Toasts portal into document.body, not `container`.
function toastCards() {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-variant]"))
}

describe("Toast", () => {
  it("enqueues and renders a toast with its message", () => {
    mount()
    act(() => {
      trigger("Saved changes")
    })
    const cards = toastCards()
    expect(cards).toHaveLength(1)
    expect(cards[0].textContent).toContain("Saved changes")
  })

  it("applies variant data + icon (success vs error)", () => {
    mount()
    act(() => {
      trigger("Done", { variant: "success" })
      trigger("Nope", { variant: "error" })
    })
    const cards = toastCards()
    expect(cards).toHaveLength(2)
    expect(cards[0].getAttribute("data-variant")).toBe("success")
    expect(cards[1].getAttribute("data-variant")).toBe("error")
    // success chip carries the app-success token class; error carries app-danger
    expect(cards[0].querySelector(".text-app-success")).toBeTruthy()
    expect(cards[1].querySelector(".text-app-danger")).toBeTruthy()
    // AppIcon ligature text differs per variant
    expect(cards[0].textContent).toContain("check_circle")
    expect(cards[1].textContent).toContain("error")
  })

  it("auto-dismisses after the duration", () => {
    vi.useFakeTimers()
    mount()
    act(() => {
      trigger("Temporary", { duration: 1000 })
    })
    expect(toastCards()).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(toastCards()).toHaveLength(0)
  })

  it("does not auto-dismiss when duration is 0", () => {
    vi.useFakeTimers()
    mount()
    act(() => {
      trigger("Sticky", { duration: 0 })
    })
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    expect(toastCards()).toHaveLength(1)
  })

  it("dismiss button removes the toast", () => {
    mount()
    act(() => {
      trigger("Bye", { duration: 0 })
    })
    const closeBtn = toastCards()[0].querySelector<HTMLButtonElement>(
      'button[aria-label="Dismiss"]'
    )
    expect(closeBtn).toBeTruthy()
    act(() => closeBtn!.click())
    expect(toastCards()).toHaveLength(0)
  })
})
