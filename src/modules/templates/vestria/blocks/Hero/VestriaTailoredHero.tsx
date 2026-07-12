'use client';

// Vestria Hero — EDIT wrapper. Layout lives in VestriaTailoredHero.core.tsx /
// VestriaFullBleedHero.core.tsx; this wrapper branches on the stored layout
// string (content[heroId].layout). Default/unknown → tailored.
//
// Full-bleed variant additionally renders EDIT-ONLY media chrome (desktop clip /
// mobile clip / poster upload). Chrome is allowed to be edit-only: parity is
// about layout/CSS, which live in the shared core + styles.ts — the published
// wrapper renders the same core without chrome.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaTailoredHeroCore, type VestriaHeroContent } from './VestriaTailoredHero.core';
import { VestriaFullBleedHeroCore, type VestriaFullBleedHeroContent } from './VestriaFullBleedHero.core';

type MediaUploadFn = (file: File, t: { sectionId: string; elementKey: string }) => Promise<string | void>;

/** Tail of a URL for display (filename without query). */
function fileTail(url?: string): string {
  if (!url) return '';
  try {
    return decodeURIComponent(url.split('/').pop() || '').split('?')[0];
  } catch {
    return url;
  }
}

const CHROME_STYLES: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch',
    padding: '10px 14px', background: '#111318', borderTop: '1px dashed #3a3f4a',
  },
  slot: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200, flex: '1 1 200px' },
  label: {
    fontFamily: 'var(--ff-mono, monospace)', fontSize: 10, letterSpacing: '.08em',
    textTransform: 'uppercase', color: '#9aa1ad',
  },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  btn: {
    fontFamily: 'var(--ff-mono, monospace)', fontSize: 11, letterSpacing: '.04em',
    color: '#e8eaee', background: '#1c2027', border: '1px solid #3a3f4a',
    borderRadius: 4, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  file: {
    fontFamily: 'var(--ff-mono, monospace)', fontSize: 11, color: '#c6cbd4',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
  },
  err: { fontFamily: 'var(--ff-mono, monospace)', fontSize: 11, color: '#f28b82' },
};

/** One upload slot (hidden file input + pick button + current filename). */
function MediaSlot({
  label, accept, currentUrl, disabled, onPick,
}: {
  label: string;
  accept: string;
  currentUrl?: string;
  disabled: boolean;
  onPick: (file: File) => Promise<void>;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      await onPick(file);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const tail = fileTail(currentUrl);
  return (
    <div style={CHROME_STYLES.slot}>
      <span style={CHROME_STYLES.label}>{label}</span>
      <div style={CHROME_STYLES.row}>
        <button
          type="button"
          style={{ ...CHROME_STYLES.btn, opacity: disabled || busy ? 0.5 : 1 }}
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : currentUrl ? 'Replace' : 'Upload'}
        </button>
        <span style={CHROME_STYLES.file} title={currentUrl || undefined}>
          {tail || 'none'}
        </span>
      </div>
      {err && <span style={CHROME_STYLES.err}>{err}</span>}
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}

/** Edit-only media chrome for the full-bleed hero's 3 slots. */
function FullBleedMediaChrome({
  sectionId, content,
}: {
  sectionId: string;
  content: VestriaFullBleedHeroContent;
}) {
  const uploadVideo = useEditStore((s) => (s as any).uploadVideo) as MediaUploadFn | undefined;
  const uploadImage = useEditStore((s) => (s as any).uploadImage) as MediaUploadFn | undefined;

  const pickVideo = (elementKey: string) => async (file: File) => {
    if (!uploadVideo) throw new Error('Video upload unavailable');
    await uploadVideo(file, { sectionId, elementKey });
  };
  const pickPoster = async (file: File) => {
    if (!uploadImage) throw new Error('Image upload unavailable');
    await uploadImage(file, { sectionId, elementKey: 'hero_video_poster' });
  };

  return (
    <div style={CHROME_STYLES.bar} data-vestria-edit-chrome="hero-media" contentEditable={false}>
      <MediaSlot
        label="Desktop clip (mp4/webm, ≤50MB)"
        accept="video/mp4,video/webm"
        currentUrl={content.hero_video_desktop}
        disabled={!uploadVideo}
        onPick={pickVideo('hero_video_desktop')}
      />
      <MediaSlot
        label="Mobile clip (mp4/webm, ≤50MB)"
        accept="video/mp4,video/webm"
        currentUrl={content.hero_video_mobile}
        disabled={!uploadVideo}
        onPick={pickVideo('hero_video_mobile')}
      />
      <MediaSlot
        label="Poster image"
        accept="image/jpeg,image/png,image/webp"
        currentUrl={content.hero_video_poster}
        disabled={!uploadImage}
        onPick={pickPoster}
      />
    </div>
  );
}

export default function VestriaTailoredHero({ sectionId }: { sectionId: string }) {
  const { blockContent, layout, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaFullBleedHeroContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  const isFullBleed = layout === 'VestriaFullBleedHero';
  return (
    <VestriaEditProvider ctx={ctx}>
      {isFullBleed
        ? <VestriaFullBleedHeroCore content={blockContent} E={editPrimitives} />
        : <VestriaTailoredHeroCore content={blockContent as VestriaHeroContent} E={editPrimitives} />}
      {isFullBleed && <FullBleedMediaChrome sectionId={sectionId} content={blockContent} />}
    </VestriaEditProvider>
  );
}
