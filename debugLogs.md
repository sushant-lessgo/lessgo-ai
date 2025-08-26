hydration-error-info.js:63 ./src/app/edit/[token]/components/toolbars/SectionToolbar.tsx
Error: 
  × Expression expected
     ╭─[C:\Users\susha\lessgo-ai\src\app\edit\[token]\components\toolbars\SectionToolbar.tsx:276:1]
 276 │   ];
 277 │ 
 278 │   return (
 279 │     <>
     ·      ─
 280 │       {/* Show loading bar when regenerating this section */}
 281 │       {isRegenerating && (
 281 │         <div 
     ╰────

  × Expected ',', got '{'
     ╭─[C:\Users\susha\lessgo-ai\src\app\edit\[token]\components\toolbars\SectionToolbar.tsx:278:1]
 278 │   return (
 279 │     <>
 280 │       {/* Show loading bar when regenerating this section */}
 281 │       {isRegenerating && (
     ·       ─
 282 │         <div 
 283 │           className="fixed bottom-8 right-8 z-50 transition-all duration-200"
 283 │         >
     ╰────

Caused by:
    Syntax Error

Import trace for requested module:
./src/app/edit/[token]/components/toolbars/SectionToolbar.tsx
./src/app/edit/[token]/components/ui/FloatingToolbars.tsx
./src/app/edit/[token]/components/layout/MainContent.tsx
./src/app/edit/[token]/components/layout/EditLayout.tsx
./src/app/edit/[token]/page.tsx
console.error @ hydration-error-info.js:63
window.console.error @ setup-hydration-warning.js:18
handleErrors @ hot-reloader-client.js:162
processMessage @ hot-reloader-client.js:239
eval @ hot-reloader-client.js:67
handleMessage @ websocket.js:45

