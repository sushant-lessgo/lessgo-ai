// src/modules/service/strategy/parseStrategyService.ts
// Assemble final ServiceStrategyOutputAssembled from LLM response + deterministic
// section list + deterministic uiblock map.

import type {
  ServiceStrategyOutputAssembled,
  ServiceAssetInput,
  ServiceGoal,
  TemplateId,
} from '@/types/service';
import type { ServiceStrategyResponse } from '@/lib/schemas/strategyService.schema';
import { selectServiceSections } from '../sectionSelection';
import { selectServiceUIBlocks } from '@/modules/audience/service/selectUIBlocks';

export interface AssembleServiceStrategyInput {
  llmResponse: ServiceStrategyResponse;
  goal: ServiceGoal;
  assets: ServiceAssetInput;
  /**
   * The chosen template — passed ONLY to section selection (to widen the section
   * SET for templates like Surge that declare extra section types). FIREWALL-SAFE:
   * it is consumed here as a function arg and is deliberately NOT written onto the
   * returned assembled-strategy object, so it cannot ride into the copy prompt
   * (which receives `strategy` from the client request body). Never add it to the
   * return value.
   */
  templateId?: TemplateId | null;
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
  const { llmResponse, goal, assets, templateId } = input;

  const sections = selectServiceSections({
    awareness: llmResponse.awareness,
    goal,
    assets,
    format: llmResponse.servicePresentation.format,
    templateId,
  });

  const { uiblocks } = selectServiceUIBlocks({ sections, templateId });

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
