// toolbar-standard-beta phase 4 — FormBuilder's reorder + type-restriction contract.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE LEADS WITH A REACHABILITY TEST
//
// Phase 4 was told: "NOBODY HAS EVER OBSERVED FormBuilder OPENING — verify it
// actually opens before building field-reorder into it, or you are repeating the
// mistake that killed the Menu editors (ruling 3)." That verification lives here so
// it can never silently rot back to unreachable.
//
// The premise handed down was that phase 2's `uiActions.showFormBuilder` fix is what
// made FormBuilder reachable, because `createFormActions` "was never spread into the
// store". That is FALSE, and this file pins the truth: `createFormActions` IS spread
// — transitively, via `createFormsImageActions` (formsImageActions.ts:35-38 does
// `const formActions = createFormActions(...)` then `...formActions`) — and
// `createFormsImageActions` is spread AFTER `createUIActions` (editStore.ts:423-426).
// Last spread wins, so the LIVE `showFormBuilder` is formActions', which always
// wrote `state.formBuilderOpen` correctly. FormBuilder was therefore reachable
// before phase 2 too; phase 2's uiActions copy is overridden dead code. See the
// phase-4 audit. Either way the path works — which is what unblocked this phase.
// ─────────────────────────────────────────────────────────────────────────────
//
// The store is REAL (`createEditStore`); only the EditProvider plumbing is mocked.
// `updateForm` / `addForm` / `showFormBuilder` are the genuine implementations, so
// the save path asserted below is the one the app runs.
//
// Repo convention (no @testing-library/react — genuinely absent): react-dom/client
// + act.

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useStore } from "zustand"
import { createEditStore, type EditStoreInstance } from "@/stores/editStore"
import type { EditStore } from "@/types/store"
import type { MVPFormFieldType, MVPForm } from "@/types/core/forms"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let store: EditStoreInstance

vi.mock("@/hooks/useEditStore", () => ({
  useEditStore: <T,>(selector: (s: EditStore) => T) => useStore(store, selector),
  useEditStoreApi: () => store,
}))

import { FormBuilder, FIELD_TYPES, PUBLISHED_SUPPORTED_FIELD_TYPES } from "./FormBuilder"
import { DEFAULT_AUTO_REPLY_SUBJECT, DEFAULT_AUTO_REPLY_BODY } from "@/lib/email/autoReplyTemplate"

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  store = createEditStore(`form-test-${Math.random()}`)
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.innerHTML = ""
})

function click(el: Element | null | undefined) {
  if (!el) throw new Error("expected element to exist")
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

/** Field labels in the order the builder renders their rows. */
function renderedFieldLabels(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-testid="form-field-row"] input[placeholder="Enter field label"]'),
  ).map((el) => el.value)
}

