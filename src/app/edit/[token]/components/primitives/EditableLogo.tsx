'use client';

// src/app/edit/[token]/components/primitives/EditableLogo.tsx
// Edit-primitive: the site-scoped `logo` editing affordance (editor phase-3, phase 5).
//
// This is the ONLY editing UI for the logo (templates DECLARE, primitives OWN the
// editor). It writes the SITE-SCOPED value in `globalSettings` — `logoUrl` (LIGHT
// surface, header) and the optional `logoUrlDark` (DARK surface, footer) — so nav +
// footer converge on one value going forward.
//
// The block renders the RESOLVED logo (image/wordmark) itself via the plain
// `resolveLogo` module (identical in edit + published → parity). This component only
// adds the edit-time affordance (upload/remove slots), never rendered on published.
//
// Upload reuses the store `uploadImage` pipeline → /api/upload-image (returns a
// permanent https URL; `imageWriteGuard` still blocks data:/blob:). The dark slot is
// shown only where it is relevant (dark surface = footer); the primary slot is shown
// on both surfaces.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import type { Surface } from '@/modules/editing/primitiveTypes';

interface EditableLogoProps {
  /** Target render surface of the mounting block (header=light, footer=dark). */
  surface: Surface;
  /** Template-supplied class names so the affordance matches the block's chrome
   *  (re-shell, not redesign). All optional. */
  classNames?: { wrap?: string; btn?: string; remove?: string };
}

export function EditableLogo({ surface, classNames }: EditableLogoProps) {
  const globalSettings = useEditStore((s) => s.globalSettings);
  const setLogoUrl = useEditStore((s) => s.setLogoUrl);
  const setLogoUrlDark = useEditStore((s) => s.setLogoUrlDark);
  const clearLogo = useEditStore((s) => s.clearLogo);
  const uploadImage = useEditStore((s) => (s as any).uploadImage) as
    | ((file: File) => Promise<string | void>)
    | undefined;
  const save = useEditStore((s) => (s as any).save) as (() => Promise<void>) | undefined;

  const [uploadingLight, setUploadingLight] = React.useState(false);
  const [uploadingDark, setUploadingDark] = React.useState(false);

  const logoUrl = globalSettings?.logoUrl;
  const logoUrlDark = globalSettings?.logoUrlDark;
  const showDarkSlot = surface === 'dark';

  const persist = async () => {
    if (save) {
      try {
        await save();
      } catch {
        /* non-blocking: auto-save retries via isDirty */
      }
    }
  };

  const upload = async (file: File, which: 'light' | 'dark') => {
    if (!uploadImage) return;
    const setUploading = which === 'light' ? setUploadingLight : setUploadingDark;
    setUploading(true);
    try {
      // No targetElement → uploads + returns the permanent https URL, writes nothing
      // to per-section content (the value lives site-scoped in globalSettings).
      const url = await uploadImage(file);
      if (typeof url === 'string' && url) {
        if (which === 'light') setLogoUrl(url);
        else setLogoUrlDark(url);
        await persist();
      }
    } catch {
      /* error surfaced by the store's errors slice */
    } finally {
      setUploading(false);
    }
  };

  const onFile =
    (which: 'light' | 'dark') => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) await upload(file, which);
    };

  const removeLight = () => {
    clearLogo();
    void persist();
  };
  const removeDark = () => {
    setLogoUrlDark('');
    void persist();
  };

  const { wrap, btn, remove } = classNames || {};

  return (
    <span className={wrap}>
      <label className={btn}>
        {uploadingLight ? 'Uploading…' : logoUrl ? 'Change logo' : '↥ Logo'}
        <input type="file" accept="image/*" onChange={onFile('light')} hidden disabled={uploadingLight} />
      </label>
      {logoUrl && (
        <button type="button" className={remove} onClick={removeLight}>
          remove
        </button>
      )}
      {showDarkSlot && (
        <>
          <label className={btn}>
            {uploadingDark ? 'Uploading…' : logoUrlDark ? 'Change dark logo' : '↥ Dark-bg logo'}
            <input type="file" accept="image/*" onChange={onFile('dark')} hidden disabled={uploadingDark} />
          </label>
          {logoUrlDark && (
            <button type="button" className={remove} onClick={removeDark}>
              remove
            </button>
          )}
        </>
      )}
    </span>
  );
}

export default EditableLogo;
