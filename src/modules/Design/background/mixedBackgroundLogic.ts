import { logger } from '@/lib/logger';

// mixedBackgroundLogic.ts - Copywriting Priority + Visual Rhythm Balance

interface UserProfile {
  awarenessLevel: string;
  marketSophistication: string;
  landingGoal: string;
  targetAudience: string;
  startupStage: string;
}

type SectionBackgroundType = 'primary' | 'secondary' | 'neutral' | 'divider';
type SectionCriticality = 'conversion-critical' | 'supporting' | 'separator';

// ===== CONVERSION-CRITICAL SECTION MAPPING =====
const CONVERSION_CRITICAL_SECTIONS: Record<string, {
  profiles: string[];
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}> = {
  // Universal critical sections
  hero: {
    profiles: ['all'],
    reasoning: 'First impression determines bounce rate',
    priority: 'high'
  },
  cta: {
    profiles: ['all'], 
    reasoning: 'Final conversion moment',
    priority: 'high'
  },
  
  // Awareness-based critical sections
  problem: {
    profiles: ['unaware', 'problem-aware'],
    reasoning: 'Must establish problem awareness for conversion',
    priority: 'high'
  },
  beforeAfter: {
    profiles: ['unaware', 'problem-aware+level-2'],
    reasoning: 'Unaware users need transformation visualization',
    priority: 'high'
  },
  
  // Sophistication-based critical sections  
  results: {
    profiles: ['level-4', 'level-5', 'skeptical'],
    reasoning: 'Skeptical markets demand proof',
    priority: 'high'
  },
  testimonials: {
    profiles: ['level-4', 'level-5', 'skeptical'],
    reasoning: 'Social proof critical for skeptical buyers',
    priority: 'high'
  },
  objectionHandling: {
    profiles: ['level-4', 'level-5', 'skeptical'],
    reasoning: 'Skeptical users have many objections',
    priority: 'high'
  },
  
  // Goal-based critical sections
  pricing: {
    profiles: ['buy-now', 'subscribe', 'ready-to-buy'],
    reasoning: 'Purchase decision needs clear pricing',
    priority: 'high'
  },
  security: {
    profiles: ['enterprise', 'contact-sales'],
    reasoning: 'Enterprise buyers need security assurance',
    priority: 'medium'
  },
  integrations: {
    profiles: ['enterprise', 'developers', 'technical'],
    reasoning: 'Implementation concerns block enterprise sales',
    priority: 'medium'
  },
  
  // Audience-based critical sections
  founderNote: {
    profiles: ['early-stage', 'founders', 'pre-mvp'],
    reasoning: 'Early stage needs founder credibility',
    priority: 'medium'
  },
  uniqueMechanism: {
    profiles: ['competitive', 'solution-aware+level-3', 'solution-aware+level-4'],
    reasoning: 'Competitive markets need differentiation',
    priority: 'high'
  },
  comparisonTable: {
    profiles: ['competitive', 'solution-aware+level-3', 'solution-aware+level-4'],
    reasoning: 'Comparison shoppers need feature comparison',
    priority: 'medium'
  },
  
  // Social proof sections
  socialProof: {
    profiles: ['enterprise', 'skeptical', 'level-4'],
    reasoning: 'Enterprise and skeptical buyers need market validation',
    priority: 'medium'
  }
};

// ===== USER PROFILE ANALYSIS =====
function analyzeUserProfile(userProfile: UserProfile): string[] {
  const profileTags: string[] = [];
  
  // Add awareness level
  profileTags.push(userProfile.awarenessLevel);
  
  // Add sophistication level  
  profileTags.push(userProfile.marketSophistication);
  
  // Add combined awareness + sophistication
  profileTags.push(`${userProfile.awarenessLevel}+${userProfile.marketSophistication}`);
  
  // Add sophistication-based tags
  if (['level-4', 'level-5'].includes(userProfile.marketSophistication)) {
    profileTags.push('skeptical');
  }
  
  if (['level-3', 'level-4'].includes(userProfile.marketSophistication)) {
    profileTags.push('competitive');
  }
  
  // Add goal-based tags
  profileTags.push(userProfile.landingGoal);
  
  if (['buy-now', 'subscribe', 'contact-sales'].includes(userProfile.landingGoal)) {
    profileTags.push('ready-to-buy');
  }
  
  if (['contact-sales', 'book-call'].includes(userProfile.landingGoal)) {
    profileTags.push('enterprise');
  }
  
  // Add audience-based tags
  if (userProfile.targetAudience.includes('enterprise')) {
    profileTags.push('enterprise');
  }
  
  if (userProfile.targetAudience.includes('founder')) {
    profileTags.push('founders');
  }
  
  if (userProfile.targetAudience.includes('developer')) {
    profileTags.push('developers', 'technical');
  }
  
  // Add stage-based tags  
  if (['pre-mvp', 'mvp-development'].includes(userProfile.startupStage)) {
    profileTags.push('early-stage', 'pre-mvp');
  }
  
  // Universal tag
  profileTags.push('all');
  
  logger.debug('👤 User profile tags:', profileTags);
  return profileTags;
}

