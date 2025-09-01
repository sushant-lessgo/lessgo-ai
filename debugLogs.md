index.js:625 Uncaught ModuleBuildError: Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  × Expected ';', '}' or <eof>
    ╭─[C:\Users\susha\lessgo-ai\src\hooks\useSmartTextColors.ts:83:1]
 83 │           return 'poor';
 84 │         })();
 85 │         
 86 │ ╭─▶       backgroundCSS,
 87 │ │         headingColor,
 88 │ │         bodyColor,
 89 │ │         mutedColor,
 90 │ ├─▶       isLightBackground: calculatedIsLight,
    · ╰───                       ─
    · ╰──── This is the expression part of an expression statement
 91 │           contrastRating
 92 │         });
 92 │         
    ╰────


Caused by:
    Syntax Error
    at processResult (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\webpack\bundle5.js:28:400590)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\webpack\bundle5.js:28:402302)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:8645)
    at <unknown> (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:5019)
    at r.callback (file://C:\Users\susha\lessgo-ai\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:4039)
hydration-error-info.js:63 ./src/hooks/useSmartTextColors.ts
Error: 
  × Expected ';', '}' or <eof>
    ╭─[C:\Users\susha\lessgo-ai\src\hooks\useSmartTextColors.ts:83:1]
 83 │           return 'poor';
 84 │         })();
 85 │         
 86 │ ╭─▶       backgroundCSS,
 87 │ │         headingColor,
 88 │ │         bodyColor,
 89 │ │         mutedColor,
 90 │ ├─▶       isLightBackground: calculatedIsLight,
    · ╰───                       ─
    · ╰──── This is the expression part of an expression statement
 91 │           contrastRating
 92 │         });
 92 │         
    ╰────

Caused by:
    Syntax Error
console.error @ hydration-error-info.js:63
