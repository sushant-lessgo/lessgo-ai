import { shortlistTags } from './shortlistTags';
import { accentOptions } from './accentOptions';
import type { 
  MarketCategory,
  TargetAudience, 
  LandingGoalType,
  StartupStage,
  ToneProfile,
  AwarenessLevel,
  PricingModel 
} from '@/modules/inference/taxonomy';

// ✅ MIGRATED: Now uses canonical field names with proper types
type UserContext = {
  marketCategory: MarketCategory;
  targetAudience: TargetAudience;
  landingPageGoals: LandingGoalType;
  startupStage: StartupStage;
  toneProfile: ToneProfile;
  awarenessLevel: AwarenessLevel;
  pricingModel: PricingModel;
};

type AccentOption = {
  baseColor: string;
  accentColor: string;
  tailwind: string;
  tags: string[];
};

// Select accent option based on user context
export function selectAccentOption(userContext: UserContext, baseColor: string): AccentOption | null {
  const tags = shortlistTags(userContext, true); // use category diversity
  const options = accentOptions.filter(
    option => option.baseColor === baseColor
  );

  // Rank options by how many tags they match
  const scored = options
    .map(option => ({
      ...option,
      matchCount: option.tags.filter(tag => tags.includes(tag)).length
    }))
    .filter(option => option.matchCount >= 3) // must match at least 3 tags
    .sort((a, b) => b.matchCount - a.matchCount);

  if (scored.length === 0) return null;

  // Randomly pick from top scoring matches
  const topScore = scored[0].matchCount;
  const topMatches = scored.filter(opt => opt.matchCount === topScore);

  return topMatches[Math.floor(Math.random() * topMatches.length)];
}