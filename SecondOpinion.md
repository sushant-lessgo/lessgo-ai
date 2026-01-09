# Current form placement logic

How Form Behaviors Work

  Based on the current code, here's how the two form display modes function:

  ---
  1. Scroll To Form (behavior: 'scrollTo')

  How It Works:

  Setup Phase:
  - When you connect a button to a form and choose "Scroll to Form"
  - Button stores: { type: 'form', formId: 'form-123', behavior: 'scrollTo' }

  Rendering Phase:
  - FormPlacementRenderer scans section elements for buttons with form config
  - For behavior: 'scrollTo', it renders the form inline at the end of that section
  - Form gets rendered with: <div id="form-{formId}">

  User Clicks Button:
  // FormConnectedButton.tsx line 99-103
  if (buttonConfig.behavior === 'scrollTo') {
    const formElement = document.getElementById(`form-${buttonConfig.formId}`);
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  Visual Flow:
  +---------------------------+
  |  Section Content          |
  |  [Button: "Get Started"]  |  ← User clicks button
  +---------------------------+
  |                           |
  |  FORM APPEARS HERE ↓      |  ← Form rendered inline
  |  [Name Input]             |
  |  [Email Input]            |
  |  [Submit]                 |
  +---------------------------+

  Key Points:
  - Form is always visible on the page (rendered at section bottom)
  - Button click scrolls the page to bring form into view
  - Uses smooth scroll: scrollIntoView({ behavior: 'smooth' })
  - Good for single-page flows where you want form visible

  ---
  2. Open in Modal (behavior: 'openModal')

  How It Works:

  Setup Phase:
  - When you connect a button to a form and choose "Open in Modal"
  - Button stores: { type: 'form', formId: 'form-123', behavior: 'openModal' }

  Rendering Phase:
  - FormPlacementRenderer ignores these buttons (only renders scrollTo forms)
  - Form is NOT rendered inline in the section
  - Instead, FormConnectedButton renders the form inside a hidden Dialog component

  User Clicks Button:
  // FormConnectedButton.tsx line 96-97
  if (buttonConfig.behavior === 'openModal') {
    setIsModalOpen(true);
  }

  Modal Rendering:
  // FormConnectedButton.tsx line 143-160
  {buttonConfig?.behavior === 'openModal' && form && (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{form.name}</DialogTitle>
        </DialogHeader>
        <FormRenderer
          form={form}
          mode="modal"
          userId={userId}
          publishedPageId={publishedPageId}
        />
      </DialogContent>
    </Dialog>
  )}

  Visual Flow:
  +---------------------------+
  |  Section Content          |
  |  [Button: "Get Started"]  |  ← User clicks button
  +---------------------------+
           ↓ Click triggers modal
  +---------------------------+
  |  ┌─────────────────────┐ |
  |  │ Modal Dialog        │ |
  |  │ ───────────────────  │ |
  |  │ Form Name           │ |
  |  │                     │ |
  |  │ [Name Input]        │ |
  |  │ [Email Input]       │ |
  |  │ [Submit]            │ |
  |  │                     │ |
  |  └─────────────────────┘ |
  +---------------------------+

  Key Points:
  - Form is hidden until button clicked
  - Modal overlays the page with backdrop
  - Uses Radix UI Dialog component (accessible, keyboard navigation)
  - Modal auto-closes on outside click or X button
  - Good for cleaner page layout, form only appears on demand

  ---
  Current Implementation Summary

  Scroll to Form:

  ✅ Form rendered inline by FormPlacementRenderer
  ✅ Always visible at section bottom
  ✅ Button scrolls page to form
  ✅ No modal/overlay

  Open in Modal:

  ✅ Form rendered inside Dialog component
  ✅ Hidden until button clicked
  ✅ Opens as centered overlay
  ✅ Includes modal header with form name

  Both modes:
  ✅ Use same FormRenderer component
  ✅ Same validation logic
  ✅ Same submission endpoint (/api/forms/submit)
  ✅ Same analytics tracking
  ✅ Same success/error states

  The main difference is where and when the form appears!

===========

# Target state

# CTA ACTIONS (from CTA Button Settings)
# actionType ∈ { EXTERNAL_LINK, NATIVE_FORM, LINK_WITH_INPUT_FIELD }
# For this spec we focus on actionType = NATIVE_FORM

# NATIVE_FORM CONFIG
# form.fields[] (array of fields)
# form.behavior ∈ { SCROLL_TO_FORM, OPEN_IN_MODAL }   # user setting
# form.storage ∈ { DASHBOARD, CONVERTKIT }            # integration choice (does not affect placement)
# heroSection = section where CTA button lives in hero UI block
# primaryCtaSection = dedicated CTA section of landing page (if exists)

# Derived values
fieldCount = form.fields.length
isSingleField = (fieldCount == 1)
isMultiField  = (fieldCount >= 2)


# 0) Guardrails
IF fieldCount == 0:
  # invalid form: no fields
  render hero CTA as a normal button (disabled) + show editor error "Configure CTA"
  STOP


# 1) Placement / Rendering rules for NATIVE_FORM
IF isSingleField:
  # Intent: inline email capture in hero (no scroll needed)
  # Placement
  place form in the SAME section as the CTA trigger (heroSection)
  # Rendering
  render hero CTA slot as INLINE_FORM (input + submit button)
  # Behavior setting handling
  IF form.behavior == OPEN_IN_MODAL:
     # OPTIONAL RULE (choose one):
     # A) Override modal and keep inline (recommended for single-field)
     ignore modal, keep inline form
     set effectiveBehavior = INLINE
     # OR
     # B) Allow modal anyway (less ideal conversion-wise)
     render button that opens modal with 1-field form
  ELSE:
     set effectiveBehavior = INLINE

Both hero and primaryCTA section gets same inline form

ELSE IF isMultiField:
  # Intent: avoid messy hero; put form in primary CTA section
  IF primaryCtaSection EXISTS:
     place form in primaryCtaSection (as the main content of that section)
     # Hero CTA render
     IF form.behavior == OPEN_IN_MODAL:
        render hero CTA as BUTTON that opens MODAL containing the form
     ELSE IF form.behavior == SCROLL_TO_FORM:
        render hero CTA as BUTTON that scrolls to primaryCtaSection form anchor
     END
  ELSE:
     # Missing CTA section fallback
  
     # Policy: use modal only
     # IF no CTA section, force OPEN_IN_MODAL regardless of selection
  END



# 2) Editor-time behavior (what happens when user toggles settings)
ON switching actionType to NATIVE_FORM:
  IF fieldCount == 0:
    auto-add default email field (recommended) OR prompt user to add fields
  apply placement rules above immediately (render-time decision, not click-time injection)

ON changing fields from 1 -> 2:
  move canonical form placement to primaryCtaSection (create if missing)
  hero CTA becomes scroll/modal button accordingly

ON changing fields from 2+ -> 1:
  move canonical form placement to heroSection (inline)
  hero CTA becomes inline form
  (optional) if CTA section was auto-created only for this, remove it or leave as empty section with notice


# 3) If any other section apart from hero and primaryCTA has cta button then it will scroll down to primary cta by default

# 4) If secondary CTA button is also there then it will always have placement "open in modal"


=========


## 1) Single-field + OPEN_IN_MODAL

**Choose A: Override and keep inline.**

* If `isSingleField` and user selects `OPEN_IN_MODAL`, we **normalize** to inline in Hero/CTA-slot.

iNFACT in editor just hide/disable `OPEN_IN_MODAL` for single-field native form

---

## 2) “Both hero and primaryCTA section gets same inline form”

Both should get the form. My logic. For customer's user it should be easy to give inpout email and submit. he gets convinced by hero only then he does it then and there. otherwise when he reaches the final cta section he does it there.

---

## 3) Multi-field + missing Primary CTA section fallback


* If `isMultiField` AND `primaryCtaSection` is missing:

  * **force effectiveBehavior = OPEN_IN_MODAL**

Just dont give option of inline form.
---

## 4) Other sections CTA default scroll behavior

That CTA will never have a form attached.. we should not allow..

One primaryCTA will have one form attached to it. However, primaryCTA can have multiple placements.

So if the placement is in non-hero, non-cta section then clicking on it always leads user to cta section. got it?

---

## 5) Secondary CTA placement “always open in modal”


* **Yes: secondary CTA native forms always open in modal**, regardless of field count.
* Rationale: secondary intent shouldn’t take over Hero real estate and shouldn’t create competing inline conversion paths.

(Secondary CTA *external links* still just redirect; this “always modal” rule applies only to secondary CTA with `NATIVE_FORM`.)

---