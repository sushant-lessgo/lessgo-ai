'use client';

// src/app/edit/[token]/components/primitives/EditableImageCollection.tsx
// Edit-primitive CHROME for the `imageCollection` kind (editor phase-3, phase 6).
//
// Reusable collection-editing chrome for ANY template's edit primitives: bulk
// upload, drag-reorder, add-blank, and remove. Layout-AGNOSTIC — it renders the
// container the block declared (className/itemClassName) and delegates each item's
// markup back to the core via `render(item, i)`; it makes NO assumption about grid
// vs slider (atelier's hero slider consumes this next).
//
// LAW (do NOT violate): this component is mounted ONLY via an injected `E.*`
// primitive from a single-source `.core.tsx` (today: Vestria's edit `E.List`). It
// is NEVER mounted directly by a block wrapper or the core, and NEVER imported by
// any `.published.tsx` / publishedPrimitives / `.core.tsx`. Two writers on the same
// collection = the exact dual-editor conflict phase 6 forbids. Every mutation here
// flows through the single injected `onChange` (→ ctx.updateCollection whole-array
// write). Per-item ALT is owned by the E.Img affordance (elementMetadata), NOT here.
//
// @dnd-kit note: this is the FIRST @dnd-kit integration in src/. It is FULLY
// CONTAINED in this component — sensors/listeners are active only while this
// collection is mounted in the editor and a drag is in progress; nothing runs while
// idle (no intervals/observers of our own).

import React from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditStore } from '@/hooks/useEditStore';

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface EditableImageCollectionProps {
  collectionKey: string;
  items: any[];
  /** Item field the bulk upload writes each returned URL into (e.g. 'image'). */
  imageField: string;
  /** Single injected writer — the whole-array collection write (→ ctx.updateCollection). */
  onChange: (items: any[]) => void;
  /** Blank-item factory for the add-empty affordance (omit to disable blank add). */
  makeItem?: () => any;
  min?: number;
  max?: number;
  reorderable?: boolean;
  /** When set, each item shows a caption input written into this item field. */
  captionField?: string;
  /** Core item renderer (built from the OTHER injected primitives). */
  render: (item: any, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  addLabel?: string;
}

interface SortableItemProps {
  id: string;
  itemClassName?: string;
  reorderable: boolean;
  canRemove: boolean;
  onRemove: () => void;
  caption?: { value: string; onChange: (v: string) => void };
  children: React.ReactNode;
}

function SortableItem({
  id,
  itemClassName,
  reorderable,
  canRemove,
  onRemove,
  caption,
  children,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !reorderable,
  });
  const style: React.CSSProperties = {
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 5 : undefined,
  };
  return (
    <div ref={setNodeRef} className={itemClassName} style={style}>
      {reorderable && (
        <button
          type="button"
          className="vs-ic-drag"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      )}
      {children}
      {caption && (
        <input
          className="vs-ic-caption"
          value={caption.value}
          placeholder="Caption"
          onChange={(e) => caption.onChange(e.target.value)}
        />
      )}
      {canRemove && (
        <button type="button" className="vs-list-x" onClick={onRemove} title="Remove">
          ×
        </button>
      )}
    </div>
  );
}

export function EditableImageCollection({
  collectionKey,
  items,
  imageField,
  onChange,
  makeItem,
  min = 0,
  max = 99,
  reorderable = false,
  captionField,
  render,
  className,
  itemClassName,
  addLabel = '+ Add',
}: EditableImageCollectionProps) {
  const bulkUploadImages = useEditStore((s) => (s as any).bulkUploadImages) as
    | ((files: FileList) => Promise<{ results: { file: string; url: string }[]; errors: any[] }>)
    | undefined;
  const [uploading, setUploading] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Stable id per item for @dnd-kit (mirrors the render key: item.id ?? index).
  const ids = React.useMemo(() => items.map((it, i) => it.id ?? String(i)), [items]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(items, from, to));
  };

  const addBlank = () => {
    if (!makeItem || items.length >= max) return;
    onChange([...items, { id: genId(collectionKey), ...makeItem() }]);
  };

  const removeAt = (idx: number) => {
    if (items.length <= min) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  const setCaption = (idx: number, value: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [captionField as string]: value } : it)));
  };

  const onBulkFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files || files.length === 0 || !bulkUploadImages) return;
    const remaining = max - items.length;
    if (remaining <= 0) return;
    setUploading(true);
    try {
      const { results } = await bulkUploadImages(files);
      // bulkUploadImages returns URLs only → append blank items carrying the URL in
      // the declared image field, respecting max.
      const appended = results
        .slice(0, remaining)
        .filter((r) => typeof r.url === 'string' && r.url)
        .map((r) => ({ id: genId(collectionKey), [imageField]: r.url }));
      if (appended.length) onChange([...items, ...appended]);
    } catch {
      /* surfaced by the store errors slice */
    } finally {
      setUploading(false);
    }
  };

  const canAddMore = items.length < max;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item, i) => {
            const id = ids[i];
            return (
              <SortableItem
                key={id}
                id={id}
                itemClassName={itemClassName}
                reorderable={reorderable}
                canRemove={items.length > min}
                onRemove={() => removeAt(i)}
                caption={
                  captionField
                    ? { value: item[captionField] ?? '', onChange: (v) => setCaption(i, v) }
                    : undefined
                }
              >
                {render(item, i)}
              </SortableItem>
            );
          })}
          {canAddMore && (
            <div className="vs-ic-add">
              <label className="vs-list-add">
                {uploading ? 'Uploading…' : '↥ Upload images'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={uploading}
                  onChange={onBulkFiles}
                />
              </label>
              {makeItem && (
                <button type="button" className="vs-list-add" onClick={addBlank}>
                  {addLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default EditableImageCollection;
