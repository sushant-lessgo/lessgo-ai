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
  /** Template-aware section/block selection. ASSEMBLY ONLY — never fed into any
   *  prompt builder (the prompt firewall forbids templateId in prompt input). */
  templateId?: string;
}

/**
 * Combine LLM strategy (awareness/oneReader/oneIdea/featureAnalysis) with the
 * deterministic per-template section list + block map.
 */
export function assembleProductStrategy(
  input: AssembleProductStrategyInput
): ProductStrategyOutput {
  const { llmResponse, templateId } = input;

  const sections = selectProductSections({ templateId });
  const { uiblocks } = selectProductBlocks({ sections, templateId });

  return {
    awareness: llmResponse.awareness,
    oneReader: llmResponse.oneReader,
    oneIdea: llmResponse.oneIdea,
    featureAnalysis: llmResponse.featureAnalysis,
    sections,
    uiblocks,
  };
}
