// Multi-page shared chrome (Phase 2): inject the project's shared header/footer
// into a page's { layout:{sections}, content } so every frozen/generated page is
// self-contained. Header prepended, footer appended; idempotent.
export function injectChromeIntoPage(layout: any, contentMap: any, chrome: any) {
  if (!chrome || !layout || !contentMap) return;
  const sections: string[] = Array.isArray(layout.sections) ? layout.sections : [];
  const without = sections.filter(
    (id) => !(chrome.header && id === chrome.header.id) && !(chrome.footer && id === chrome.footer.id),
  );
  const next: string[] = [];
  if (chrome.header?.id) {
    next.push(chrome.header.id);
    contentMap[chrome.header.id] = chrome.header.data;
  }
  next.push(...without);
  if (chrome.footer?.id) {
    next.push(chrome.footer.id);
    contentMap[chrome.footer.id] = chrome.footer.data;
  }
  layout.sections = next;
}