// ===== SECTION CRITICALITY ASSESSMENT =====
function getSectionCriticality(sectionId: string, userProfileTags: string[]): SectionCriticality {
  // Check if section is separator/utility
  if (['faq', 'closeSection'].includes(sectionId)) {
    return 'separator';
  }
  
  // Check if section is conversion-critical for this user
  const criticalSection = CONVERSION_CRITICAL_SECTIONS[sectionId];
  
  if (!criticalSection) {
    return 'supporting';
  }
  
  // Check if user profile matches critical section profiles
  const hasProfileMatch = criticalSection.profiles.some(profile => 
    profile === 'all' || userProfileTags.includes(profile)
  );
  
  if (hasProfileMatch) {
    logger.debug(`🎯 Section "${sectionId}" is CONVERSION-CRITICAL for this user (${criticalSection.reasoning})`);
    return 'conversion-critical';
  }
  
  return 'supporting';
}

// ===== MIXED BACKGROUND LOGIC =====
export function getMixedSectionBackground(
  sectionId: string, 
  allSections: string[], 
  userProfile: UserProfile
): SectionBackgroundType {
  
  logger.debug(`🎨 Determining background for section: ${sectionId}`);
  
  const currentIndex = allSections.indexOf(sectionId);
  const userProfileTags = analyzeUserProfile(userProfile);
  const sectionCriticality = getSectionCriticality(sectionId, userProfileTags);
  
  logger.debug(`📊 Section "${sectionId}" criticality: ${sectionCriticality}`);
  
  // ===== RULE 1: INTRINSIC OVERRIDES (Always respected) =====
  
  // Hero always gets primary (attention-grabbing)
  if (sectionId.includes('hero')) {
    logger.debug(`🎯 ${sectionId} → PRIMARY (hero section override)`);
    return 'primary';
  }
  
  // CTA always gets primary (conversion focus)  
  if (sectionId.includes('cta')) {
    logger.debug(`🎯 ${sectionId} → PRIMARY (CTA section override)`);
    return 'primary';
  }
  
  // FAQ and separators always get divider
  if (sectionCriticality === 'separator') {
    logger.debug(`🎯 ${sectionId} → DIVIDER (separator section)`);
    return 'divider';
  }
  
  // ===== RULE 2: COPYWRITING PRIORITY (Conversion-critical sections) =====
  
  if (sectionCriticality === 'conversion-critical') {
    // ✅ ENHANCED: Check last 2 sections for visual rhythm enforcement
    const previousSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
    const sectionBefore = currentIndex > 1 ? allSections[currentIndex - 2] : null;
    
    // Check if previous section was highlighted
    let previousWasHighlighted = false;
    let consecutiveHighlights = 0;
    
    if (previousSection) {
      const previousCriticality = getSectionCriticality(previousSection, userProfileTags);
      previousWasHighlighted = 
        previousSection.includes('hero') || 
        previousSection.includes('cta') ||
        previousCriticality === 'conversion-critical';
      
      if (previousWasHighlighted) {
        consecutiveHighlights = 1;
        
        // Check section before previous for consecutive count
        if (sectionBefore) {
          const beforeCriticality = getSectionCriticality(sectionBefore, userProfileTags);
          const beforeWasHighlighted = 
            sectionBefore.includes('hero') || 
            sectionBefore.includes('cta') ||
            beforeCriticality === 'conversion-critical';
          
          if (beforeWasHighlighted) {
            consecutiveHighlights = 2;
          }
        }
      }
    }
    
    // ✅ VISUAL RHYTHM ENFORCEMENT: Max 2 consecutive highlights
    if (consecutiveHighlights >= 2) {
      logger.debug(`🎯 ${sectionId} → NEUTRAL (FORCED: visual rhythm - ${consecutiveHighlights} consecutive highlights before)`);
      return 'neutral';
    }
    
    // ✅ BALANCED APPROACH: Allow some consecutive highlights but with priority check
    if (previousWasHighlighted) {
      const currentPriority = CONVERSION_CRITICAL_SECTIONS[sectionId]?.priority || 'low';
      const previousPriority = previousSection ? CONVERSION_CRITICAL_SECTIONS[previousSection]?.priority || 'low' : 'low';
      
      // Only allow consecutive highlights if current is HIGH priority
      if (currentPriority === 'high') {
        logger.debug(`🎯 ${sectionId} → SECONDARY (conversion-critical HIGH priority, allowing consecutive)`);
        return 'secondary';
      } else {
        // Medium/low priority sections get visual break after highlight
        logger.debug(`🎯 ${sectionId} → NEUTRAL (conversion-critical but visual rhythm enforced)`);
        return 'neutral';
      }
    }
    
    // Previous section was not highlighted, safe to highlight this one
    logger.debug(`🎯 ${sectionId} → SECONDARY (conversion-critical, clear to highlight)`);
    return 'secondary';
  }
  
  // ===== RULE 3: VISUAL RHYTHM (Supporting sections) =====
  
  if (sectionCriticality === 'supporting') {
    const previousSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
    
    if (previousSection) {
      const previousCriticality = getSectionCriticality(previousSection, userProfileTags);
      const previousWasHighlighted = 
        previousSection.includes('hero') || 
        previousSection.includes('cta') ||
        previousCriticality === 'conversion-critical';
      
      if (previousWasHighlighted) {
        logger.debug(`🎯 ${sectionId} → NEUTRAL (supporting section, visual break after highlight)`);
        return 'neutral';
      }
    }
    
    // Previous was not highlighted, this supporting section could be secondary for variety
    // But let's default to neutral to maintain clean visual rhythm
    logger.debug(`🎯 ${sectionId} → NEUTRAL (supporting section, maintain rhythm)`);
    return 'neutral';
  }
  
  // ===== FALLBACK =====
  logger.debug(`🎯 ${sectionId} → NEUTRAL (fallback)`);
  return 'neutral';
}

