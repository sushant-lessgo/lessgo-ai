// cms-collections phase 5 — MediaOrLinkField MUTATION contract (jsdom).
//
// Three things this must pin: (a) the toggle actually SWAPS the active control,
// (b) the upload side delegates to the caller via onPickRequest (this component
// must never import MediaPickerModal — isolation rule), (c) toggling does not
// silently destroy a typed link.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { MediaOrLinkField, type MediaOrLinkValue } from "./media-or-link-field"

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

const radio = (label: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
    (b) => b.textContent?.includes(label),
  )!

function Harness({
  initial,
  onPickRequest,
}: {
  initial: MediaOrLinkValue
  onPickRequest: () => void
}) {
  const [value, setValue] = React.useState(initial)
  return (
    <>
      <MediaOrLinkField
        value={value}
        onValueChange={setValue}
        onPickRequest={onPickRequest}
      />
      <output data-testid="v">{JSON.stringify(value)}</output>
    </>
  )
}

const emitted = () =>
  JSON.parse(container.querySelector('[data-testid="v"]')!.textContent!) as MediaOrLinkValue

describe("MediaOrLinkField — toggle swaps the ACTIVE control", () => {
  it("upload side shows the upload control and no link input", () => {
    act(() =>
      root.render(
        <MediaOrLinkField
          value={{ kind: "upload", url: "" }}
          onValueChange={() => {}}
          onPickRequest={() => {}}
        />,
      ),
    )
    expect(container.querySelector("[data-media-upload]")).toBeTruthy()
    expect(container.querySelector("[data-media-link]")).toBeNull()
  })

  it("clicking Link emits kind:'link' AND swaps the rendered control", () => {
    const onPickRequest = vi.fn()
    act(() =>
      root.render(
        <Harness initial={{ kind: "upload", url: "" }} onPickRequest={onPickRequest} />,
      ),
    )

    act(() => radio("Link").click())

    expect(emitted().kind).toBe("link")
    expect(container.querySelector("[data-media-link]")).toBeTruthy()
    expect(container.querySelector("[data-media-upload]")).toBeNull()
  })

  it("clicking the already-active kind emits nothing", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(
        <MediaOrLinkField
          value={{ kind: "upload", url: "" }}
          onValueChange={onValueChange}
          onPickRequest={() => {}}
        />,
      ),
    )
    act(() => radio("Upload").click())
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe("MediaOrLinkField — the caller owns the picker", () => {
  it("onPickRequest fires on the upload side", () => {
    const onPickRequest = vi.fn()
    act(() =>
      root.render(
        <MediaOrLinkField
          value={{ kind: "upload", url: "" }}
          onValueChange={() => {}}
          onPickRequest={onPickRequest}
        />,
      ),
    )

    act(() => container.querySelector<HTMLButtonElement>("[data-media-pick]")!.click())

    expect(onPickRequest).toHaveBeenCalledTimes(1)
  })

  it("upload button reads Replace once a url exists, and shows it", () => {
    act(() =>
      root.render(
        <MediaOrLinkField
          value={{ kind: "upload", url: "/media/clip.mp4" }}
          onValueChange={() => {}}
          onPickRequest={() => {}}
        />,
      ),
    )
    expect(
      container.querySelector("[data-media-upload-value]")!.textContent,
    ).toBe("/media/clip.mp4")
    expect(container.querySelector("[data-media-pick]")!.textContent).toBe("Replace")
  })
})

describe("MediaOrLinkField — link editing + non-destructive toggle", () => {
  it("typing a link emits {kind:'link', url}", () => {
    const onValueChange = vi.fn()
    act(() =>
      root.render(
        <MediaOrLinkField
          value={{ kind: "link", url: "" }}
          onValueChange={onValueChange}
          onPickRequest={() => {}}
        />,
      ),
    )

    const el = container.querySelector<HTMLInputElement>("[data-media-link]")!
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!
      setter.call(el, "https://youtu.be/x")
      el.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(onValueChange).toHaveBeenCalledWith({ kind: "link", url: "https://youtu.be/x" })
  })

  it("toggling away and back restores the typed link (no silent data loss)", () => {
    act(() =>
      root.render(<Harness initial={{ kind: "link", url: "" }} onPickRequest={() => {}} />),
    )

    const el = container.querySelector<HTMLInputElement>("[data-media-link]")!
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!
      setter.call(el, "https://youtu.be/x")
      el.dispatchEvent(new Event("input", { bubbles: true }))
    })
    expect(emitted()).toEqual({ kind: "link", url: "https://youtu.be/x" })

    act(() => radio("Upload").click())
    // the upload side must NOT inherit the typed link
    expect(emitted()).toEqual({ kind: "upload", url: "" })

    act(() => radio("Link").click())
    expect(emitted()).toEqual({ kind: "link", url: "https://youtu.be/x" })
  })
})
