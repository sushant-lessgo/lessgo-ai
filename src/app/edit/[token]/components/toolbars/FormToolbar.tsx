// app/edit/[token]/components/toolbars/FormToolbar.tsx
//
// toolbar-standard-beta phase 2 — fills the DEAD `form` ToolbarType.
//
// `'form'` has been a member of `ToolbarType` (selectionPriority.ts:28) with
// `showFormToolbar`/`hideFormToolbar` wired (uiActions.ts:373-376) since the old
// FormToolbar was deleted (2026-07-11) — but `actionSets` had no `form` entry, so
// the shell's lookup missed and it rendered NOTHING (empty-bubble guard,
// ToolbarShell.tsx:232). This is the body that entry now points at.
//
// ⚠️ STATUS: UNREACHABLE / DORMANT — pending a founder ruling at the gate.
// NOTHING in the editor currently produces `activeToolbar === 'form'`. Two
// INDEPENDENT blockers, either of which alone kills it (over-determined dead):
//
//   1. tagName short-circuit (the earlier, decisive one). `form_note` /
//      `form_heading` / `form_foot` never reach the key check at all: all three
//      render through `InlineTextEditorV2` with `element={as}` = `h2`/`p`
//      (TechPremiumEditable.tsx:102-105), and `data-element-key` sits on THAT
//      tag — so `determineElementType` (useEditor.ts:182-189) matches the
//      tagName branch (`h1..h6`,`p`,`span` → `'text'`) and returns before
//      `elementKey.includes('form')` at :197 is ever evaluated.
//   2. Even if a `form` type were produced, `isTextEditing` outranks `form` in
//      selectionPriority.ts:45-47, so the text toolbar wins.
//
// The real fix is SPEC-SIZED, not a tweak: it needs a `<form>`-ancestor rule
// that outranks the tagName text branch, PLUS a selection affordance — the real
// `<input>`s carry no element key at all, so there is no thing to select today.
// Note hoverTarget.ts:189 already LABELS these targets "Form" — a promise the
// click path never keeps.
//
// This body exists so the `actionSets['form']` entry points at something real
// if/when dispatch is fixed; it is not live UI. Both actions open the EXISTING
// FormBuilder modal — NO new form capability this phase (plan step 2); field
// reorder + published-supported type restriction land in phase 4 (ruling 4).

import React from 'react';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { ToolbarButton, ToolbarDivider, ToolbarLabel } from './ToolbarButton';

interface FormToolbarProps {
  sectionId: string;
  elementKey: string;
}

// Phase-3 spine: the ToolbarShell decides visibility and owns positioning + the
// t2 chrome. This component is a dumb child supplying the label chip + actions.
export function FormToolbar({ sectionId, elementKey }: FormToolbarProps) {
  // The form a contact section renders is addressed by its own `form_id` element
  // (elementSchema.ts:698/731/1093 — `fillMode: 'system'`, set at page creation by
  // ensureContactForm/seedGoalForm); the form itself lives in the top-level
  // FormsSlice map. Narrow selectors — no bare useEditStore() (ESLint-banned).
  const formId = useEditStore(
    (s) => (s.content?.[sectionId]?.elements?.form_id as string | undefined) || '',
  );
  const formName = useEditStore((s) => (formId ? s.forms?.[formId]?.name : undefined));
  const storeApi = useEditStoreApi();

  // Open the existing FormBuilder modal (GlobalFormBuilder, mounted at
  // EditLayout.tsx:220). The local cast is deliberate: the runtime action takes an
  // optional formId (and `types/store/formActions.ts:21` declares exactly that),
  // but the EditStore type surfaces UIActions' stale `showFormBuilder: () => void`
  // (types/store/actions.ts:178). Ruling 4 forbids reconciling those contracts in
  // this slice, so the drift is absorbed here at the one call site rather than
  // spread through the type files. See the audit.
  const openFormBuilder = () => {
    const show = storeApi.getState().showFormBuilder as (formId?: string) => void;
    show(formId || undefined);
  };

  // Beta set (plan step 2). Both entries open the SAME modal — FormBuilder is one
  // scrolling dialog whose TOP surface already IS the settings (name / submit text
  // / success message / integrations, FormBuilder.tsx:219-251) with the field list
  // below it; it has no tabs or anchors to route to. Recorded honestly in the
  // audit: "Settings" is a second door to the same room, not a second surface.
  const actions = [
    {
      id: 'edit-fields',
      label: 'Edit fields',
      icon: 'fields' as const,
      variant: 'emphasis' as const,
      handler: openFormBuilder,
    },
    {
      id: 'form-settings',
      label: 'Settings',
      icon: 'settings' as const,
      variant: 'default' as const,
      handler: openFormBuilder,
    },
  ];

  return (
    <div className="flex items-center gap-0.5" data-form-toolbar>
      <ToolbarLabel dotClassName="bg-sky-400" text="Form">
        {formName ? (
          <span className="text-[11px] text-[#7b7b88] whitespace-nowrap">{formName}</span>
        ) : null}
      </ToolbarLabel>

      {actions.map((action, index) => (
        <React.Fragment key={action.id}>
          {index > 0 && <ToolbarDivider />}
          <ToolbarButton
            data-action={action.id}
            onClick={(e) => {
              // Same guard the ElementToolbar modal-openers use: the editor's
              // document-level click handler must not re-resolve the selection
              // (and tear this toolbar down) before the modal mounts.
              e.stopPropagation();
              e.preventDefault();
              action.handler();
            }}
            variant={action.variant}
            icon={<FormIcon icon={action.icon} />}
            label={action.label}
            aria-haspopup="dialog"
          />
        </React.Fragment>
      ))}
    </div>
  );
}

// Icons mirror the other toolbars' inline SVG maps (AppIcon would need glyphs
// added to icons.txt + a font-subset rebuild — out of scope, see phase 1's audit).
function FormIcon({ icon }: { icon: 'fields' | 'settings' }) {
  if (icon === 'settings') {
    return (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
