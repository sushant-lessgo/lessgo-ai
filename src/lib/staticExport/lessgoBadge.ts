// src/lib/staticExport/lessgoBadge.ts
// Platform attribution strip injected at the very bottom of every published page
// (all templates, all page types). Inline-styled + self-contained (own dark
// background) so it's legible regardless of the template footer surface and needs
// no published.css rebuild. Followed backlink (no nofollow) + ?ref/UTM for signup
// attribution. Plain <div> — the template footer is the contentinfo landmark.
//
// Kept in its own dependency-free module (htmlGenerator pulls in `server-only`,
// which can't load under the vitest/jsdom test env) so it stays unit-testable.

export function renderLessgoBadge(): string {
  return `<div style="background:#0b0f0e;text-align:center;padding:13px 16px">
    <a href="https://lessgo.ai/?ref=badge&utm_source=published&utm_medium=badge" target="_blank" rel="noopener" aria-label="Proudly built by Lessgo AI" style="display:inline-flex;align-items:center;gap:7px;font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0.04em;color:#cbd5d1;text-decoration:none">
      <span style="color:#a3e635" aria-hidden="true">&#9670;</span>
      Proudly built by&nbsp;<span style="color:#ffffff;font-weight:600">Lessgo AI</span>
    </a>
  </div>`;
}
