// src/modules/cms/render/CollectionSection.core.tsx
//
// SINGLE-SOURCE layout for the CMS collection block. PLAIN server-safe module —
// no 'use client', no hooks, no store. The layout lives here ONCE and renders
// through injected primitives `E`; the edit wrapper and the published wrapper
// each inject their own emitters, so both trees are identical by construction
// (the markup half of the parity guarantee; the data half is toRenderModel).
//
// Rendering keys off the field TYPE (the closed set of 10; `stat` gained its
// emit path in phase 8B) — never off a field name and
// never off the template. Roles drive card composition:
//   cover → the card's lead media · title → the card heading · primaryCta → CTA
// Every remaining field renders in schema order beneath. Empty and unsafe values
// were already dropped upstream in toRenderModel, so anything reaching here is
// renderable.
//
// Styles ship INLINE (a <style> tag, the FollowStrip/StoreBadges shared-block
// convention) so the block needs nothing from public/published.css and cannot
// drift between editor and published CSS bundles.
//
// Self-sets `data-surface="neutral"` — shared blocks never call
// getSurfaceForSection (they resolve before template dispatch).

import React from 'react';
import type { CmsPrimitives } from './primitives';
import {
  fieldById,
  nonRoleFields,
  coverSrc,
  cmsDetailPath,
  type CmsRenderModel,
  type CmsFieldRender,
  type CmsItemRender,
  type CmsResolvedRoles,
} from './toRenderModel';
import type { GalleryValue, LinkValue, MediaValue, ImageValue, StatValue } from '../types';

export const CMS_COLLECTION_STYLES = `
.lg-cms{padding:var(--section-py,64px) 20px;}
.lg-cms__in{max-width:1120px;margin:0 auto;}
.lg-cms__group + .lg-cms__group{margin-top:48px;}
.lg-cms__grouph{font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;margin:0 0 16px;}
.lg-cms__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:28px;}
.lg-cms__card{display:flex;flex-direction:column;gap:10px;}
.lg-cms__cover{display:block;width:100%;aspect-ratio:4/3;overflow:hidden;border-radius:var(--radius-md,8px);background:rgba(0,0,0,.05);}
.lg-cms__cover img{width:100%;height:100%;object-fit:cover;display:block;}
.lg-cms__title{font-size:20px;line-height:1.25;margin:0;}
.lg-cms__fields{display:flex;flex-direction:column;gap:8px;}
.lg-cms__field{display:flex;flex-direction:column;gap:4px;}
.lg-cms__short{font-size:15px;opacity:.85;}
.lg-cms__prose{font-size:15px;line-height:1.6;opacity:.85;white-space:pre-wrap;margin:0;}
.lg-cms__date{font-size:13px;opacity:.6;}
.lg-cms__tags{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0;}
.lg-cms__tag{font-size:12px;padding:3px 9px;border-radius:999px;border:1px solid currentColor;opacity:.6;}
.lg-cms__gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.lg-cms__gframe{display:block;aspect-ratio:1/1;overflow:hidden;border-radius:var(--radius-sm,4px);}
.lg-cms__gframe img{width:100%;height:100%;object-fit:cover;display:block;}
.lg-cms__media{font-size:14px;text-decoration:underline;}
.lg-cms__link{font-size:14px;text-decoration:underline;}
.lg-cms__cta{display:inline-block;margin-top:2px;font-size:14px;font-weight:600;text-decoration:underline;}
.lg-cms__titlelink{color:inherit;text-decoration:none;}
.lg-cms__more{font-size:14px;text-decoration:underline;}
.lg-cms__empty{font-size:14px;opacity:.55;}
.lg-cms__stat{display:flex;align-items:baseline;gap:8px;font-size:14px;}
.lg-cms__statk{opacity:.6;}
.lg-cms__statv{font-weight:600;}
`;

/**
 * One non-role field, dispatched purely on its TYPE.
 *
 * EXPORTED so `CollectionDetail.core.tsx` renders fields through the exact same
 * emitters — a detail page that dispatched types independently would be a second
 * markup source and could drift from the listing card.
 */
export function FieldNode({ field, E }: { field: CmsFieldRender; E: CmsPrimitives }) {
  switch (field.fieldType) {
    case 'text_short':
      return <E.Txt value={field.value as string} as="span" className="lg-cms__short" />;
    case 'text_long':
      return <E.Txt value={field.value as string} as="p" className="lg-cms__prose" multiline />;
    case 'date':
      return <E.Txt value={field.value as string} as="span" className="lg-cms__date" />;
    case 'tags':
      return (
        <E.List
          items={field.value as string[]}
          as="ul"
          itemAs="li"
          className="lg-cms__tags"
          itemClassName="lg-cms__tag"
          keyOf={(t: string, i: number) => `${t}-${i}`}
          render={(t: string) => t}
        />
      );
    case 'image': {
      const v = field.value as ImageValue;
      return <E.Img src={v.url} alt={field.name} className="lg-cms__gframe" />;
    }
    case 'gallery':
      return (
        <E.List
          items={field.value as GalleryValue}
          className="lg-cms__gallery"
          keyOf={(g: ImageValue, i: number) => `${g.url}-${i}`}
          render={(g: ImageValue) => (
            <E.Img src={g.url} alt={field.name} className="lg-cms__gframe" />
          )}
        />
      );
    case 'video':
    case 'audio': {
      // v1 renders media as a labelled destination link (an inline player is a
      // documented follow-on) — the URL is already wide-predicate sanitized.
      const v = field.value as MediaValue;
      return (
        <E.Link href={v.url} className="lg-cms__media" ariaLabel={field.name}>
          {field.name}
        </E.Link>
      );
    }
    // A spec/stat PAIR (amendment item 1) — "Weight · 4.2 kg". Rendered as one
    // row of two spans, shared by the listing card and the detail page (both go
    // through this function). Either half may be empty (toRenderModel drops the
    // field only when BOTH are), so each span is emitted through E.Txt, which
    // renders nothing for an empty value.
    case 'stat': {
      const v = field.value as StatValue;
      return (
        <span className="lg-cms__stat">
          <E.Txt value={v.key} as="span" className="lg-cms__statk" />
          <E.Txt value={v.value} as="span" className="lg-cms__statv" />
        </span>
      );
    }
    case 'link': {
      const v = field.value as LinkValue;
      return (
        <E.Link href={v.url} className="lg-cms__link">
          {v.label || field.name}
        </E.Link>
      );
    }
    default:
      return null;
  }
}

