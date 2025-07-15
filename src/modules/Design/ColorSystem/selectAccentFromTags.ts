import { shortlistTags } from './shortlistTags';
import { accentOptions } from './accentOptions';
import { hasGoodContrast } from '@/utils/textContrastUtils';
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

// Select accent option based on user context with contrast validation
export function selectAccentOption(userContext: UserContext, baseColor: string): AccentOption | null {
  const tags = shortlistTags(userContext, true); // use category diversity
  const options = accentOptions.filter(
    option => option.baseColor === baseColor
  );

  // ✅ NEW: Filter by contrast validation first
  const contrastValidated = options.filter(option => {
    // Check if accent color has good contrast with base color
    const baseColorBg = `bg-${baseColor}-50`; // Common secondary background
    const accentColorText = `text-${option.accentColor}-600`;
    
    return hasGoodContrast(baseColorBg, accentColorText);
  });

  // Use contrast-validated options, fallback to all options if none pass
  const finalOptions = contrastValidated.length > 0 ? contrastValidated : options;
  
  console.log(`🎨 Accent selection for ${baseColor}:`, {
    totalOptions: options.length,
    contrastValidated: contrastValidated.length,
    usingValidated: contrastValidated.length > 0
  });

  // Rank options by how many tags they match
  const scored = finalOptions
    .map(option => ({
      ...option,
      matchCount: option.tags.filter(tag => tags.includes(tag)).length
    }))
    .filter(option => option.matchCount >= 3) // must match at least 3 tags
    .sort((a, b) => b.matchCount - a.matchCount);

  if (scored.length === 0) {
    // ✅ NEW: Fallback with lower tag requirement if no good matches
    const fallbackScored = finalOptions
      .map(option => ({
        ...option,
        matchCount: option.tags.filter(tag => tags.includes(tag)).length
      }))
      .filter(option => option.matchCount >= 1) // Lower requirement
      .sort((a, b) => b.matchCount - a.matchCount);
    
    if (fallbackScored.length === 0) return null;
    
    console.log(`⚠️ Using fallback accent selection for ${baseColor}`);
    return fallbackScored[0]; // Return best fallback match
  }

  // Randomly pick from top scoring matches
  const topScore = scored[0].matchCount;
  const topMatches = scored.filter(opt => opt.matchCount === topScore);

  const selectedOption = topMatches[Math.floor(Math.random() * topMatches.length)];
  
  console.log(`✅ Selected accent for ${baseColor}:`, {
    accentColor: selectedOption.accentColor,
    matchCount: selectedOption.matchCount,
    totalTopMatches: topMatches.length
  });

  return selectedOption;
}