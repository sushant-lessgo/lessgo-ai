'use client';

// src/app/edit/[token]/components/cms/GroupManager.tsx
//
// Group management for one collection: add / rename / delete + UP-DOWN reorder.
//
// ── NO DRAG, DELIBERATELY (founder ruling, scout §E #7) ──────────────────────
// Groups reorder with ▲ / ▼ buttons. The contrast with `field-row-list` (which
// IS drag-enabled) is not an inconsistency: t12 draws a drag handle for the
// SCHEMA builder, and groups were never designed at all — the ruling for them is
// "keep it simple". Adding dnd-kit here would be building an undesigned surface
// past the ruling.
//
// ── ORDERING IS SENT AS A WHOLE ARRAY ────────────────────────────────────────
// `PATCH /groups` takes `{groups: [{id, name?, order?}]}`, so a move re-numbers
// EVERY group from 0 in one request. Sending only the two swapped rows would
// leave gaps/ties whenever the stored orders are not already 0..n-1 (they are
// not, after a delete) — and ties render in insertion order, which looks like the
// reorder silently failed.
//
// Deleting a group NEVER deletes its items: `CollectionItem.groupId` is
// `onDelete: SetNull`, so they fall back to Ungrouped. The confirm says so.
//
// APP-CHROME ONLY — nothing here imports from `modules/templates/**`,
// `modules/generatedLanding/**` or `components/published/**`.

import React from 'react';

import type { CmsGroup } from '@/modules/cms/types';
import { AppIcon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { confirmDialog } from '@/components/ui/ConfirmDialog';

export interface GroupManagerProps {
  tokenId: string;
  collectionId: string;
  groups: readonly CmsGroup[];
  /** Fired after any successful write so the host can refresh `cmsData`. */
  onChanged?: () => void;
}

export function GroupManager({
  tokenId,
  collectionId,
  groups,
  onChanged,
}: GroupManagerProps) {
  const [draftName, setDraftName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const base = `/api/collections/${encodeURIComponent(collectionId)}/groups`;

  const ordered = React.useMemo(
    () => [...groups].sort((a, b) => a.order - b.order),
    [groups]
  );

  /** Runs one write. Resolves `true` only when the server accepted it. */
  const run = async (fn: () => Promise<Response>): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Could not update groups (${res.status})`);
        setBusy(false);
        return false;
      }
      setBusy(false);
      onChanged?.();
      return true;
    } catch {
      setError('Network error — groups were not updated.');
      setBusy(false);
      return false;
    }
  };

  const addGroup = () => {
    const name = draftName.trim();
    if (!name) return;
    setDraftName('');
    void run(() =>
      fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, name }),
      })
    );
  };

  /**
   * The name input is UNCONTROLLED (commit on blur/Enter, never per keystroke).
   * That means the DOM — not React — holds the typed text, so a REJECTED rename
   * would otherwise keep showing the rejected name next to the error banner, as
   * if it had been accepted. Every path that does not end in a stored rename
   * puts the stored name back.
   */
  const renameGroup = async (group: CmsGroup, el: HTMLInputElement) => {
    const revert = () => {
      el.value = group.name;
    };
    const next = el.value.trim();
    if (!next) return revert(); // blank is not a rename
    if (next === group.name) {
      el.value = group.name; // normalize away pure whitespace edits
      return;
    }
    const ok = await run(() =>
      fetch(base, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, groups: [{ id: group.id, name: next }] }),
      })
    );
    if (!ok) revert();
  };

  /** Move by ±1 and RE-NUMBER the whole list (see the header note). */
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void run(() =>
      fetch(base, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          groups: next.map((g, i) => ({ id: g.id, order: i })),
        }),
      })
    );
  };

  const deleteGroup = async (group: CmsGroup) => {
    const confirmed = await confirmDialog({
      title: `Delete "${group.name}"?`,
      message:
        'The group is removed. Its items are kept and become Ungrouped — nothing is deleted.',
      confirmLabel: 'Delete group',
      destructive: true,
    });
    if (!confirmed) return;
    void run(() =>
      fetch(
        `${base}?tokenId=${encodeURIComponent(tokenId)}&groupId=${encodeURIComponent(group.id)}`,
        { method: 'DELETE' }
      )
    );
  };

  return (
    <div className="flex flex-col gap-2 font-app-sans" data-cms-group-manager="">
      <span className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
        Groups
      </span>

      {ordered.length === 0 ? (
        <p className="text-[11.5px] text-app-muted">
          No groups yet — every item is ungrouped.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ordered.map((group, i) => (
            <li key={group.id} className="flex items-center gap-1" data-group-row={group.id}>
              <Input
                type="text"
                defaultValue={group.name}
                aria-label={`Group name: ${group.name}`}
                data-group-name={group.id}
                // Commit on blur / Enter, never per keystroke: each commit is a
                // PATCH, and a request per character is the trap `field-row-list`
                // documents for the schema builder.
                onBlur={(e) => void renameGroup(group, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="h-8 min-w-0 flex-1 text-[12.5px]"
              />
              <button
                type="button"
                data-group-up={group.id}
                aria-label={`Move ${group.name} up`}
                disabled={i === 0 || busy}
                onClick={() => move(i, -1)}
                className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-muted hover:bg-app-hover hover:text-app-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <AppIcon name="arrow_upward" size={16} />
              </button>
              <button
                type="button"
                data-group-down={group.id}
                aria-label={`Move ${group.name} down`}
                disabled={i === ordered.length - 1 || busy}
                onClick={() => move(i, 1)}
                className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-muted hover:bg-app-hover hover:text-app-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <AppIcon name="arrow_downward" size={16} />
              </button>
              <button
                type="button"
                data-group-delete={group.id}
                aria-label={`Delete ${group.name}`}
                disabled={busy}
                onClick={() => void deleteGroup(group)}
                className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-faint hover:bg-app-delete-bg hover:text-app-delete disabled:pointer-events-none disabled:opacity-40"
              >
                <AppIcon name="delete" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          type="text"
          value={draftName}
          aria-label="New group name"
          data-group-new-name=""
          placeholder="New group…"
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addGroup();
            }
          }}
          className="h-8 min-w-0 flex-1 text-[12.5px]"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-group-add=""
          disabled={busy || !draftName.trim()}
          onClick={addGroup}
        >
          Add
        </Button>
      </div>

      {error ? (
        <p role="alert" data-cms-group-error="" className="text-[12px] text-app-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default GroupManager;