/** React-controlled input: set the value through the native setter, then fire `input`. */
function typeInto(el: Element | null, value: string) {
  if (!el) throw new Error("expected input to exist")
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

function q<T extends Element = HTMLElement>(testid: string): T | null {
  return document.querySelector<T>(`[data-testid="${testid}"]`)
}

function clickSave() {
  const save = Array.from(document.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === "Update Form",
  )
  click(save)
}

function seedForm(fields: { id: string; type: MVPFormFieldType; label: string }[]): string {
  let id = ""
  act(() => {
    id = (store.getState() as unknown as { addForm: (f: unknown) => string }).addForm({
      name: "Contact",
      fields: fields.map((f) => ({ ...f, required: false })),
      submitButtonText: "Send",
      successMessage: "Thanks",
      integrations: [],
    })
  })
  return id
}

// ── 1. REACHABILITY (the phase-4 premise gate) ──────────────────────────────
describe("FormBuilder — reachability", () => {
  // `GlobalFormBuilder.tsx:10-16` renders FormBuilder iff `state.formBuilderOpen`,
  // passing `state.editingFormId`. So THIS is the whole contract between the opener
  // (ButtonConfigurationModal.tsx:486 → `storeApi.getState().showFormBuilder()`) and
  // the modal. If it breaks, FormBuilder is unreachable and every test below is
  // testing a component no user can open.
  it("showFormBuilder writes exactly what GlobalFormBuilder gates on", () => {
    expect(typeof store.getState().showFormBuilder, "showFormBuilder is not on the store").toBe(
      "function",
    )
    expect(store.getState().formBuilderOpen).toBeFalsy()

    act(() => store.getState().showFormBuilder())
    expect(store.getState().formBuilderOpen, "showFormBuilder did not open the builder").toBe(true)
    expect(store.getState().editingFormId).toBeNull()

    act(() => store.getState().hideFormBuilder())
    expect(store.getState().formBuilderOpen).toBe(false)
  })

  it("showFormBuilder(formId) targets an existing form for editing", () => {
    const id = seedForm([{ id: "f1", type: "text", label: "Name" }])
    act(() => (store.getState() as unknown as { showFormBuilder: (i?: string) => void }).showFormBuilder(id))
    expect(store.getState().formBuilderOpen).toBe(true)
    expect(store.getState().editingFormId).toBe(id)
  })

  // The save path phase 4's reorder rides on. `updateForm` lives ONLY in
  // formActions.ts:29 — if that slice ever stops being spread, this is `undefined`
  // and every Save throws a TypeError.
  it("the save path (addForm/updateForm) exists and round-trips", () => {
    expect(typeof store.getState().updateForm).toBe("function")
    const id = seedForm([{ id: "f1", type: "text", label: "Name" }])
    expect(store.getState().forms?.[id]).toBeDefined()

    act(() =>
      store.getState().updateForm(id, {
        fields: [{ id: "f2", type: "email", label: "Email", required: false }],
      } as Partial<MVPForm>),
    )
    expect(store.getState().forms?.[id].fields.map((f) => f.id)).toEqual(["f2"])
  })
})

// ── 2. FIELD REORDER (plan ruling 4: local draft → updateForm) ───────────────
describe("FormBuilder — field reorder", () => {
  it("renders the editing form's fields in order", () => {
    const id = seedForm([
      { id: "f1", type: "text", label: "Name" },
      { id: "f2", type: "email", label: "Email" },
      { id: "f3", type: "tel", label: "Phone" },
    ])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))
    expect(renderedFieldLabels()).toEqual(["Name", "Email", "Phone"])
  })

  // THE HEADLINE ASSERTION, and it is deliberately end-to-end within the component:
  // move → SAVE → assert the STORE. Asserting only the DOM after a move would be the
  // weaker, endpoint-style test the brief warns about: the local draft could reorder
  // beautifully and `handleSave` could still persist the ORIGINAL order (that is
  // exactly the bug shape ruling 4's local-draft design risks). Only reading the
  // store after Save proves the order survived the commit.
  //
  // MUTATION-PROVEN: making `handleMoveField` a no-op fails this on the ordering.
  it("move-down reorders the draft AND the new order survives Save", () => {
    const id = seedForm([
      { id: "f1", type: "text", label: "Name" },
      { id: "f2", type: "email", label: "Email" },
      { id: "f3", type: "tel", label: "Phone" },
    ])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    const firstRow = document.querySelectorAll('[data-testid="form-field-row"]')[0]
    click(firstRow.querySelector('[data-testid="form-field-move-down"]'))

    // (a) the local draft re-rendered
    expect(renderedFieldLabels(), "the draft did not reorder").toEqual(["Email", "Name", "Phone"])

    // (b) NOT yet written to the store — ruling 4's local-draft model. If this ever
    // fails, someone wired a store action mid-draft (the desync ruling 4 forbids).
    expect(
      store.getState().forms?.[id].fields.map((f) => f.label),
      "reorder wrote to the store before Save — ruling 4 requires a local draft",
    ).toEqual(["Name", "Email", "Phone"])

    // (c) Save commits it through the existing updateForm path
    const save = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Update Form",
    )
    click(save)

    expect(
      store.getState().forms?.[id].fields.map((f) => f.label),
      "the reordered field order did not survive Save",
    ).toEqual(["Email", "Name", "Phone"])
  })

  it("move-up reorders the draft", () => {
    const id = seedForm([
      { id: "f1", type: "text", label: "Name" },
      { id: "f2", type: "email", label: "Email" },
    ])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    const rows = document.querySelectorAll('[data-testid="form-field-row"]')
    click(rows[1].querySelector('[data-testid="form-field-move-up"]'))
    expect(renderedFieldLabels()).toEqual(["Email", "Name"])
  })

  // Boundary controls exist but are inert at the ends (native `disabled` here is
  // correct — these are NOT ToolbarButtons on the dark pill, and their tooltip is a
  // plain label, not ruling 9's mandatory "why", so phase 3.5's aria-disabled
  // convention does not apply).
  it("disables move-up on the first field and move-down on the last", () => {
    const id = seedForm([
      { id: "f1", type: "text", label: "Name" },
      { id: "f2", type: "email", label: "Email" },
    ])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))
    const rows = document.querySelectorAll('[data-testid="form-field-row"]')

    expect(rows[0].querySelector<HTMLButtonElement>('[data-testid="form-field-move-up"]')!.disabled).toBe(true)
    expect(rows[0].querySelector<HTMLButtonElement>('[data-testid="form-field-move-down"]')!.disabled).toBe(false)
    expect(rows[1].querySelector<HTMLButtonElement>('[data-testid="form-field-move-up"]')!.disabled).toBe(false)
    expect(rows[1].querySelector<HTMLButtonElement>('[data-testid="form-field-move-down"]')!.disabled).toBe(true)
  })

  it("a move at the list boundary is a no-op", () => {
    const id = seedForm([
      { id: "f1", type: "text", label: "Name" },
      { id: "f2", type: "email", label: "Email" },
    ])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    const rows = document.querySelectorAll('[data-testid="form-field-row"]')
    // Force past the disabled attribute — the handler's own bounds guard must hold.
    act(() => {
      rows[0]
        .querySelector('[data-testid="form-field-move-up"]')!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(renderedFieldLabels()).toEqual(["Name", "Email"])
  })
})

