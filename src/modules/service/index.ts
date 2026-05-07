// src/modules/service/index.ts
// Public surface for the service-route module. Aggregates Phase 1 (design) +
// Phase 2 (generation backend) exports.

export * from './design';
export * from './sections/serviceElementSchema';
export * from './uiblock/selectUIBlocksService';
export * from './uiblock/layoutNamesService';
export * from './strategy/promptsService';
export * from './strategy/sectionSelectionService';
export * from './strategy/parseStrategyService';
export * from './copy/copyPromptService';
export * from './copy/voiceHearth';
export * from './copy/parseCopyService';
export * from './copy/italicAccentFallback';
export { resolveServiceBlock } from './resolveServiceBlock';

// Phase 3 — block shim
export { useServiceBlock } from './hooks/useServiceBlock';
export { HearthEditable } from './components/HearthEditable';
export { HearthSSRTokens } from './components/HearthSSRTokens';
