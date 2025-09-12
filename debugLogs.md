index.js:625 Uncaught ModuleBuildError: Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  × Unterminated string constant
     ╭─[C:\Users\susha\lessgo-ai\src\modules\UIBlocks\SocialProof\StripWithReviews.tsx:863:1]
 863 │     'Reviewer name and title editing',
 864 │     'Star rating modification',
 865 │     'Add/remove individual reviews (up to 4)',
 866 │     'Trust indicator management with custom icons (up to 3),
     ·     ────────────────────────────────────────────────────────
 867 │     'Social proof text customization',
 868 │     'Avatar system integration'
 869 │   ]
     ╰────

  × Expected ',', got 'string literal (Social proof text customization, 'Social proof text customization')'
     ╭─[C:\Users\susha\lessgo-ai\src\modules\UIBlocks\SocialProof\StripWithReviews.tsx:864:1]
 864 │     'Star rating modification',
 865 │     'Add/remove individual reviews (up to 4)',
 866 │     'Trust indicator management with custom icons (up to 3),
 867 │     'Social proof text customization',
     ·     ─────────────────────────────────
 868 │     'Avatar system integration'
 869 │   ]
 870 │ };
     ╰────


Caused by:
    Syntax Error
    at processResult (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\webpack\bundle5.js:28:400590)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\webpack\bundle5.js:28:402302)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:8645)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:5019)
    at r.callback (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:4039)
hydration-error-info.js:63 ./src/modules/UIBlocks/SocialProof/StripWithReviews.tsx
Error: 
  × Unterminated string constant
     ╭─[C:\Users\susha\lessgo-ai\src\modules\UIBlocks\SocialProof\StripWithReviews.tsx:863:1]
 863 │     'Reviewer name and title editing',
 864 │     'Star rating modification',
 865 │     'Add/remove individual reviews (up to 4)',
 866 │     'Trust indicator management with custom icons (up to 3),
     ·     ────────────────────────────────────────────────────────
 867 │     'Social proof text customization',
 868 │     'Avatar system integration'
 869 │   ]
     ╰────

  × Expected ',', got 'string literal (Social proof text customization, 'Social proof text customization')'
     ╭─[C:\Users\susha\lessgo-ai\src\modules\UIBlocks\SocialProof\StripWithReviews.tsx:864:1]
 864 │     'Star rating modification',
 865 │     'Add/remove individual reviews (up to 4)',
 866 │     'Trust indicator management with custom icons (up to 3),
 867 │     'Social proof text customization',
     ·     ─────────────────────────────────
 868 │     'Avatar system integration'
 869 │   ]
 870 │ };
     ╰────

Caused by:
    Syntax Error
console.error @ hydration-error-info.js:63
:3000/favicon.ico:1  Failed to load resource: the server responded with a status of 404 (Not Found)