// ── 3. PUBLISHED-SUPPORTED TYPE UNION (plan ruling 4 / step 6) ───────────────
describe("FormBuilder — field types are restricted to what publish renders", () => {
  // NOTE ON WHERE THE COMPILE-TIME GATE LIVES: not here. `tsconfig.json` EXCLUDES
  // `**/*.test.tsx`, so `npx tsc --noEmit` (the phase gate) never typechecks this
  // file — a `T extends U ? true : false` assertion written here CANNOT FAIL. That
  // was caught by mutation: adding 'radio' to MVPFormFieldType left a test-file
  // version of the gate green. The real bidirectional gate therefore lives in
  // FormBuilder.tsx next to FIELD_TYPES, where tsc actually reads it. What remains
  // here is the RUNTIME half: the list the builder actually offers.

  // THE OFFERED LIST. This is the assertion the brief asked for ("the type-
  // restriction assertion FAILS if an unsupported type is offered") — it reads the
  // REAL exported constant, so appending e.g. `{ value: 'radio' }` to FIELD_TYPES
  // fails it. (The compile-time gate would also reject that, but only while
  // MVPFormFieldType stays narrow — this pins the list itself, independently.)
  it("offers exactly the published-supported field types, in the Select", () => {
    expect(FIELD_TYPES.map((f) => f.value)).toEqual([...PUBLISHED_SUPPORTED_FIELD_TYPES])
    for (const f of FIELD_TYPES) {
      expect(
        PUBLISHED_SUPPORTED_FIELD_TYPES as readonly string[],
        `FormBuilder offers "${f.value}", which FormMarkupPublished cannot render — publish would silently drop it`,
      ).toContain(f.value)
    }
    // The store's 10-member FormFieldType must NOT have leaked in.
    for (const unsupported of ["radio", "checkbox", "file", "date", "number"]) {
      expect(
        FIELD_TYPES.map((f) => f.value),
        `"${unsupported}" is offered but is not publishable`,
      ).not.toContain(unsupported)
    }
  })

  // Runtime: every type the builder can PRODUCE is publishable. `handleAddField`
  // hard-codes 'text' for a new field, and the only other way to set a type is the
  // Select, whose options come from FIELD_TYPES (asserted above; the Select is also
  // opened for real in e2e/manage-items.spec.ts, where Radix works in a real browser).
  it("a newly added field defaults to a published-supported type", () => {
    const id = seedForm([])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    const add = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Add Field"),
    )
    click(add)

    expect(document.querySelectorAll('[data-testid="form-field-row"]')).toHaveLength(1)
    // Save and read the type back off the store — the type that would reach publish.
    const save = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Update Form",
    )
    click(save)

    const types = store.getState().forms?.[id].fields.map((f) => f.type) ?? []
    expect(types).toHaveLength(1)
    for (const t of types) {
      expect(
        PUBLISHED_SUPPORTED_FIELD_TYPES as readonly string[],
        `field type "${t}" is not renderable by FormMarkupPublished — publish would drop it`,
      ).toContain(t)
    }
  })

  it("seeded fields of every published-supported type round-trip through Save", () => {
    const id = seedForm(
      PUBLISHED_SUPPORTED_FIELD_TYPES.map((t, i) => ({ id: `f${i}`, type: t, label: `Field ${i}` })),
    )
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))
    expect(renderedFieldLabels()).toHaveLength(PUBLISHED_SUPPORTED_FIELD_TYPES.length)

    const save = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Update Form",
    )
    click(save)
    expect(store.getState().forms?.[id].fields.map((f) => f.type)).toEqual([...PUBLISHED_SUPPORTED_FIELD_TYPES])
  })
})

