'use client';

// ============================================================================
// STEP 02 — SHOW WORK, the WORK ENGINE body (work-onboarding-ingestion E2).
//
// Engine-OWNED (loaded via the seam's `showWork.loadStep`, D9). This is where
// the real ingestion lives — folder / loose-file upload → EXIF capture dates →
// grouping proposal (capped) → commit into `facts.work.groups[].photos`.
//
// ── D7a — ENGINE-WIDE UI ────────────────────────────────────────────────────
// This body renders for ANY work-engine journey (atelier or atelier2). Only the
// BINDING/reveal is atelier2-scoped (the fan-out stays dormant on atelier). So
// nothing here is template-gated.
//
// ── D10 — THE ONE COMMIT FUNNEL ─────────────────────────────────────────────
// Photos are committed via the work module's `applyRailEdit({field:'groups'})`
// → store `commitRail`. NEVER the seam's `applyEdit`/`RailEditValue` (that
// contract is text|chips — photos cannot ride it, and it is founder-signed).
// Committing through `commitRail` is ALSO what swaps the facts identity so the
// rail's existing projection-key guard (D8) fires and the chips re-project.
//
// ── D11 — SIZE-SANITY BELT ──────────────────────────────────────────────────
// `proposeGroups` already caps per-group 24 / total 150. The ONE belt assertion
// sits at THIS commit point: clamp + `console.warn` if any OUTGOING group
// exceeds 24 (a merge into an already-photo-bearing group can overshoot).
// Never throws in prod.
//
// ── D4 — EXIF PRE-UPLOAD ────────────────────────────────────────────────────
// Capture dates are read from the ORIGINAL File bytes BEFORE upload (the
// pipeline strips EXIF). `webkitRelativePath` is likewise captured client-side
// (it does not survive multipart) and fed to `proposeGroups` locally.
//
// SCOPE: proposal + commit + skip. The correction BOARD (5 verbs) is Phase 4.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useWizardStore,
  selectCommitRail,
  selectSetJourneyStep,
} from '@/hooks/useWizardStore';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { applyRailEdit, type WorkGroupInput } from '@/modules/wizard/work/rail';
import { readCaptureDates } from '@/modules/wizard/work/ingest/readCaptureDates';
import { uploadImageFiles } from '@/lib/media/uploadClient';
import {
  proposeGroups,
  mergeProposalIntoGroups,
  PHOTOS_PER_GROUP_CAP,
  type ProposePhotoInput,
  type GroupProposal,
} from '@/modules/wizard/work/ingest/proposeGroups';
import type { JourneyStepProps } from '../../JourneyShell';

interface Progress {
  done: number;
  total: number;
}

/** D11 belt — clamp any outgoing group over the per-group cap. Never throws. */
function clampGroupsToCap(groups: WorkGroupInput[]): WorkGroupInput[] {
  return groups.map((g) => {
    const photos = g.photos ?? [];
    if (photos.length > PHOTOS_PER_GROUP_CAP) {
      // eslint-disable-next-line no-console
      console.warn(
        `[show-work] group "${g.name}" carries ${photos.length} photos over the ${PHOTOS_PER_GROUP_CAP} cap — clamping.`
      );
      return { ...g, photos: photos.slice(0, PHOTOS_PER_GROUP_CAP) };
    }
    return g;
  });
}

function relativePathOf(file: File): string | undefined {
  const rp = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return rp && rp.length > 0 ? rp : undefined;
}

