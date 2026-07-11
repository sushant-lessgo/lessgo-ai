// lib/debugFlags.ts - build-time-inlined editor debug gate.
// NO 'use client': plain module, safe to import from any context.
//
// Use STATEMENT-form guards only — `if (EDITOR_DEBUG) { ... }` — never
// ternary/argument-position. A build-time-`false` const in statement form is
// what Terser dead-code-eliminates; inline/arg forms leave the expensive
// argument construction (new Error().stack, JSON.stringify) in the bundle.
//
// Editor is client code, so the flag must be a NEXT_PUBLIC_* var to be inlined
// into the client bundle (plain DEBUG_* vars are not). Off by default → false
// in prod.
export const EDITOR_DEBUG = process.env.NEXT_PUBLIC_DEBUG_EDITOR === 'true';