// ── 4. VISITOR AUTO-REPLY SETTINGS (lead-emails phase 3) ────────────────────
//
// The value of these tests is the SAVE assertions: the settings are useless unless
// they reach `updateForm` (and therefore `Project.content...forms[id].autoReply`,
// which `/api/forms/submit` reads at submit time). A test that only asserted the
// inputs re-render would pass even if `handleSave` dropped `autoReply` on the floor.
// So each behavioural test reads BACK the committed store state AND, for the
// round-trip case, the exact payload handed to `updateForm`.
describe("FormBuilder — visitor auto-reply settings", () => {
  /** Replace `updateForm` with a capturing wrapper that still runs the real action. */
  function captureUpdateForm(): Array<[string, Partial<MVPForm>]> {
    const calls: Array<[string, Partial<MVPForm>]> = []
    const real = store.getState().updateForm
    act(() => {
      store.setState({
        updateForm: (formId: string, updates: Partial<MVPForm>) => {
          calls.push([formId, updates])
          real(formId, updates)
        },
      } as Partial<EditStore>)
    })
    return calls
  }

  it("renders the section ON by default, with the shipped defaults as placeholders", () => {
    const id = seedForm([{ id: "f1", type: "email", label: "Email" }])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    expect(q("auto-reply-section"), "the auto-reply section did not render").not.toBeNull()

    const toggle = q<HTMLInputElement>("auto-reply-enabled")!
    // Absent config must READ as ON — this mirrors the server's
    // `form?.autoReply?.enabled !== false`. If it ever renders unchecked, the UI
    // would tell owners the feature is off while it is actually sending.
    expect(toggle.checked, "absent autoReply config must render as enabled").toBe(true)

    const subject = q<HTMLInputElement>("auto-reply-subject")!
    const body = q<HTMLTextAreaElement>("auto-reply-body")!
    expect(subject.value).toBe("")
    expect(body.value).toBe("")
    // Placeholders come from the SAME constants the send path renders, so a change
    // to the default wording can never drift from what the UI promises.
    expect(subject.placeholder).toBe(DEFAULT_AUTO_REPLY_SUBJECT)
    expect(body.placeholder).toBe(DEFAULT_AUTO_REPLY_BODY)
    expect(subject.disabled).toBe(false)
    expect(body.disabled).toBe(false)

    // Token documentation is part of the contract — {name}/{business} are the ONLY
    // substitutions renderAutoReply performs.
    const sectionText = q("auto-reply-section")!.textContent || ""
    expect(sectionText).toContain("{name}")
    expect(sectionText).toContain("{business}")
  })

  it("shows the owner's saved subject/body when re-opened", () => {
    const id = seedForm([{ id: "f1", type: "email", label: "Email" }])
    act(() =>
      store.getState().updateForm(id, {
        autoReply: { enabled: true, subject: "Got it", body: "Hi {name}, thanks." },
      } as Partial<MVPForm>),
    )
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    expect(q<HTMLInputElement>("auto-reply-subject")!.value).toBe("Got it")
    expect(q<HTMLTextAreaElement>("auto-reply-body")!.value).toBe("Hi {name}, thanks.")
    expect(q<HTMLInputElement>("auto-reply-enabled")!.checked).toBe(true)
  })

  it("toggling off greys + disables subject/body, states why, and saves enabled:false", () => {
    const id = seedForm([{ id: "f1", type: "email", label: "Email" }])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    click(q("auto-reply-enabled"))

    const toggle = q<HTMLInputElement>("auto-reply-enabled")!
    const subject = q<HTMLInputElement>("auto-reply-subject")!
    const body = q<HTMLTextAreaElement>("auto-reply-body")!
    expect(toggle.checked).toBe(false)
    expect(subject.disabled, "subject stayed editable while auto-reply is off").toBe(true)
    expect(body.disabled, "body stayed editable while auto-reply is off").toBe(true)
    // Greyed, not hidden — and with a stated reason (project convention).
    expect(subject.className).toContain("text-gray-400")
    expect(body.className).toContain("text-gray-400")
    expect(q("auto-reply-disabled-reason"), "no reason shown for the disabled inputs").not.toBeNull()

    // Still a LOCAL draft — nothing written to the store before Save.
    expect(
      store.getState().forms?.[id].autoReply,
      "the toggle wrote to the store before Save — the draft model forbids it",
    ).toBeUndefined()

    clickSave()
    expect(
      store.getState().forms?.[id].autoReply,
      "enabled:false did not survive Save — the auto-reply would keep sending",
    ).toMatchObject({ enabled: false })
  })

  it("an edited subject + body reach updateForm and survive Save", () => {
    const id = seedForm([{ id: "f1", type: "email", label: "Email" }])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))
    const calls = captureUpdateForm()

    typeInto(q("auto-reply-subject"), "Thanks for reaching out")
    typeInto(q("auto-reply-body"), "Hi {name} — {business} will reply within a day.")

    // Draft only, so far.
    expect(store.getState().forms?.[id].autoReply).toBeUndefined()

    clickSave()

    // (a) the exact payload handed to the store action
    expect(calls, "updateForm was never called").toHaveLength(1)
    expect(calls[0][0]).toBe(id)
    expect(calls[0][1].autoReply).toEqual({
      enabled: true,
      subject: "Thanks for reaching out",
      body: "Hi {name} — {business} will reply within a day.",
    })

    // (b) and what actually landed in the store, which is what gets persisted
    expect(store.getState().forms?.[id].autoReply).toEqual({
      enabled: true,
      subject: "Thanks for reaching out",
      body: "Hi {name} — {business} will reply within a day.",
    })
  })

  it("leaves autoReply ABSENT when the owner never touches the section", () => {
    // Absent config = ON with the default template. Writing `{enabled:true}` on every
    // save would be harmless but noisy; more importantly, an accidental
    // `{enabled:false}` default here would silently kill the feature for every form.
    const id = seedForm([{ id: "f1", type: "email", label: "Email" }])
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))
    clickSave()
    expect(store.getState().forms?.[id].autoReply).toBeUndefined()
  })

  it("re-enabling after a save clears enabled:false and keeps the text", () => {
    const id = seedForm([{ id: "f1", type: "email", label: "Email" }])
    act(() =>
      store.getState().updateForm(id, {
        autoReply: { enabled: false, subject: "Got it", body: "Hi {name}." },
      } as Partial<MVPForm>),
    )
    act(() => root.render(<FormBuilder isOpen onClose={() => {}} editingFormId={id} />))

    expect(q<HTMLInputElement>("auto-reply-enabled")!.checked).toBe(false)
    expect(q<HTMLInputElement>("auto-reply-subject")!.disabled).toBe(true)

    click(q("auto-reply-enabled"))
    expect(q<HTMLInputElement>("auto-reply-subject")!.disabled).toBe(false)

    clickSave()
    expect(store.getState().forms?.[id].autoReply).toEqual({
      enabled: true,
      subject: "Got it",
      body: "Hi {name}.",
    })
  })
})