// ===== SECTION BACKGROUND ASSIGNMENT FOR ENTIRE PAGE =====
// ✅ FIXED: Two-pass algorithm for proper consecutive tracking
export function assignMixedBackgroundsToSections(
  sections: string[], 
  userProfile: UserProfile
): Record<string, SectionBackgroundType> {
  
  logger.debug('🎨 Assigning mixed backgrounds to all sections...');
  logger.debug('Sections to process:', sections);
  logger.debug('User profile:', userProfile);
  
  const backgroundAssignments: Record<string, SectionBackgroundType> = {};
  const userProfileTags = analyzeUserProfile(userProfile);
  
  // ✅ PASS 1: Assign backgrounds with proper consecutive tracking
  sections.forEach((sectionId, index) => {
    logger.debug(`\n🔄 Processing section ${index + 1}/${sections.length}: ${sectionId}`);
    
    const sectionCriticality = getSectionCriticality(sectionId, userProfileTags);
    logger.debug(`📊 Section "${sectionId}" criticality: ${sectionCriticality}`);
    
    // ===== RULE 1: INTRINSIC OVERRIDES =====
    if (sectionId.includes('hero')) {
      backgroundAssignments[sectionId] = 'primary';
      logger.debug(`🎯 ${sectionId} → PRIMARY (hero section override)`);
      return;
    }
    
    if (sectionId.includes('cta')) {
      backgroundAssignments[sectionId] = 'primary';
      logger.debug(`🎯 ${sectionId} → PRIMARY (CTA section override)`);
      return;
    }
    
    if (sectionCriticality === 'separator') {
      backgroundAssignments[sectionId] = 'divider';
      logger.debug(`🎯 ${sectionId} → DIVIDER (separator section)`);
      return;
    }
    
    // ===== RULE 2: CHECK ACTUAL CONSECUTIVE HIGHLIGHTS =====
    
    // Look at ACTUAL assignments made so far
    const recentAssignments = sections.slice(Math.max(0, index - 2), index).map(s => ({
      section: s,
      background: backgroundAssignments[s]
    }));
    
    logger.debug('📊 Recent assignments:', recentAssignments);
    
    let consecutiveHighlights = 0;
    for (let i = recentAssignments.length - 1; i >= 0; i--) {
      const assignment = recentAssignments[i];
      if (assignment.background && ['primary', 'secondary'].includes(assignment.background)) {
        consecutiveHighlights++;
      } else {
        break; // Stop counting at first non-highlight
      }
    }
    
    logger.debug(`📊 Consecutive highlights before ${sectionId}: ${consecutiveHighlights}`);
    
    // ===== RULE 3: VISUAL RHYTHM ENFORCEMENT =====
    
    if (consecutiveHighlights >= 2) {
      backgroundAssignments[sectionId] = 'neutral';
      logger.debug(`🎯 ${sectionId} → NEUTRAL (FORCED: ${consecutiveHighlights} consecutive highlights - visual rhythm enforced)`);
      return;
    }
    
    // ===== RULE 4: CONVERSION-CRITICAL WITH LIMITED CONSECUTIVE =====
    
    if (sectionCriticality === 'conversion-critical') {
      const currentPriority = CONVERSION_CRITICAL_SECTIONS[sectionId]?.priority || 'low';
      
      if (consecutiveHighlights === 1 && currentPriority !== 'high') {
        // Medium/low priority sections give way to visual rhythm after 1 consecutive
        backgroundAssignments[sectionId] = 'neutral';
        logger.debug(`🎯 ${sectionId} → NEUTRAL (conversion-critical but ${currentPriority} priority, visual rhythm enforced)`);
        return;
      }
      
      // Can be highlighted
      backgroundAssignments[sectionId] = 'secondary';
      logger.debug(`🎯 ${sectionId} → SECONDARY (conversion-critical, ${currentPriority} priority)`);
      return;
    }
    
    // ===== RULE 5: SUPPORTING SECTIONS =====
    
    if (consecutiveHighlights >= 1) {
      backgroundAssignments[sectionId] = 'neutral';
      logger.debug(`🎯 ${sectionId} → NEUTRAL (supporting section, visual break after ${consecutiveHighlights} highlights)`);
      return;
    }
    
    // Default for supporting sections when no recent highlights
    backgroundAssignments[sectionId] = 'neutral';
    logger.debug(`🎯 ${sectionId} → NEUTRAL (supporting section, default)`);
  });
  
  // Log the final pattern for review
  const pattern = sections.map(section => 
    `${section}(${backgroundAssignments[section]})`
  ).join(' → ');
  
  logger.debug('\n🎨 Final background pattern:', pattern);
  
  // Validate visual rhythm
  validateVisualRhythm(sections, backgroundAssignments);
  
  return backgroundAssignments;
}