export default function ShowWorkStep({ seam }: JourneyStepProps) {
  const content = seam.steps.showWork;
  const commitRail = useWizardStore(selectCommitRail);
  const setJourneyStep = useWizardStore(selectSetJourneyStep);

  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<GroupProposal | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  // `webkitdirectory` is non-standard, so set it imperatively (typed attributes
  // would reject it). The folder input then reports each file's relative path.
  useEffect(() => {
    const el = folderRef.current;
    if (el) {
      el.setAttribute('webkitdirectory', '');
      el.setAttribute('directory', '');
    }
  }, []);

  const totalDropped = proposal?.totalDropped ?? 0;

  const proposalHint = useMemo(() => {
    if (!proposal) return null;
    const groupCount = proposal.groups.length;
    const photoCount = proposal.totalKept;
    if (groupCount === 0) return 'No photos yet — choose a folder or some images.';
    return `${photoCount} photo${photoCount === 1 ? '' : 's'} in ${groupCount} group${groupCount === 1 ? '' : 's'}.`;
  }, [proposal]);

  async function ingest(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setError('Those files aren’t images we can use.');
      return;
    }

    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    try {
      // D4: capture-date + relative-path read from the ORIGINAL bytes, pre-upload.
      const relPaths = files.map(relativePathOf);
      const takenAts = await readCaptureDates(files);

      const { tokenId } = useWizardStore.getState();
      if (!tokenId) {
        setError('We lost your project — please refresh and try again.');
        return;
      }

      const { uploaded, failed } = await uploadImageFiles(files, tokenId, {
        concurrency: 3,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setFailedCount(failed.length);

      if (uploaded.length === 0) {
        setError('We couldn’t upload those photos. Please try again.');
        return;
      }

      // Join uploaded urls back to the client-side EXIF/path signals by File
      // identity (uploadImageFiles carries the original File through).
      const inputs: ProposePhotoInput[] = uploaded.map((u) => {
        const idx = files.indexOf(u.file);
        return {
          id: u.assetId ?? u.url,
          url: u.url,
          name: u.file.name,
          relativePath: idx >= 0 ? relPaths[idx] : undefined,
          takenAt: idx >= 0 ? takenAts[idx] : null,
        };
      });

      const nextProposal = proposeGroups(inputs);

      // D10 commit funnel — read the LIVE bag fresh (commitRail is the only writer).
      const liveFacts = useWizardStore.getState().briefFacts;
      const existing = (getWorkFacts(liveFacts ?? undefined)?.groups ?? []) as WorkGroupInput[];
      const merged = mergeProposalIntoGroups(nextProposal, existing);
      const outgoing = clampGroupsToCap(merged); // D11 belt

      const commit = applyRailEdit({ field: 'groups', value: outgoing }, liveFacts);
      if (!commit.ok) {
        setError(commit.error);
        return;
      }
      const res = await commitRail(commit);
      if (!res.ok) {
        setError(res.error);
        return;
      }

      setProposal(nextProposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong adding your photos.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div data-testid="step-show-work" data-journey-step={2} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-app-sans text-2xl font-semibold text-app-ink">{content.title}</h1>
        <p className="font-app-sans text-sm text-app-muted max-w-xl">{content.body}</p>
      </div>

      {/* Hidden inputs — folder (webkitdirectory) + loose files. */}
      <input
        ref={folderRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        data-testid="show-work-folder-input"
        onChange={(e) => {
          void ingest(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        data-testid="show-work-file-input"
        onChange={(e) => {
          void ingest(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          data-testid="show-work-pick-folder"
          disabled={busy}
          onClick={() => folderRef.current?.click()}
        >
          <AppIcon name="folder" size={16} className="mr-1.5" />
          Upload a folder
        </Button>
        <Button
          type="button"
          variant="secondary"
          data-testid="show-work-pick-files"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <AppIcon name="add_photo_alternate" size={16} className="mr-1.5" />
          Choose photos
        </Button>
      </div>

      {busy && progress && (
        <p className="font-app-sans text-sm text-app-muted" role="status" data-testid="show-work-progress">
          Uploading {progress.done} of {progress.total}…
        </p>
      )}

      {error && (
        <p className="font-app-sans text-sm text-app-danger" role="alert" data-testid="show-work-error">
          {error}
        </p>
      )}

      {proposal && proposal.groups.length > 0 && (
        <div data-testid="show-work-proposal" className="space-y-3">
          <p className="font-app-sans text-sm text-app-ink">{proposalHint}</p>
          <ul className="space-y-1.5">
            {proposal.groups.map((g, i) => (
              <li
                key={`${g.name}-${i}`}
                data-testid="show-work-proposal-group"
                className="font-app-sans text-sm text-app-muted flex items-center gap-2"
              >
                <span className="text-app-ink">{g.name}</span>
                <span className="text-app-placeholder">
                  {g.dropped > 0 ? `kept ${g.kept} of ${g.kept + g.dropped}` : `${g.kept} photo${g.kept === 1 ? '' : 's'}`}
                </span>
              </li>
            ))}
          </ul>
          {totalDropped > 0 && (
            <p className="font-app-sans text-xs text-app-placeholder" data-testid="show-work-dropped">
              {totalDropped} photo{totalDropped === 1 ? '' : 's'} over the limit weren’t added.
            </p>
          )}
          {failedCount > 0 && (
            <p className="font-app-sans text-xs text-app-placeholder" data-testid="show-work-failed">
              {failedCount} photo{failedCount === 1 ? '' : 's'} couldn’t be uploaded.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        {proposal && proposal.groups.length > 0 && (
          <Button
            type="button"
            data-testid="show-work-continue"
            disabled={busy}
            onClick={() => setJourneyStep(3)}
          >
            Looks good
            <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          data-testid="show-work-skip"
          disabled={busy}
          onClick={() => setJourneyStep(3)}
        >
          {proposal ? 'Skip the rest' : 'Skip for now'}
          <AppIcon name="arrow_forward" size={16} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
