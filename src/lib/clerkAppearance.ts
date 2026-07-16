import type { Appearance } from '@clerk/types'

/**
 * authAppearance — Clerk `appearance` token map for the founding-cohort auth screens.
 *
 * Restyles Clerk's default <SignIn/> / <SignUp/> card to match design handoff `1b`
 * (docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Auth.dc.html).
 *
 * PRESENTATION ONLY. Clerk still owns validation, error states, Google OAuth,
 * bot protection, and every multi-step flow (email verification, password reset).
 * Nothing here changes auth behaviour.
 *
 * Styling rules (see src/components/ui/README.md):
 *   - `app-*` tokens ONLY — no ad-hoc hexes/fonts. The handoff's palette is already
 *     tokenised (#006CFF = app-primary, #191922 = app-ink, #7b7b86 = app-muted,
 *     #e2e4ea = app-border-input, #ececf1 = app-border, #b0b0ba = app-placeholder).
 *   - Field/button styling mirrors the ui-foundation `input.tsx` / `button.tsx`
 *     primitives so the Clerk widget is visually indistinguishable from our own
 *     controls (focus: border → app-primary, bg → white, per handoff §Interactions).
 *
 * The card chrome (border/shadow/padding/bg) is stripped because FounderAuthLayout's
 * left column supplies the frame — Clerk renders as a bare form inside it.
 */
export const authAppearance: Appearance = {
  layout: {
    // Our layout renders the logo in the left column; Clerk must not duplicate it.
    logoPlacement: 'none',
    socialButtonsVariant: 'blockButton',
    socialButtonsPlacement: 'top',
  },
  variables: {
    colorPrimary: '#006CFF',
    colorText: '#191922',
    colorTextSecondary: '#7b7b86',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#191922',
    colorDanger: '#d1483a',
    colorSuccess: '#16a34a',
    fontFamily: 'Onest, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '12px',
  },
  elements: {
    // ---- card chrome: stripped; the auth layout column is the frame ----
    rootBox: 'w-full',
    cardBox: 'w-full max-w-none rounded-none border-0 bg-transparent shadow-none',
    card: 'w-full gap-0 rounded-none border-0 bg-transparent p-0 shadow-none',

    // ---- header (title + subline) ----
    header: 'mb-6 items-start gap-0 text-left',
    headerTitle:
      'font-app-sans text-[28px] font-extrabold leading-[1.15] tracking-[-0.8px] text-app-ink text-left',
    headerSubtitle:
      'mt-[7px] font-app-sans text-sm font-normal leading-[1.5] text-app-muted text-left',

    // ---- social (Google) ----
    socialButtonsRoot: 'gap-3',
    socialButtonsBlockButton:
      'gap-2.5 rounded-app-input border border-app-border-input bg-app-surface py-[13px] normal-case transition-colors hover:bg-app-canvas',
    socialButtonsBlockButtonText:
      'font-app-sans text-[13.5px] font-semibold text-app-ink',

    // ---- divider ----
    dividerRow: 'my-5',
    dividerLine: 'bg-app-border',
    dividerText:
      'font-app-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-app-placeholder',

    // ---- fields (mirrors ui-foundation input.tsx) ----
    form: 'gap-3.5',
    formFieldLabel: 'font-app-sans text-xs font-semibold text-app-label',
    formFieldInput:
      'rounded-app-input border border-app-border-input bg-app-surface px-[13px] py-3 font-app-sans text-sm text-app-ink transition-colors placeholder:text-app-placeholder focus:border-app-primary focus:bg-white focus:shadow-none focus-visible:outline-none',
    formFieldAction: 'font-app-sans text-xs font-semibold text-app-primary hover:text-app-primary-hover',
    formFieldInputShowPasswordButton: 'text-app-faint hover:text-app-muted',
    formFieldErrorText: 'font-app-sans text-xs text-app-danger',
    formFieldHintText: 'font-app-sans text-xs text-app-faint',

    // ---- primary CTA (mirrors ui-foundation button.tsx `default`) ----
    formButtonPrimary:
      'mt-1.5 rounded-app-input bg-app-primary py-3.5 font-app-sans text-[14.5px] font-bold normal-case tracking-normal text-white shadow-app-btn-primary transition-colors hover:bg-app-primary-hover focus-visible:ring-2 focus-visible:ring-app-primary/40',

    // ---- footer action ("Already have an account? Log in") ----
    footer: 'mt-1 bg-transparent bg-none',
    footerAction: 'justify-center',
    footerActionText: 'font-app-sans text-[13px] font-medium text-app-muted',
    footerActionLink:
      'font-app-sans text-[13px] font-bold text-app-ink transition-colors hover:text-app-primary',

    // ---- misc ----
    identityPreview: 'rounded-app-input border border-app-border-input bg-app-canvas',
    identityPreviewText: 'font-app-sans text-sm text-app-ink',
    otpCodeFieldInput:
      'rounded-app-ctl border border-app-border-input font-app-sans text-app-ink focus:border-app-primary',
    alertText: 'font-app-sans text-sm text-app-ink',
    formHeaderTitle: 'font-app-sans text-xl font-extrabold tracking-[-0.4px] text-app-ink',
    formHeaderSubtitle: 'font-app-sans text-sm text-app-muted',
  },
}
