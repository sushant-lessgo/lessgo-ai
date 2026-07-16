// src/modules/skeletons/work/blocks/Proof/WorkProofLogos.core.tsx
// SINGLE-SOURCE proof layout (granth .core pattern) — the LOGOS proof SHAPE (a
// client/press logo wall). PLAIN server-safe module; renders through injected `E`.
//
// Binds the frozen `proof` LOGOS-shape contract (workProofShapeContracts.logos):
//   scalars — eyebrow · heading
//   collection — logos[] { id, name, image }
// This reads a DIFFERENT collection (`logos`) than the testimonials shape
// (`quotes`), so it carries a DISTINCT copyShape in the manifest and is NEVER
// blind-swapped with testimonials/results (each would render empty).
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_PROOF_LOGOS_STYLES } from './styles';

export interface WorkProofLogo { id: string; name?: string; image?: string }

export interface WorkProofLogosContent {
  eyebrow?: string;
  heading?: string;
  logos?: WorkProofLogo[];
}

const LOGO_PH = <span className="wk-proof-logos__ph" aria-hidden="true">Logo</span>;

export function WorkProofLogosCore({
  content, E, sectionId,
}: { content: WorkProofLogosContent; E: WorkPrimitives; sectionId: string }) {
  const logos = content.logos || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_PROOF_LOGOS_STYLES }} />
      <section className="wk-proof-logos" data-sid={sectionId} data-section-id={sectionId} data-wk-proof-logos="">
        <div className="wk-proof-logos__in">
          <div className="wk-proof-logos__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-proof-logos__eyebrow" placeholder="Trusted by" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-proof-logos__heading" placeholder="Selected clients" />
          </div>

          <E.List collectionKey="logos" items={logos} className="wk-proof-logos__grid"
            itemClassName="wk-proof-logos__item"
            makeItem={() => ({ name: '', image: '' })} min={1} max={12} addLabel="+ Logo"
            render={(item: WorkProofLogo) => (
              <>
                <E.Img elementKey={`logos.${item.id}.image`} src={item.image} alt={item.name}
                  className="wk-proof-logos__media" placeholder={LOGO_PH} />
                <E.Txt elementKey={`logos.${item.id}.name`} value={item.name} as="span"
                  className="wk-proof-logos__name" placeholder="Client" />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkProofLogosCore;