function ItemCard({
  item,
  roles,
  E,
  detailHref,
}: {
  item: CmsItemRender;
  roles: CmsResolvedRoles;
  E: CmsPrimitives;
  /**
   * `/<collectionRef>/<itemRef>` when the collection has detail pages on, else
   * `null`. Leading-slash absolute — the pinned path convention (`cmsDetailPath`).
   * Inert in the edit twin (the edit `Link` preventDefaults), live on published.
   */
  detailHref?: string | null;
}) {
  const cover = fieldById(item, roles.cover);
  const title = fieldById(item, roles.title);
  const cta = fieldById(item, roles.primaryCta);
  const src = coverSrc(cover);
  const rest = nonRoleFields(item, roles);

  const titleNode = title ? (
    <E.Txt value={title.value as string} as="h3" className="lg-cms__title" />
  ) : null;

  return (
    <>
      {src ? (
        <E.Img
          src={src}
          alt={(title?.value as string) || ''}
          className="lg-cms__cover"
        />
      ) : null}
      {/* detail pages ON → the card's title is the link to the item page. With no
          title role there is nothing to wrap, so a standalone "View" link keeps
          every item reachable rather than silently unreachable. */}
      {titleNode && detailHref ? (
        <E.Link href={detailHref} className="lg-cms__titlelink">
          {titleNode}
        </E.Link>
      ) : (
        titleNode
      )}
      {!titleNode && detailHref ? (
        <E.Link href={detailHref} className="lg-cms__more">
          View
        </E.Link>
      ) : null}
      {rest.length ? (
        <div className="lg-cms__fields">
          {rest.map((f) => (
            <div className="lg-cms__field" key={f.fieldId} data-cms-field={f.fieldType}>
              <FieldNode field={f} E={E} />
            </div>
          ))}
        </div>
      ) : null}
      {cta ? (
        <E.Link
          href={(cta.value as LinkValue).url}
          className="lg-cms__cta"
          isPrimaryCta
        >
          {(cta.value as LinkValue).label || cta.name}
        </E.Link>
      ) : null}
    </>
  );
}

export interface CollectionSectionCoreProps {
  model: CmsRenderModel;
  E: CmsPrimitives;
  sectionId: string;
  /**
   * Edit-only chrome (the "Manage items" affordance). Rendered OUTSIDE
   * `[data-cms-body]` so the parity gate compares the same body subtree in both
   * modes. The published wrapper never passes it.
   */
  manageSlot?: React.ReactNode;
  /**
   * Edit-only empty-state guidance (phase 8B step 5), rendered ONLY when the
   * collection has no renderable items.
   *
   * Like `manageSlot` it lives OUTSIDE `[data-cms-body]`, which is what makes it
   * invisible to the parity comparator — and that placement is the WHOLE reason
   * it is a slot instead of body copy. The published twin never passes it: an
   * empty collection must publish exactly what it published before (the plain
   * "No items yet." line), never editor chrome telling a visitor where the CMS
   * panel is.
   */
  emptySlot?: React.ReactNode;
}

/**
 * v1 group layout = STACKED groups with name headers (plan Deviations #1: one
 * shared renderer, no per-template skin, no tabs/accordion/filter). `layoutHint`
 * on the model reserves that seam.
 */
export function CollectionSectionCore({
  model,
  E,
  sectionId,
  manageSlot,
  emptySlot,
}: CollectionSectionCoreProps) {
  const hasItems = model.groups.some((g) => g.items.length > 0);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CMS_COLLECTION_STYLES }} />
      <section
        className="lg-cms"
        data-surface="neutral"
        data-sid={sectionId}
        data-section-id={sectionId}
        data-cms-collection={model.collectionRef}
      >
        {manageSlot}
        {!hasItems ? emptySlot : null}
        <div className="lg-cms__in" data-cms-body="">
          {hasItems ? (
            model.groups.map((group) => (
              <div
                className="lg-cms__group"
                key={group.groupId || '__ungrouped__'}
                data-cms-group={group.groupId || ''}
              >
                {group.name ? (
                  <E.Txt value={group.name} as="h2" className="lg-cms__grouph" />
                ) : null}
                <E.List
                  items={group.items}
                  className="lg-cms__grid"
                  itemClassName="lg-cms__card"
                  keyOf={(i: CmsItemRender) => i.itemId}
                  render={(i: CmsItemRender) => (
                    <ItemCard
                      item={i}
                      roles={model.roles}
                      E={E}
                      detailHref={
                        model.detailPages ? cmsDetailPath(model.collectionRef, i.itemRef) : null
                      }
                    />
                  )}
                />
              </div>
            ))
          ) : (
            <p className="lg-cms__empty">No items yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

export default CollectionSectionCore;
