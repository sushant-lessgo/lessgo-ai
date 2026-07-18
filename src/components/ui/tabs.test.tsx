// ui-foundation Phase 5 — Tabs interactive behavior (jsdom).
// react-dom/client + React.act harness (no @testing-library/react in repo).

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

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

function tabs() {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
}
function panels() {
  return Array.from(container.querySelectorAll<HTMLDivElement>('[role="tabpanel"]'))
}

function Fixture(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs {...props}>
      <TabsList>
        <TabsTrigger value="stock">Stock</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="url">URL</TabsTrigger>
      </TabsList>
      <TabsContent value="stock">stock-panel</TabsContent>
      <TabsContent value="upload">upload-panel</TabsContent>
      <TabsContent value="url">url-panel</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("wires roles, aria-selected, aria-controls and panel visibility (uncontrolled)", () => {
    act(() => root.render(<Fixture defaultValue="stock" />))
    const t = tabs()
    expect(t).toHaveLength(3)
    expect(container.querySelector('[role="tablist"]')).toBeTruthy()
    expect(t[0].getAttribute("aria-selected")).toBe("true")
    expect(t[1].getAttribute("aria-selected")).toBe("false")
    // aria-controls links to the panel id
    const controlled = t[0].getAttribute("aria-controls")!
    const panel = document.getElementById(controlled)
    expect(panel?.getAttribute("role")).toBe("tabpanel")
    // only active panel is visible + rendered
    const visible = panels().filter((p) => !p.hidden)
    expect(visible).toHaveLength(1)
    expect(visible[0].textContent).toBe("stock-panel")
  })

  it("changes selection on trigger click (uncontrolled)", () => {
    act(() => root.render(<Fixture defaultValue="stock" />))
    act(() => tabs()[1].click())
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true")
    const visible = panels().filter((p) => !p.hidden)
    expect(visible[0].textContent).toBe("upload-panel")
  })

  it("supports roving focus with arrow keys and activates the focused tab", () => {
    act(() => root.render(<Fixture defaultValue="stock" />))
    tabs()[0].focus()
    act(() =>
      tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    )
    expect(document.activeElement).toBe(tabs()[1])
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true")
    // wrap from last back to first
    tabs()[2].focus()
    act(() =>
      tabs()[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    )
    expect(document.activeElement).toBe(tabs()[0])
  })

  it("honors controlled value + fires onValueChange without self-updating", () => {
    const onValueChange = vi.fn()
    act(() => root.render(<Fixture value="stock" onValueChange={onValueChange} />))
    act(() => tabs()[2].click())
    // controlled: parent didn't change the prop, so selection stays on stock
    expect(onValueChange).toHaveBeenCalledWith("url")
    expect(tabs()[0].getAttribute("aria-selected")).toBe("true")
    // now re-render with the new controlled value
    act(() => root.render(<Fixture value="url" onValueChange={onValueChange} />))
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true")
    expect(panels().filter((p) => !p.hidden)[0].textContent).toBe("url-panel")
  })
})
