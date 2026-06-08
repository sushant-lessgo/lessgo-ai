// src/modules/service/strategy/parseStrategyService.ts
// Assemble final ServiceStrategyOutputAssembled from LLM response + deterministic
// section list + deterministic uiblock map.

import type {
  ServiceStrategyOutputAssembled,
  ServiceAssetInput,
  ServiceGoal,
} from '@/types/service';
import type { ServiceStrategyResponse } from '@/lib/schemas/strategyService.schema';
import { selectServiceSections } from '../sectionSelection';
import { selectServiceUIBlocks } from '@/modules/audience/service/selectUIBlocks';

export interface AssembleServiceStrategyInput {
  llmResponse: ServiceStrategyResponse;
  goal: ServiceGoal;
  assets: ServiceAssetInput;
}

/**
 * Combine LLM strategy + deterministic sections + deterministic uiblocks.
 *
 * Phase 8: section order is routed by the LLM-inferred `awareness` state, and
 * `servicePresentation.format === 'quote-only'` drops the packages section.
 */
export function assembleServiceStrategy(
  input: AssembleServiceStrategyInput
): ServiceStrategyOutputAssembled {
  const { llmResponse, goal, assets } = input;

  const sections = selectServiceSections({
    awareness: llmResponse.awareness,
    goal,
    assets,
    format: llmResponse.servicePresentation.format,
  });

  const { uiblocks } = selectServiceUIBlocks({ sections });

  return {
    awareness:           llmResponse.awareness,
    oneClient:           llmResponse.oneClient,
    ourPosition:         llmResponse.ourPosition,
    servicePresentation: llmResponse.servicePresentation,
    sectionDecisions:    llmResponse.sectionDecisions,
    uiblockDecisions:    llmResponse.uiblockDecisions,
    sections,
    uiblocks,
  };
}
