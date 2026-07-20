// cms-collections phase 5 — FieldRowList MUTATION contract (jsdom).
//
// Repo convention (no @testing-library/react): react-dom/client + React.act,
// driving real DOM events. See ToolbarButton.test.tsx.
//
// WHY KEYBOARD AND NOT POINTER DRAG: dnd-kit's collision detection needs real
// layout (getBoundingClientRect is all-zero in jsdom), so a simulated pointer
// drag would assert nothing but luck — one of the four documented "inert test
// assertion" patterns. The keyboard path on the drag handle funnels through the
// SAME `move()` → `reorderIds()` → `onReorder()` chain as the pointer path, and
// it is a real user-reachable path (a11y), not a test-only backdoor.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import {
  FieldRowList,
  reorderIds,
  resolveDragEnd,
  type FieldRowListItem,
} from "./field-row-list"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

const ITEMS: FieldRowListItem[] = [
  { id: "cover", name: "Cover" },
  { id: "title", name: "Title" },
  { id: "blurb", name: "Blurb" },
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

function handle(id: string) {
  const el = container.querySelector<HTMLButtonElement>(`[data-field-row-handle="${id}"]`)
  if (!el) throw new Error(`no drag handle for ${id}`)
  return el
}

function pressOnHandle(id: string, key: string) {
  act(() => {
    handle(id).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  })
}

function rowIds() {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-field-row]")).map(
    (el) => el.dataset.fieldRow,
  )
}

describe("reorderIds (pure)", () => {
  it("moves an item and preserves every other id's relative order", () => {
    expect(reorderIds(["a", "b", "c", "d"], 2, 0)).toEqual(["c", "a", "b", "d"])
    expect(reorderIds(["a", "b", "c", "d"], 0, 3)).toEqual(["b", "c", "d", "a"])
  })

  it("is a no-op (copy) for out-of-range or identity moves", () => {
    expect(reorderIds(["a", "b"], 0, 0)).toEqual(["a", "b"])
    expect(reorderIds(["a", "b"], 0, 5)).toEqual(["a", "b"])
    expect(reorderIds(["a", "b"], -1, 1)).toEqual(["a", "b"])
  })
})

describe("resolveDragEnd (pure — the drag-end id→index mapping)", () => {
  // Covers the half of the pointer path that ISN'T dnd-kit's own event plumbing.
  // Mocking DndContext does not work here (useSortable resolves dnd-kit's
  // internal context, so a stubbed provider yields degenerate rows), so the
  // mapping is extracted and tested directly — a swapped from/to now fails.
  const IDS = ["cover", "title", "blurb"]

  it("maps active/over ids to the NEW order (not a from/to pair)", () => {
    expect(resolveDragEnd(IDS, "cover", "blurb")).toEqual(["title", "blurb", "cover"])
    // direction matters: dragging the last onto the first is not the same move
    expect(resolveDragEnd(IDS, "blurb", "cover")).toEqual(["blurb", "cover", "title"])
  })

  it("returns null when dropped outside any droppable (overId === null)", () => {
    expect(resolveDragEnd(IDS, "cover", null)).toBeNull()
  })

  it("returns null when dropped on itself", () => {
    expect(resolveDragEnd(IDS, "title", "title")).toBeNull()
  })

  it("returns null for an unknown id on either side", () => {
    expect(resolveDragEnd(IDS, "ghost", "title")).toBeNull()
    expect(resolveDragEnd(IDS, "title", "ghost")).toBeNull()
  })
})

describe("FieldRowList — reorder emits the NEW order", () => {
  it("ArrowDown on a handle emits the full reordered id list", () => {
    const onReorder = vi.fn()
    act(() =>
      root.render(<FieldRowList items={ITEMS} onReorder={onReorder} nameEditable={false} />),
    )

    pressOnHandle("cover", "ArrowDown")

    expect(onReorder).toHaveBeenCalledTimes(1)
    // THE assertion: the NEW order, not a from/to pair, not the old order.
    expect(onReorder).toHaveBeenCalledWith(["title", "cover", "blurb"])
  })

  it("ArrowUp moves the row the other way", () => {
    const onReorder = vi.fn()
    act(() =>
      root.render(<FieldRowList items={ITEMS} onReorder={onReorder} nameEditable={false} />),
    )

    pressOnHandle("blurb", "ArrowUp")

    expect(onReorder).toHaveBeenCalledWith(["cover", "blurb", "title"])
  })

  it("does NOT emit at the bounds (first up / last down)", () => {
    const onReorder = vi.fn()
    act(() =>
      root.render(<FieldRowList items={ITEMS} onReorder={onReorder} nameEditable={false} />),
    )

    pressOnHandle("cover", "ArrowUp")
    pressOnHandle("blurb", "ArrowDown")

    expect(onReorder).not.toHaveBeenCalled()
  })

  it("re-renders in the new order when the caller applies the emitted order", () => {
    // Controlled round-trip: proves the emitted array is actually usable as the
    // next `items` order, not merely shaped like one.
    function Harness() {
      const [items, setItems] = React.useState(ITEMS)
      return (
        <FieldRowList
          items={items}
          nameEditable={false}
          onReorder={(ids) =>
            setItems(ids.map((id) => items.find((i) => i.id === id)!))
          }
        />
      )
    }
    act(() => root.render(<Harness />))
    expect(rowIds()).toEqual(["cover", "title", "blurb"])

    pressOnHandle("cover", "ArrowDown")
    expect(rowIds()).toEqual(["title", "cover", "blurb"])

    pressOnHandle("cover", "ArrowDown")
    expect(rowIds()).toEqual(["title", "blurb", "cover"])
  })
})

describe("FieldRowList — row slots + delete", () => {
  it("delete removes the RIGHT row (id-addressed, not index-addressed)", () => {
    const onDelete = vi.fn()
    act(() =>
      root.render(
        <FieldRowList
          items={ITEMS}
          onReorder={() => {}}
          onDelete={onDelete}
          nameEditable={false}
        />,
      ),
    )

    act(() =>
      container
        .querySelector<HTMLButtonElement>('[data-field-row-delete="title"]')!
        .click(),
    )

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith("title")
  })

  it("in-place name edit emits (id, newName)", () => {
    const onNameChange = vi.fn()
    act(() =>
      root.render(
        <FieldRowList items={ITEMS} onReorder={() => {}} onNameChange={onNameChange} />,
      ),
    )

    const input = container.querySelector<HTMLInputElement>('[data-field-row-name="blurb"]')!
    act(() => {
      // React 18 controlled-input value setter, then a real input event.
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!
      setter.call(input, "Summary")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(onNameChange).toHaveBeenCalledWith("blurb", "Summary")
  })

  it("renderTrailing replaces the default delete button (phase-6 role badge slot)", () => {
    act(() =>
      root.render(
        <FieldRowList
          items={ITEMS}
          onReorder={() => {}}
          onDelete={() => {}}
          nameEditable={false}
          renderTypeChip={(item) => <span data-chip={item.id}>Text</span>}
          renderTrailing={(item) => <span data-role-badge={item.id}>Title field</span>}
        />,
      ),
    )

    expect(container.querySelectorAll("[data-role-badge]")).toHaveLength(3)
    expect(container.querySelectorAll("[data-chip]")).toHaveLength(3)
    // the default trailing must yield to the slot, not stack with it
    expect(container.querySelectorAll("[data-field-row-delete]")).toHaveLength(0)
  })
})
