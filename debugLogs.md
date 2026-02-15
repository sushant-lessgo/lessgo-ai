app-index.js:33 Warning: Cannot update a component (`HotReload`) while rendering a different component (`CenterStacked`). To locate the bad setState() call inside `CenterStacked`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
    at CenterStacked (webpack-internal:///(app-pages-browser)/./src/modules/UIBlocks/Hero/CenterStacked.tsx:235:117)
    at div
    at EnhancedLayoutWrapper (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/ui/EditablePageRenderer.tsx:367:11)
    at div
    at EditablePageRenderer (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/ui/EditablePageRenderer.tsx:131:11)
    at div
    at div
    at ElementDetector (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/selection/ElementDetector.tsx:19:11)
    at div
    at div
    at div
    at main
    at div
    at SelectionSystem (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/selection/SelectionSystem.tsx:19:11)
    at MainContent (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/MainContent.tsx:58:11)
    at div
    at div
    at div
    at div
    at VariableThemeInjector (webpack-internal:///(app-pages-browser)/./src/modules/Design/ColorSystem/VariableThemeInjector.tsx:37:11)
    at EditLayout (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/EditLayout.tsx:39:11)
    at EditPageContent (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/page.tsx:103:11)
    at EditLayoutErrorBoundaryClass (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/EditLayoutErrorBoundary.tsx:57:9)
    at EditLayoutErrorBoundary (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/EditLayoutErrorBoundary.tsx:303:11)
    at EditErrorBoundary (webpack-internal:///(app-pages-browser)/./src/components/EditErrorBoundary.tsx:87:9)
    at EditProvider (webpack-internal:///(app-pages-browser)/./src/components/EditProvider.tsx:135:11)
    at EditPage (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/page.tsx:21:78)
    at ClientPageRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/client-page.js:14:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/c
window.console.error @ app-index.js:33
CenterStacked.tsx:625 Uncaught TypeError: imageValue.startsWith is not a function
    at eval (CenterStacked.tsx:625:51)
    at CenterStacked (CenterStacked.tsx:658:11)
    at renderWithHooks (react-dom.development.js:11121:18)
    at updateFunctionComponent (react-dom.development.js:16290:20)
    at beginWork$1 (react-dom.development.js:18472:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at beginWork (react-dom.development.js:26949:7)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at performSyncWorkOnRoot (react-dom.development.js:24887:20)
    at flushSyncWorkAcrossRoots_impl (react-dom.development.js:7758:13)
    at flushSyncWorkOnAllRoots (react-dom.development.js:7718:3)
    at processRootScheduleInMicrotask (react-dom.development.js:7863:3)
    at eval (react-dom.development.js:8034:7)
CenterStacked.tsx:625 Uncaught TypeError: imageValue.startsWith is not a function
    at eval (CenterStacked.tsx:625:51)
    at CenterStacked (CenterStacked.tsx:658:11)
    at renderWithHooks (react-dom.development.js:11121:18)
    at updateFunctionComponent (react-dom.development.js:16290:20)
    at beginWork$1 (react-dom.development.js:18472:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:20565:14)
    at Object.invokeGuardedCallbackImpl (react-dom.development.js:20614:16)
    at invokeGuardedCallback (react-dom.development.js:20689:29)
    at beginWork (react-dom.development.js:26949:7)
    at performUnitOfWork (react-dom.development.js:25748:12)
    at workLoopSync (react-dom.development.js:25464:5)
    at renderRootSync (react-dom.development.js:25419:7)
    at recoverFromConcurrentError (react-dom.development.js:24597:20)
    at performSyncWorkOnRoot (react-dom.development.js:24899:20)
    at flushSyncWorkAcrossRoots_impl (react-dom.development.js:7758:13)
    at flushSyncWorkOnAllRoots (react-dom.development.js:7718:3)
    at processRootScheduleInMicrotask (react-dom.development.js:7863:3)
    at eval (react-dom.development.js:8034:7)
app-index.js:33 The above error occurred in the <CenterStacked> component:

    at CenterStacked (webpack-internal:///(app-pages-browser)/./src/modules/UIBlocks/Hero/CenterStacked.tsx:235:117)
    at div
    at EnhancedLayoutWrapper (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/ui/EditablePageRenderer.tsx:367:11)
    at div
    at EditablePageRenderer (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/ui/EditablePageRenderer.tsx:131:11)
    at div
    at div
    at ElementDetector (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/selection/ElementDetector.tsx:19:11)
    at div
    at div
    at div
    at main
    at div
    at SelectionSystem (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/selection/SelectionSystem.tsx:19:11)
    at MainContent (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/MainContent.tsx:58:11)
    at div
    at div
    at div
    at div
    at VariableThemeInjector (webpack-internal:///(app-pages-browser)/./src/modules/Design/ColorSystem/VariableThemeInjector.tsx:37:11)
    at EditLayout (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/EditLayout.tsx:39:11)
    at EditPageContent (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/page.tsx:103:11)
    at EditLayoutErrorBoundaryClass (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/EditLayoutErrorBoundary.tsx:57:9)
    at EditLayoutErrorBoundary (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/components/layout/EditLayoutErrorBoundary.tsx:303:11)
    at EditErrorBoundary (webpack-internal:///(app-pages-browser)/./src/components/EditErrorBoundary.tsx:87:9)
    at EditProvider (webpack-internal:///(app-pages-browser)/./src/components/EditProvider.tsx:135:11)
    at EditPage (webpack-internal:///(app-pages-browser)/./src/app/edit/[token]/page.tsx:21:78)
    at ClientPageRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/client-page.js:14:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at Redi
window.console.error @ app-index.js:33
app-index.js:33 🚨 EditLayout Error Boundary caught an error: Object
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.327Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.329Z] ERROR: Failed to regenerate section uniquemechanism-883a4623: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.369Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.370Z] ERROR: Failed to regenerate section foundernote-d246bb6f: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.414Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.415Z] ERROR: Failed to regenerate section features-71e68f2d: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.453Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.454Z] ERROR: Failed to regenerate section howitworks-59c32e90: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.498Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.499Z] ERROR: Failed to regenerate section pricing-98bd47a4: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.541Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.542Z] ERROR: Failed to regenerate section cta-98b12f81: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.582Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.583Z] ERROR: Failed to regenerate section faq-78bff276: {}
window.console.error @ app-index.js:33
:3000/api/regenerate-section:1  Failed to load resource: the server responded with a status of 429 (Too Many Requests)
app-index.js:33 [2026-02-12T15:36:08.625Z] ERROR: Section regeneration error: {}
window.console.error @ app-index.js:33
app-index.js:33 [2026-02-12T15:36:08.627Z] ERROR: Failed to regenerate section footer-8c8e4a9c: {}
window.console.error @ app-index.js:33
