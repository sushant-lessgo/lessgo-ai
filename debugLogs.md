Front end

  GET http://localhost:3000/preview/Dt9MrHFy5f5b 500 (Internal Server Error)
Router @ webpack-internal:///…s/app-router.js:392
renderWithHooksAgain @ webpack-internal:///…evelopment.js:11272
replaySuspendedComponentWithHooks @ webpack-internal:///…evelopment.js:11219
replayFunctionComponent @ webpack-internal:///…evelopment.js:16324
replaySuspendedUnitOfWork @ webpack-internal:///…evelopment.js:25806
renderRootConcurrent @ webpack-internal:///…evelopment.js:25578
performConcurrentWorkOnRoot @ webpack-internal:///…evelopment.js:24504
workLoop @ webpack-internal:///….development.js:256
flushWork @ webpack-internal:///….development.js:225
performWorkUntilDeadline @ webpack-internal:///….development.js:534
index.js:625 Uncaught ModuleBuildError: Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  × You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
  │ Learn more: https://nextjs.org/docs/getting-started/react-essentials
    ╭─[C:\Users\susha\lessgo-ai\src\lib\staticExport\htmlGenerator.ts:5:1]
  5 │  * Uses ReactDOMServer.renderToStaticMarkup() with LandingPagePublishedRenderer
  6 │  */
  7 │ 
  8 │ import ReactDOMServer from 'react-dom/server';
    · ──────────────────────────────────────────────
  9 │ import React from 'react';
 10 │ import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
 10 │ import { validateAndResolveAssetURLs } from './assetResolver';
    ╰────

    at processResult (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\webpack\bundle5.js:28:400590)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\webpack\bundle5.js:28:402302)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:8645)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:5019)
    at r.callback (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:4039)
getServerError @ nodeStackFrames.js:38
eval @ index.js:625
setTimeout
hydrate @ index.js:613
await in hydrate
pageBootrap @ page-bootstrap.js:27
eval @ next-dev.js:25
Promise.then
eval @ next-dev.js:23
./node_modules/next/dist/client/next-dev.js @ main.js:820
options.factory @ webpack.js:647
__webpack_require__ @ webpack.js:37
__webpack_exec__ @ main.js:1975
(anonymous) @ main.js:1976
webpackJsonpCallback @ webpack.js:1195
(anonymous) @ main.js:9
hydration-error-info.js:63 ./src/lib/staticExport/htmlGenerator.ts
Error: 
  × You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
  │ Learn more: https://nextjs.org/docs/getting-started/react-essentials
    ╭─[C:\Users\susha\lessgo-ai\src\lib\staticExport\htmlGenerator.ts:5:1]
  5 │  * Uses ReactDOMServer.renderToStaticMarkup() with LandingPagePublishedRenderer
  6 │  */
  7 │ 
  8 │ import ReactDOMServer from 'react-dom/server';
    · ──────────────────────────────────────────────
  9 │ import React from 'react';
 10 │ import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
 10 │ import { validateAndResolveAssetURLs } from './assetResolver';
    ╰────
console.error @ hydration-error-info.js:63
window.console.error @ setup-hydration-warning.js:18
handleErrors @ hot-reloader-client.js:162
processMessage @ hot-reloader-client.js:239
eval @ hot-reloader-client.js:67
handleMessage @ websocket.js:45


=================

backend

 ○ Compiling /api/publish ...
 ⨯ ./src/lib/staticExport/htmlGenerator.ts
Error:
  × You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
  │ Learn more: https://nextjs.org/docs/getting-started/react-essentials
    ╭─[C:\Users\susha\lessgo-ai\src\lib\staticExport\htmlGenerator.ts:5:1]
  5 │  * Uses ReactDOMServer.renderToStaticMarkup() with LandingPagePublishedRenderer
  6 │  */
  7 │
  8 │ import ReactDOMServer from 'react-dom/server';
    · ──────────────────────────────────────────────
  9 │ import React from 'react';
 10 │ import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
 10 │ import { validateAndResolveAssetURLs } from './assetResolver';
    ╰────

Import trace for requested module:
./src/lib/staticExport/htmlGenerator.ts
./src/app/api/publish/route.ts
 ⨯ ./src/lib/staticExport/htmlGenerator.ts
Error:
  × You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
  │ Learn more: https://nextjs.org/docs/getting-started/react-essentials
    ╭─[C:\Users\susha\lessgo-ai\src\lib\staticExport\htmlGenerator.ts:5:1]
  5 │  * Uses ReactDOMServer.renderToStaticMarkup() with LandingPagePublishedRenderer
  6 │  */
  7 │
  8 │ import ReactDOMServer from 'react-dom/server';
    · ──────────────────────────────────────────────
  9 │ import React from 'react';
 10 │ import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
 10 │ import { validateAndResolveAssetURLs } from './assetResolver';
    ╰────

Import trace for requested module:
./src/lib/staticExport/htmlGenerator.ts
./src/app/api/publish/route.ts
 ⨯ ./src/lib/staticExport/htmlGenerator.ts
Error:
  × You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
  │ Learn more: https://nextjs.org/docs/getting-started/react-essentials
    ╭─[C:\Users\susha\lessgo-ai\src\lib\staticExport\htmlGenerator.ts:5:1]
  5 │  * Uses ReactDOMServer.renderToStaticMarkup() with LandingPagePublishedRenderer
  6 │  */
  7 │
  8 │ import ReactDOMServer from 'react-dom/server';
    · ──────────────────────────────────────────────
  9 │ import React from 'react';
 10 │ import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';
 10 │ import { validateAndResolveAssetURLs } from './assetResolver';
    ╰────

Import trace for requested module:
./src/lib/staticExport/htmlGenerator.ts
./src/app/api/publish/route.ts
 POST /api/publish 500 in 4446ms
 GET /edit/Dt9MrHFy5f5b 500 in 55ms
 GET /preview/Dt9MrHFy5f5b 500 in 53ms
 GET /.well-known/appspecific/com.chrome.devtools.json 500 in 16ms
