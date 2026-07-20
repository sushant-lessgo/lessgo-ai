"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"

/**
 * FieldRowList — the reorderable row list behind the CMS schema builder (t12).
 *
 * Handoff row anatomy: drag handle · editable name · type chip · trailing
 * (role badge OR delete icon). Everything after the handle is a SLOT, so
 * phase 6 composes t12's exact row (role menu, type chip popover, badges)
 * without forking this component.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**`,
 * `src/modules/generatedLanding/**`, or `src/components/published/**`.
 *
 * REORDER HAS TWO EQUAL PATHS, both funnelling through `reorderIds`:
 *  1. pointer drag (dnd-kit `PointerSensor`)
 *  2. keyboard on the handle — ArrowUp/ArrowDown move the row one slot
 * Path 2 is not a testing affordance bolted on the side: it is the a11y story
 * (dnd-kit's KeyboardSensor is not registered — see `sensors` below), AND it is
 * what the unit test drives, so the tested path is a path a user actually has.
 */

export interface FieldRowListItem {
  /** Stable id — the value emitted in `onReorder`'s new order. */
  id: string
  /** Row label; editable in place unless `nameEditable={false}`. */
  name: string
}

export interface FieldRowListProps<T extends FieldRowListItem = FieldRowListItem>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: T[]
  /** Emits the FULL new id order (not a from/to pair) after any reorder. */
  onReorder: (nextIds: string[]) => void
  /**
   * Fires on EVERY KEYSTROKE of the in-place name edit — this is a raw
   * `onChange`, not a blur/Enter commit. The input is controlled on `item.name`,
   * so the parent MUST hold the draft schema in state and feed it straight back
   * (otherwise typed text and rendered text desync). The parent must NOT write
   * per keystroke — batch into an explicit Save; a PATCH wired directly here is
   * one request per character.
   * Omit → name read-only.
   */
  onNameChange?: (id: string, name: string) => void
  /** Renders the default trailing delete icon button when provided. */
  onDelete?: (id: string) => void
  /** Type chip slot (t12's "Text — short" chip). */
  renderTypeChip?: (item: T, index: number) => React.ReactNode
  /** Trailing slot (role badge etc.). Replaces the default delete button. */
  renderTrailing?: (item: T, index: number) => React.ReactNode
  nameEditable?: boolean
}

/** Pure move-one-item reorder. Out-of-range indexes are a no-op (returns a copy). */
export function reorderIds(ids: string[], from: number, to: number): string[] {
  if (from === to) return ids.slice()
  if (from < 0 || from >= ids.length || to < 0 || to >= ids.length) return ids.slice()
  const next = ids.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Pure id→index resolution for a dnd-kit drag end. Extracted so the
 * index-mapping step (the part where a swapped from/to is a real bug) is unit
 * testable — dnd-kit's own event plumbing needs real layout and stays e2e
 * territory.
 *
 * Returns the NEW id order, or `null` when the drag is a no-op: dropped outside
 * a droppable (`overId === null`), dropped on itself, or either id unknown.
 */
export function resolveDragEnd(
  ids: string[],
  activeId: string,
  overId: string | null
): string[] | null {
  if (overId === null || activeId === overId) return null
  const from = ids.indexOf(activeId)
  const to = ids.indexOf(overId)
  if (from === -1 || to === -1) return null
  return reorderIds(ids, from, to)
}

interface RowProps {
  item: FieldRowListItem
  index: number
  count: number
  nameEditable: boolean
  onNameChange?: (id: string, name: string) => void
  onDelete?: (id: string) => void
  typeChip?: React.ReactNode
  trailing?: React.ReactNode
  onMove: (from: number, to: number) => void
}

function FieldRow({
  item,
  index,
  count,
  nameEditable,
  onNameChange,
  onDelete,
  typeChip,
  trailing,
  onMove,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  // Built by hand rather than importing `@dnd-kit/utilities` — that package is
  // only a TRANSITIVE dep here (not in package.json), and importing a phantom
  // dependency directly is how installs break later.
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition: transition ?? undefined,
  }

  const handleHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      onMove(index, index - 1)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      onMove(index, index + 1)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Pairs with the container's `role="list"` — a list whose children lack
      // `listitem` is invalid ARIA and some SRs drop list semantics entirely.
      role="listitem"
      data-field-row={item.id}
      className={cn(
        "flex items-center gap-2 rounded-app-ctl border border-app-border bg-app-surface px-2 py-1.5 font-app-sans",
        isDragging && "relative z-10 shadow-app-card"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onKeyDown={handleHandleKeyDown}
        data-field-row-handle={item.id}
        aria-label={`Reorder ${item.name} (row ${index + 1} of ${count})`}
        className="flex h-7 w-5 flex-none cursor-grab items-center justify-center text-app-icon-faint hover:text-app-icon-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40"
      >
        <AppIcon name="drag_indicator" size={18} />
      </button>

      {nameEditable && onNameChange ? (
        <input
          type="text"
          value={item.name}
          data-field-row-name={item.id}
          aria-label={`Field name for ${item.name}`}
          onChange={(e) => onNameChange(item.id, e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-sm text-app-ink outline-none placeholder:text-app-placeholder focus-visible:rounded-app-ctl-sm focus-visible:bg-app-hover"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate px-1 text-sm text-app-ink">
          {item.name}
        </span>
      )}

      {typeChip ? <div className="flex-none">{typeChip}</div> : null}

      {trailing ? (
        <div className="flex-none">{trailing}</div>
      ) : onDelete ? (
        <button
          type="button"
          data-field-row-delete={item.id}
          aria-label={`Delete ${item.name}`}
          onClick={() => onDelete(item.id)}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-faint hover:bg-app-delete-bg hover:text-app-delete focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40"
        >
          <AppIcon name="delete" size={18} />
        </button>
      ) : null}
    </div>
  )
}

function FieldRowListInner<T extends FieldRowListItem>(
  {
    items,
    onReorder,
    onNameChange,
    onDelete,
    renderTypeChip,
    renderTrailing,
    nameEditable = true,
    className,
    ...props
  }: FieldRowListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Pointer only. dnd-kit's KeyboardSensor is deliberately NOT registered: the
  // handle's own `onKeyDown` (JSX prop order) overrides the `{...listeners}`
  // activator, so the sensor could never activate — and if it did, its
  // document-level Arrow handling would double-fire against ours. Keyboard
  // reorder is owned outright by the handle's ArrowUp/ArrowDown.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const ids = React.useMemo(() => items.map((i) => i.id), [items])

  const move = React.useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= ids.length) return
      onReorder(reorderIds(ids, from, to))
    },
    [ids, onReorder]
  )

  // Thin adapter: dnd-kit event → pure `resolveDragEnd`.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const next = resolveDragEnd(
      ids,
      String(active.id),
      over ? String(over.id) : null
    )
    if (next) onReorder(next)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={ref}
          role="list"
          className={cn("flex flex-col gap-1.5", className)}
          {...props}
        >
          {items.map((item, index) => (
            <FieldRow
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              nameEditable={nameEditable}
              onNameChange={onNameChange}
              onDelete={onDelete}
              typeChip={renderTypeChip?.(item, index)}
              trailing={renderTrailing?.(item, index)}
              onMove={move}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

const FieldRowListWithRef = React.forwardRef(FieldRowListInner)
// The generic-preserving cast drops `displayName` from the public type, so set
// it on the underlying component before casting (parity with the other six
// primitives, and it keeps devtools/test output readable).
FieldRowListWithRef.displayName = "FieldRowList"

export const FieldRowList = FieldRowListWithRef as <T extends FieldRowListItem>(
  props: FieldRowListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement
