// src/modules/audience/product/strategy/parseStrategyProduct.ts
// Assemble ProductStrategyOutput from the LLM response + the deterministic fixed
// section list + fixed block map. Mirror of parseStrategyService.ts, but the
// pilot makes NO layout choices — sections/blocks are constant.

import type { ProductStrategyOutput } from '@/types/product';
import type { ProductStrategyResponse } from '@/lib/schemas/productStrategy.schema';
import { selectProductSections } from '../sectionSelection';
import { selectProductBlocks } from '../selectBlocks';

export interface AssembleProductStrategyInput {
  llmResponse: ProductStrategyResponse;
}

/**
 * Combine LLM strategy (awareness/oneReader/oneIdea/featureAnalysis) with the
 * fixed Meridian section list + block map.
 */
export function assembleProductStrategy(
  input: AssembleProductStrategyInput
): ProductStrategyOutput {
  const { llmResponse } = input;

  const sections = selectProductSections();
  const { uiblocks } = selectProductBlocks({ sections });

  return {
    awareness: llmResponse.awareness,
    oneReader: llmResponse.oneReader,
    oneIdea: llmResponse.oneIdea,
    featureAnalysis: llmResponse.featureAnalysis,
    sections,
    uiblocks,
  };
}
