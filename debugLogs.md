  GET http://localhost:3000/edit/TeMMl6ZoXe0E 500 (Internal Server Error)
eval @ webpack-internal:///…leware-client.js:54
processMessage @ webpack-internal:///…oader-client.js:304
eval @ webpack-internal:///…loader-client.js:67
handleMessage @ webpack-internal:///…ges/websocket.js:45
index.js:625 Uncaught ModuleBuildError: Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  × Unexpected token `LayoutSection`. Expected jsx identifier
     ╭─[C:\Users\susha\lessgo-ai\src\modules\UIBlocks\SocialProof\SocialProofStrip.tsx:306:1]
 306 │   const companies = parseCompanyData(blockContent.company_names || '');
 307 │ 
 308 │   return (
 309 │     <LayoutSection
     ·      ─────────────
 310 │       sectionId={sectionId}
 311 │       sectionType="SocialProofStrip"
 311 │       backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
     ╰────


Caused by:
    Syntax Error
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
hydration-error-info.js:63 ./src/modules/UIBlocks/SocialProof/SocialProofStrip.tsx
Error: 
  × Unexpected token `LayoutSection`. Expected jsx identifier
     ╭─[C:\Users\susha\lessgo-ai\src\modules\UIBlocks\SocialProof\SocialProofStrip.tsx:306:1]
 306 │   const companies = parseCompanyData(blockContent.company_names || '');
 307 │ 
 308 │   return (
 309 │     <LayoutSection
     ·      ─────────────
 310 │       sectionId={sectionId}
 311 │       sectionType="SocialProofStrip"
 311 │       backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
     ╰────

Caused by:
    Syntax Error
console.error @ hydration-error-info.js:63
window.console.error @ setup-hydration-warning.js:18
handleErrors @ hot-reloader-client.js:162
processMessage @ hot-reloader-client.js:239
eval @ hot-reloader-client.js:67
handleMessage @ websocket.js:45