// ===== VISUAL RHYTHM VALIDATION =====
function validateVisualRhythm(
  sections: string[], 
  assignments: Record<string, SectionBackgroundType>
): void {
  
  logger.debug('🔍 Validating visual rhythm...');
  
  let consecutiveHighlights = 0;
  let maxConsecutive = 0;
  let violations: string[] = [];
  let pattern: string[] = [];
  
  sections.forEach((section, index) => {
    const backgroundType = assignments[section];
    const isHighlighted = ['primary', 'secondary'].includes(backgroundType);
    
    // Track pattern for visualization
    pattern.push(`${section}(${backgroundType})`);
    
    if (isHighlighted) {
      consecutiveHighlights++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveHighlights);
      
      // ✅ STRICT RULE: No more than 2 consecutive highlights
      if (consecutiveHighlights > 2) {
        violations.push(`${section} (${consecutiveHighlights} consecutive highlights)`);
      }
    } else {
      consecutiveHighlights = 0;
    }
  });
  
  // Log the complete visual pattern
  logger.debug('🎨 Visual pattern:', pattern.join(' → '));
  
  if (violations.length > 0) {
    logger.warn('⚠️ Visual rhythm violations detected:', violations);
    logger.warn('💡 Consider increasing visual breaks between highlighted sections');
  } else {
    logger.debug('✅ Visual rhythm validation passed - good visual breathing');
  }
  
  // ✅ ENHANCED METRICS
  const highlightCount = sections.filter(s => ['primary', 'secondary'].includes(assignments[s])).length;
  const neutralCount = sections.filter(s => assignments[s] === 'neutral').length;
  const dividerCount = sections.filter(s => assignments[s] === 'divider').length;
  const highlightRatioPercent = Math.round((highlightCount / sections.length) * 100);
  
  logger.debug(`📊 Background distribution:`, {
    highlights: highlightCount,
    neutrals: neutralCount,
    dividers: dividerCount,
    maxConsecutive,
    totalSections: sections.length,
    highlightRatio: highlightRatioPercent + '%'
  });
  
  // ✅ RECOMMENDATIONS
  if (highlightRatioPercent > 70) {
    logger.warn('💡 Recommendation: Too many highlights (>70%). Consider making some sections neutral for better visual hierarchy.');
  }
  
  if (maxConsecutive > 2) {
    logger.warn('💡 Recommendation: Break up consecutive highlights with neutral sections for better readability.');
  }
}

// ===== INTEGRATION FUNCTION FOR EXISTING BACKGROUND SYSTEM =====
export function updateBackgroundIntegrationWithMixedLogic() {
  logger.debug('🔄 Mixed background logic is ready for integration');
  logger.debug('To integrate: Replace getSectionBackgroundTypeWithContext calls with getMixedSectionBackground');
}