// Model tier configuration for AI endpoints
// cheap = testing/development, production = quality

export type ModelTier = 'cheap' | 'production';
export type Endpoint = 'understand' | 'strategy' | 'uiblock' | 'copy';

interface ModelConfig {
  primary: string;
  backup: string | null;
}

// Pinned model IDs for deterministic behavior (aliases can shift)
const CLAUDE_SONNET = 'claude-sonnet-4-5-20250929';
const CLAUDE_HAIKU = 'claude-haiku-4-5-20251001';
const GPT_4O_MINI = 'gpt-4o-mini';
const GPT_4O = 'gpt-4o';

const MODELS: Record<ModelTier, Record<Endpoint, ModelConfig>> = {
  cheap: {
    // Primary: OpenAI cheap, Backup: Anthropic cheap (different provider for redundancy)
    understand: { primary: GPT_4O_MINI, backup: CLAUDE_HAIKU },
    strategy: { primary: GPT_4O_MINI, backup: CLAUDE_HAIKU },
    uiblock: { primary: GPT_4O_MINI, backup: CLAUDE_HAIKU },
    copy: { primary: GPT_4O_MINI, backup: CLAUDE_HAIKU },
  },
  production: {
    understand: { primary: GPT_4O_MINI, backup: CLAUDE_HAIKU },
    // Primary: Anthropic quality, Backup: OpenAI quality (different provider)
    strategy: { primary: CLAUDE_SONNET, backup: GPT_4O },
    uiblock: { primary: CLAUDE_SONNET, backup: GPT_4O },
    copy: { primary: CLAUDE_SONNET, backup: GPT_4O },
  },
};

export function getModelConfig(endpoint: Endpoint): ModelConfig {
  const override = process.env.AI_MODEL_OVERRIDE;
  if (override) {
    return { primary: override, backup: null };
  }

  const tier = (process.env.AI_MODEL_TIER || 'cheap') as ModelTier;
  return MODELS[tier][endpoint];
}

export function getProvider(model: string): 'openai' | 'anthropic' {
  return model.startsWith('claude') ? 'anthropic' : 'openai';
}

export function getTier(): ModelTier {
  return (process.env.AI_MODEL_TIER || 'cheap') as ModelTier;
}
