

interface ParsedResponse {
  success: boolean
  content: Record<string, any>
  isPartial: boolean
  warnings: string[]
  errors: string[]
}

interface SectionContent {
  [key: string]: string | string[]
}

/**
 * Parses and validates AI response for landing page copy generation
 */
export function parseAiResponse(aiContent: string): ParsedResponse {
  const result: ParsedResponse = {
    success: false,
    content: {},
    isPartial: false,
    warnings: [],
    errors: []
  }

  try {
    // Extract JSON from AI response (handle potential markdown code blocks)
    const jsonContent = extractJSON(aiContent)
    if (!jsonContent) {
      result.errors.push("No valid JSON found in AI response")
      return result
    }

    const parsedContent = JSON.parse(jsonContent)
    
    // Validate structure
    const validation = validateContent(parsedContent)
    result.content = validation.content
    result.warnings = validation.warnings
    result.errors = validation.errors
    result.isPartial = validation.isPartial
    result.success = validation.errors.length === 0

    return result

  } catch (error) {
    result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Extracts JSON from AI response, handling markdown code blocks
 */
function extractJSON(content: string): string | null {
  // Remove potential markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
  const codeBlockMatch = content.match(codeBlockRegex)
  
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Try to find JSON object directly
  const jsonRegex = /\{[\s\S]*\}/
  const jsonMatch = content.match(jsonRegex)
  
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return null
}

/**
 * Validates and cleans the parsed content
 */
function validateContent(content: any): {
  content: Record<string, any>;
  warnings: string[];
  errors: string[];
  isPartial: boolean;
} {
  const validation = {
    content: {} as Record<string, any>,
    warnings: [] as string[],
    errors: [] as string[],
    isPartial: false
  }

  if (!content || typeof content !== 'object') {
    validation.errors.push("Content must be an object")
    return validation
  }

  // Required sections - removed hardcoded requirement
  // Different pages might have different sections based on business rules
  const availableSections = Object.keys(content)
  
  // Only warn if no sections at all
  if (availableSections.length === 0) {
    validation.errors.push('No sections found in content')
    validation.isPartial = true
  }

  // Process each section
  Object.entries(content).forEach(([sectionId, sectionContent]) => {
    if (!sectionContent || typeof sectionContent !== 'object') {
      validation.warnings.push(`Section ${sectionId} has invalid format`)
      validation.isPartial = true
      return
    }

    const processedSection = processSectionContent(sectionId, sectionContent as SectionContent)
    
    if (processedSection.hasIssues) {
      validation.warnings.push(...processedSection.warnings)
      validation.isPartial = true
    }

    validation.content[sectionId] = processedSection.content
  })

  return validation
}

/**
 * Processes and validates individual section content
 */
function processSectionContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Special handling for Hero sections
  if (sectionId.includes('Hero') ||
      ['leftCopyRightImage', 'centerStacked', 'splitScreen', 'imageFirst'].some(layout => sectionId.includes(layout))) {
    const processedHero = processHeroContent(sectionId, content);
    result.content = processedHero.content;
    result.warnings = processedHero.warnings;
    result.hasIssues = processedHero.hasIssues;
    return result;
  }

  // Special handling for FAQ sections
  if (sectionId.includes('InlineQnAList')) {
    const processedInlineQnA = processInlineQnAListContent(sectionId, content);
    result.content = processedInlineQnA.content;
    result.warnings = processedInlineQnA.warnings;
    result.hasIssues = processedInlineQnA.hasIssues;
    return result;
  }

  if (sectionId.includes('AccordionFAQ')) {
    const processedAccordion = processAccordionFAQContent(sectionId, content);
    result.content = processedAccordion.content;
    result.warnings = processedAccordion.warnings;
    result.hasIssues = processedAccordion.hasIssues;
    return result;
  }

  if (sectionId.includes('TwoColumnFAQ')) {
    const processedTwoColumn = processTwoColumnFAQContent(sectionId, content);
    result.content = processedTwoColumn.content;
    result.warnings = processedTwoColumn.warnings;
    result.hasIssues = processedTwoColumn.hasIssues;
    return result;
  }

  if (sectionId.includes('SegmentedFAQTabs')) {
    const processedSegmented = processSegmentedFAQTabsContent(sectionId, content);
    result.content = processedSegmented.content;
    result.warnings = processedSegmented.warnings;
    result.hasIssues = processedSegmented.hasIssues;
    return result;
  }

  if (sectionId.includes('QuoteStyleAnswers')) {
    const processedQuote = processQuoteStyleAnswersContent(sectionId, content);
    result.content = processedQuote.content;
    result.warnings = processedQuote.warnings;
    result.hasIssues = processedQuote.hasIssues;
    return result;
  }

  if (sectionId.includes('IconWithAnswers')) {
    const processedIcon = processIconWithAnswersContent(sectionId, content);
    result.content = processedIcon.content;
    result.warnings = processedIcon.warnings;
    result.hasIssues = processedIcon.hasIssues;
    return result;
  }

  if (sectionId.includes('TestimonialFAQs')) {
    const processedTestimonial = processTestimonialFAQsContent(sectionId, content);
    result.content = processedTestimonial.content;
    result.warnings = processedTestimonial.warnings;
    result.hasIssues = processedTestimonial.hasIssues;
    return result;
  }

  if (sectionId.includes('ChatBubbleFAQ')) {
    const processedChat = processChatBubbleFAQContent(sectionId, content);
    result.content = processedChat.content;
    result.warnings = processedChat.warnings;
    result.hasIssues = processedChat.hasIssues;
    return result;
  }

  // Special handling for BeforeAfterSlider sections
  if (sectionId.includes('BeforeAfterSlider')) {
    const processedBeforeAfter = processBeforeAfterSliderContent(sectionId, content);
    result.content = processedBeforeAfter.content;
    result.warnings = processedBeforeAfter.warnings;
    result.hasIssues = processedBeforeAfter.hasIssues;
    return result;
  }

  // Special handling for SideBySideBlocks sections
  if (sectionId.includes('SideBySideBlocks')) {
    const processedSideBySide = processSideBySideBlocksContent(sectionId, content);
    result.content = processedSideBySide.content;
    result.warnings = processedSideBySide.warnings;
    result.hasIssues = processedSideBySide.hasIssues;
    return result;
  }

  // Special handling for TextListTransformation sections
  if (sectionId.includes('TextListTransformation')) {
    const processedTextList = processTextListTransformationContent(sectionId, content);
    result.content = processedTextList.content;
    result.warnings = processedTextList.warnings;
    result.hasIssues = processedTextList.hasIssues;
    return result;
  }

  // Special handling for remaining BeforeAfter sections
  if (sectionId.includes('StatComparison') || sectionId.includes('StackedTextVisual') ||
      sectionId.includes('VisualStoryline') || sectionId.includes('PersonaJourney') ||
      sectionId.includes('SplitCard')) {
    const processedGeneric = processBeforeAfterGenericContent(sectionId, content);
    result.content = processedGeneric.content;
    result.warnings = processedGeneric.warnings;
    result.hasIssues = processedGeneric.hasIssues;
    return result;
  }

  // Special handling for HowItWorks sections
  if (sectionId.includes('ThreeStepHorizontal')) {
    const processedThreeStep = processThreeStepHorizontalContent(sectionId, content);
    result.content = processedThreeStep.content;
    result.warnings = processedThreeStep.warnings;
    result.hasIssues = processedThreeStep.hasIssues;
    return result;
  }

  if (sectionId.includes('VerticalTimeline')) {
    const processedVerticalTimeline = processVerticalTimelineContent(sectionId, content);
    result.content = processedVerticalTimeline.content;
    result.warnings = processedVerticalTimeline.warnings;
    result.hasIssues = processedVerticalTimeline.hasIssues;
    return result;
  }

  if (sectionId.includes('IconCircleSteps')) {
    const processedIconCircle = processIconCircleStepsContent(sectionId, content);
    result.content = processedIconCircle.content;
    result.warnings = processedIconCircle.warnings;
    result.hasIssues = processedIconCircle.hasIssues;
    return result;
  }

  if (sectionId.includes('AccordionSteps')) {
    const processedAccordionSteps = processAccordionStepsContent(sectionId, content);
    result.content = processedAccordionSteps.content;
    result.warnings = processedAccordionSteps.warnings;
    result.hasIssues = processedAccordionSteps.hasIssues;
    return result;
  }

  if (sectionId.includes('CardFlipSteps')) {
    const processedCardFlip = processCardFlipStepsContent(sectionId, content);
    result.content = processedCardFlip.content;
    result.warnings = processedCardFlip.warnings;
    result.hasIssues = processedCardFlip.hasIssues;
    return result;
  }

  if (sectionId.includes('VideoWalkthrough')) {
    const processedVideoWalkthrough = processVideoWalkthroughContent(sectionId, content);
    result.content = processedVideoWalkthrough.content;
    result.warnings = processedVideoWalkthrough.warnings;
    result.hasIssues = processedVideoWalkthrough.hasIssues;
    return result;
  }

  if (sectionId.includes('ZigzagImageSteps')) {
    const processedZigzagImage = processZigzagImageStepsContent(sectionId, content);
    result.content = processedZigzagImage.content;
    result.warnings = processedZigzagImage.warnings;
    result.hasIssues = processedZigzagImage.hasIssues;
    return result;
  }

  if (sectionId.includes('AnimatedProcessLine')) {
    const processedAnimatedProcess = processAnimatedProcessLineContent(sectionId, content);
    result.content = processedAnimatedProcess.content;
    result.warnings = processedAnimatedProcess.warnings;
    result.hasIssues = processedAnimatedProcess.hasIssues;
    return result;
  }

  // Special handling for EmojiOutcomeGrid sections
  if (sectionId.includes('EmojiOutcomeGrid')) {
    const processedEmojiGrid = processEmojiOutcomeGridContent(sectionId, content);
    result.content = processedEmojiGrid.content;
    result.warnings = processedEmojiGrid.warnings;
    result.hasIssues = processedEmojiGrid.hasIssues;
    return result;
  }

  // Special handling for Pricing sections
  if (sectionId.includes('TierCards')) {
    const processedTierCards = processTierCardsContent(sectionId, content);
    result.content = processedTierCards.content;
    result.warnings = processedTierCards.warnings;
    result.hasIssues = processedTierCards.hasIssues;
    return result;
  }

  if (sectionId.includes('ToggleableMonthlyYearly')) {
    const processedToggleableMonthlyYearly = processToggleableMonthlyYearlyContent(sectionId, content);
    result.content = processedToggleableMonthlyYearly.content;
    result.warnings = processedToggleableMonthlyYearly.warnings;
    result.hasIssues = processedToggleableMonthlyYearly.hasIssues;
    return result;
  }

  if (sectionId.includes('FeatureMatrix')) {
    const processedFeatureMatrix = processFeatureMatrixContent(sectionId, content);
    result.content = processedFeatureMatrix.content;
    result.warnings = processedFeatureMatrix.warnings;
    result.hasIssues = processedFeatureMatrix.hasIssues;
    return result;
  }

  if (sectionId.includes('SegmentBasedPricing')) {
    const processedSegmentBasedPricing = processSegmentBasedPricingContent(sectionId, content);
    result.content = processedSegmentBasedPricing.content;
    result.warnings = processedSegmentBasedPricing.warnings;
    result.hasIssues = processedSegmentBasedPricing.hasIssues;
    return result;
  }

  if (sectionId.includes('SliderPricing')) {
    const processedSliderPricing = processSliderPricingContent(sectionId, content);
    result.content = processedSliderPricing.content;
    result.warnings = processedSliderPricing.warnings;
    result.hasIssues = processedSliderPricing.hasIssues;
    return result;
  }

  if (sectionId.includes('CallToQuotePlan')) {
    const processedCallToQuotePlan = processCallToQuotePlanContent(sectionId, content);
    result.content = processedCallToQuotePlan.content;
    result.warnings = processedCallToQuotePlan.warnings;
    result.hasIssues = processedCallToQuotePlan.hasIssues;
    return result;
  }

  if (sectionId.includes('CardWithTestimonial')) {
    const processedCardWithTestimonial = processCardWithTestimonialContent(sectionId, content);
    result.content = processedCardWithTestimonial.content;
    result.warnings = processedCardWithTestimonial.warnings;
    result.hasIssues = processedCardWithTestimonial.hasIssues;
    return result;
  }

  if (sectionId.includes('MiniStackedCards')) {
    const processedMiniStackedCards = processMiniStackedCardsContent(sectionId, content);
    result.content = processedMiniStackedCards.content;
    result.warnings = processedMiniStackedCards.warnings;
    result.hasIssues = processedMiniStackedCards.hasIssues;
    return result;
  }

  // Special handling for Problem sections
  if (sectionId.includes('StackedPainBullets')) {
    const processedStackedPain = processStackedPainBulletsContent(sectionId, content);
    result.content = processedStackedPain.content;
    result.warnings = processedStackedPain.warnings;
    result.hasIssues = processedStackedPain.hasIssues;
    return result;
  }

  if (sectionId.includes('BeforeImageAfterText')) {
    const processedBeforeImageAfter = processBeforeImageAfterTextContent(sectionId, content);
    result.content = processedBeforeImageAfter.content;
    result.warnings = processedBeforeImageAfter.warnings;
    result.hasIssues = processedBeforeImageAfter.hasIssues;
    return result;
  }

  if (sectionId.includes('SideBySideSplit')) {
    const processedSideBySideSplit = processSideBySideSplitContent(sectionId, content);
    result.content = processedSideBySideSplit.content;
    result.warnings = processedSideBySideSplit.warnings;
    result.hasIssues = processedSideBySideSplit.hasIssues;
    return result;
  }

  if (sectionId.includes('EmotionalQuotes')) {
    const processedEmotionalQuotes = processEmotionalQuotesContent(sectionId, content);
    result.content = processedEmotionalQuotes.content;
    result.warnings = processedEmotionalQuotes.warnings;
    result.hasIssues = processedEmotionalQuotes.hasIssues;
    return result;
  }

  if (sectionId.includes('CollapsedCards')) {
    const processedCollapsedCards = processCollapsedCardsContent(sectionId, content);
    result.content = processedCollapsedCards.content;
    result.warnings = processedCollapsedCards.warnings;
    result.hasIssues = processedCollapsedCards.hasIssues;
    return result;
  }

  if (sectionId.includes('PainMeterChart')) {
    const processedPainMeter = processPainMeterChartContent(sectionId, content);
    result.content = processedPainMeter.content;
    result.warnings = processedPainMeter.warnings;
    result.hasIssues = processedPainMeter.hasIssues;
    return result;
  }

  if (sectionId.includes('PersonaPanels')) {
    const processedPersonaPanels = processPersonaPanelsContent(sectionId, content);
    result.content = processedPersonaPanels.content;
    result.warnings = processedPersonaPanels.warnings;
    result.hasIssues = processedPersonaPanels.hasIssues;
    return result;
  }

  if (sectionId.includes('ProblemChecklist')) {
    const processedProblemChecklist = processProblemChecklistContent(sectionId, content);
    result.content = processedProblemChecklist.content;
    result.warnings = processedProblemChecklist.warnings;
    result.hasIssues = processedProblemChecklist.hasIssues;
    return result;
  }

  // Special handling for FounderNote sections
  if (sectionId.includes('FoundersBeliefStack')) {
    const processedFoundersBeliefStack = processFoundersBeliefStackContent(sectionId, content);
    result.content = processedFoundersBeliefStack.content;
    result.warnings = processedFoundersBeliefStack.warnings;
    result.hasIssues = processedFoundersBeliefStack.hasIssues;
    return result;
  }

  if (sectionId.includes('LetterStyleBlock')) {
    const processedLetterStyle = processLetterStyleBlockContent(sectionId, content);
    result.content = processedLetterStyle.content;
    result.warnings = processedLetterStyle.warnings;
    result.hasIssues = processedLetterStyle.hasIssues;
    return result;
  }

  if (sectionId.includes('VideoNoteWithTranscript')) {
    const processedVideoNote = processVideoNoteWithTranscriptContent(sectionId, content);
    result.content = processedVideoNote.content;
    result.warnings = processedVideoNote.warnings;
    result.hasIssues = processedVideoNote.hasIssues;
    return result;
  }

  if (sectionId.includes('MissionQuoteOverlay')) {
    const processedMissionQuote = processMissionQuoteOverlayContent(sectionId, content);
    result.content = processedMissionQuote.content;
    result.warnings = processedMissionQuote.warnings;
    result.hasIssues = processedMissionQuote.hasIssues;
    return result;
  }

  if (sectionId.includes('TimelineToToday')) {
    const processedTimelineToToday = processTimelineTodayContent(sectionId, content);
    result.content = processedTimelineToToday.content;
    result.warnings = processedTimelineToToday.warnings;
    result.hasIssues = processedTimelineToToday.hasIssues;
    return result;
  }

  if (sectionId.includes('SideBySidePhotoStory')) {
    const processedSideBySidePhotoStory = processSideBySidePhotoStoryContent(sectionId, content);
    result.content = processedSideBySidePhotoStory.content;
    result.warnings = processedSideBySidePhotoStory.warnings;
    result.hasIssues = processedSideBySidePhotoStory.hasIssues;
    return result;
  }

  if (sectionId.includes('StoryBlockWithPullquote')) {
    const processedStoryBlock = processStoryBlockWithPullquoteContent(sectionId, content);
    result.content = processedStoryBlock.content;
    result.warnings = processedStoryBlock.warnings;
    result.hasIssues = processedStoryBlock.hasIssues;
    return result;
  }

  if (sectionId.includes('FounderCardWithQuote')) {
    const processedFounderCard = processFounderCardWithQuoteContent(sectionId, content);
    result.content = processedFounderCard.content;
    result.warnings = processedFounderCard.warnings;
    result.hasIssues = processedFounderCard.hasIssues;
    return result;
  }

  // Special handling for UniqueMechanism sections
  if (sectionId.includes('AlgorithmExplainer')) {
    const processedAlgorithm = processAlgorithmExplainerContent(sectionId, content);
    result.content = processedAlgorithm.content;
    result.warnings = processedAlgorithm.warnings;
    result.hasIssues = processedAlgorithm.hasIssues;
    return result;
  }

  if (sectionId.includes('InnovationTimeline')) {
    const processedTimeline = processInnovationTimelineContent(sectionId, content);
    result.content = processedTimeline.content;
    result.warnings = processedTimeline.warnings;
    result.hasIssues = processedTimeline.hasIssues;
    return result;
  }

  if (sectionId.includes('MethodologyBreakdown')) {
    const processedMethodology = processMethodologyBreakdownContent(sectionId, content);
    result.content = processedMethodology.content;
    result.warnings = processedMethodology.warnings;
    result.hasIssues = processedMethodology.hasIssues;
    return result;
  }

  if (sectionId.includes('ProcessFlowDiagram')) {
    const processedFlow = processProcessFlowDiagramContent(sectionId, content);
    result.content = processedFlow.content;
    result.warnings = processedFlow.warnings;
    result.hasIssues = processedFlow.hasIssues;
    return result;
  }

  if (sectionId.includes('PropertyComparisonMatrix')) {
    const processedMatrix = processPropertyComparisonMatrixContent(sectionId, content);
    result.content = processedMatrix.content;
    result.warnings = processedMatrix.warnings;
    result.hasIssues = processedMatrix.hasIssues;
    return result;
  }

  if (sectionId.includes('SecretSauceReveal')) {
    const processedSecret = processSecretSauceRevealContent(sectionId, content);
    result.content = processedSecret.content;
    result.warnings = processedSecret.warnings;
    result.hasIssues = processedSecret.hasIssues;
    return result;
  }

  if (sectionId.includes('StackedHighlights')) {
    const processedHighlights = processStackedHighlightsContent(sectionId, content);
    result.content = processedHighlights.content;
    result.warnings = processedHighlights.warnings;
    result.hasIssues = processedHighlights.hasIssues;
    return result;
  }

  if (sectionId.includes('SystemArchitecture')) {
    const processedArchitecture = processSystemArchitectureContent(sectionId, content);
    result.content = processedArchitecture.content;
    result.warnings = processedArchitecture.warnings;
    result.hasIssues = processedArchitecture.hasIssues;
    return result;
  }

  if (sectionId.includes('TechnicalAdvantage')) {
    const processedAdvantage = processTechnicalAdvantageContent(sectionId, content);
    result.content = processedAdvantage.content;
    result.warnings = processedAdvantage.warnings;
    result.hasIssues = processedAdvantage.hasIssues;
    return result;
  }

  // Special handling for PrimaryCTA sections
  if (sectionId.includes('CenteredHeadlineCTA')) {
    const processedCTA = processCenteredHeadlineCTAContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('CTAWithBadgeRow')) {
    const processedCTA = processCTAWithBadgeRowContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('VisualCTAWithMockup')) {
    const processedCTA = processVisualCTAWithMockupContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('SideBySideCTA')) {
    const processedCTA = processSideBySideCTAContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('CountdownLimitedCTA')) {
    const processedCTA = processCountdownLimitedCTAContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('CTAWithFormField')) {
    const processedCTA = processCTAWithFormFieldContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('ValueStackCTA')) {
    const processedCTA = processValueStackCTAContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  if (sectionId.includes('TestimonialCTACombo')) {
    const processedCTA = processTestimonialCTAComboContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  // Special handling for Objection sections
  if (sectionId.includes('ObjectionAccordion')) {
    const processedObjection = processObjectionAccordionContent(sectionId, content);
    result.content = processedObjection.content;
    result.warnings = processedObjection.warnings;
    result.hasIssues = processedObjection.hasIssues;
    return result;
  }

  if (sectionId.includes('MythVsRealityGrid')) {
    const processedMyth = processMythVsRealityGridContent(sectionId, content);
    result.content = processedMyth.content;
    result.warnings = processedMyth.warnings;
    result.hasIssues = processedMyth.hasIssues;
    return result;
  }

  if (sectionId.includes('QuoteBackedAnswers')) {
    const processedQuoteBacked = processQuoteBackedAnswersContent(sectionId, content);
    result.content = processedQuoteBacked.content;
    result.warnings = processedQuoteBacked.warnings;
    result.hasIssues = processedQuoteBacked.hasIssues;
    return result;
  }

  if (sectionId.includes('SkepticToBelieverSteps')) {
    const processedSkeptic = processSkepticToBelieverStepsContent(sectionId, content);
    result.content = processedSkeptic.content;
    result.warnings = processedSkeptic.warnings;
    result.hasIssues = processedSkeptic.hasIssues;
    return result;
  }

  if (sectionId.includes('VisualObjectionTiles')) {
    const processedTiles = processVisualObjectionTilesContent(sectionId, content);
    result.content = processedTiles.content;
    result.warnings = processedTiles.warnings;
    result.hasIssues = processedTiles.hasIssues;
    return result;
  }

  if (sectionId.includes('ProblemToReframeBlocks')) {
    const processedReframe = processProblemToReframeBlocksContent(sectionId, content);
    result.content = processedReframe.content;
    result.warnings = processedReframe.warnings;
    result.hasIssues = processedReframe.hasIssues;
    return result;
  }

  if (sectionId.includes('BoldGuaranteePanel')) {
    const processedGuarantee = processBoldGuaranteePanelContent(sectionId, content);
    result.content = processedGuarantee.content;
    result.warnings = processedGuarantee.warnings;
    result.hasIssues = processedGuarantee.hasIssues;
    return result;
  }

  if (sectionId.includes('ObjectionCarousel')) {
    const processedCarousel = processObjectionCarouselContent(sectionId, content);
    result.content = processedCarousel.content;
    result.warnings = processedCarousel.warnings;
    result.hasIssues = processedCarousel.hasIssues;
    return result;
  }

  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue)

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value
    } else {
      result.warnings.push(...processedElement.warnings)
      result.hasIssues = true
      // Use fallback or empty value
      result.content[elementKey] = processedElement.fallback
    }
  })

  return result
}

/**
 * Determines if a field should contain pipe-separated data based on naming patterns
 */
function isPipeSeparatedField(elementKey: string): boolean {
  const pipeSeparatedPatterns = [
    'titles', 'descriptions', 'quotes', 'names',
    'items', 'labels', 'steps', 'list'
  ];
  return pipeSeparatedPatterns.some(pattern => elementKey.includes(pattern));
}

/**
 * Processes individual elements with validation
 */
function processElement(sectionId: string, elementKey: string, value: any): {
  isValid: boolean;
  value: string | string[];
  fallback: string | string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    value: value,
    fallback: getElementFallback(elementKey),
    warnings: [] as string[]
  };

  // Type validation
  if (typeof value !== 'string' && !Array.isArray(value)) {
    result.isValid = false
    result.warnings.push(`${sectionId}.${elementKey}: Expected string or array, got ${typeof value}`)
    return result
  }

  // Convert JSON arrays to pipe-separated strings for appropriate fields
  if (Array.isArray(value) && isPipeSeparatedField(elementKey)) {
    // Validate array items before conversion
    const invalidItems = value.filter(item => typeof item !== 'string' || !item.trim())
    if (invalidItems.length > 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Contains ${invalidItems.length} invalid items in array`)
      return result
    }

    // Convert to pipe-separated string
    result.value = value.join('|')
    // Continue validation as string
    value = result.value
  }

  // Convert stringified JSON arrays to pipe-separated strings for appropriate fields
  if (typeof value === 'string' && isPipeSeparatedField(elementKey)) {
    const trimmedValue = value.trim()
    // Check if string looks like JSON array: starts with [ and ends with ]
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      try {
        const parsedArray = JSON.parse(trimmedValue)
        if (Array.isArray(parsedArray)) {
          // Validate parsed array items
          const invalidItems = parsedArray.filter(item => typeof item !== 'string' || !item.trim())
          if (invalidItems.length > 0) {
            result.isValid = false
            result.warnings.push(`${sectionId}.${elementKey}: Stringified array contains ${invalidItems.length} invalid items`)
            return result
          }

          // Convert to pipe-separated string
          result.value = parsedArray.join('|')
          value = result.value
        }
      } catch (error) {
        // If JSON parsing fails, continue with string validation (fallback)
        result.warnings.push(`${sectionId}.${elementKey}: Failed to parse potential JSON array: ${trimmedValue}`)
      }
    }
  }

  // String validation
  if (typeof value === 'string') {
    if (!value.trim()) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Empty string`)
      return result
    }

    // Length validation
    const lengthValidation = validateStringLength(elementKey, value)
    if (!lengthValidation.isValid) {
      result.warnings.push(`${sectionId}.${elementKey}: ${lengthValidation.message}`)
      if (lengthValidation.severity === 'error') {
        result.isValid = false
        return result
      }
    }
  }

  // Array validation (for fields that should remain as arrays)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Empty array`)
      return result
    }

    const invalidItems = value.filter(item => typeof item !== 'string' || !item.trim())
    if (invalidItems.length > 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Contains ${invalidItems.length} invalid items`)
      return result
    }
  }

  return result
}

/**
 * Validates string length based on element type
 */
function validateStringLength(elementKey: string, value: string): {
  isValid: boolean;
  message: string;
  severity: 'warning' | 'error';
} {
  const lengthRules: Record<string, { min: number; max: number; severity: 'warning' | 'error' }> = {
    headline: { min: 10, max: 100, severity: 'warning' },
    subheadline: { min: 15, max: 150, severity: 'warning' },
    cta_text: { min: 5, max: 30, severity: 'error' },
    description: { min: 20, max: 300, severity: 'warning' },
    quote: { min: 20, max: 200, severity: 'warning' },
    // CTA-specific field rules
    urgency_text: { min: 10, max: 80, severity: 'warning' },
    scarcity_text: { min: 10, max: 100, severity: 'warning' },
    trust_item: { min: 5, max: 50, severity: 'warning' },
    form_label: { min: 5, max: 40, severity: 'warning' },
    placeholder_text: { min: 5, max: 60, severity: 'warning' },
    privacy_text: { min: 10, max: 150, severity: 'warning' },
    value_proposition: { min: 15, max: 120, severity: 'warning' },
    testimonial_quote: { min: 30, max: 400, severity: 'warning' },
    testimonial_author: { min: 3, max: 50, severity: 'error' },
    testimonial_company: { min: 2, max: 50, severity: 'error' },
    testimonial_title: { min: 5, max: 80, severity: 'warning' },
    case_study_tag: { min: 5, max: 30, severity: 'warning' },
    customer_count: { min: 2, max: 20, severity: 'warning' },
    average_rating: { min: 2, max: 10, severity: 'warning' },
    guarantee_text: { min: 10, max: 200, severity: 'warning' },
    countdown_label: { min: 5, max: 40, severity: 'warning' }
  }

  // Find matching rule (check for partial matches)
  let rule = lengthRules[elementKey]
  if (!rule) {
    for (const [key, ruleValue] of Object.entries(lengthRules)) {
      if (elementKey.includes(key)) {
        rule = ruleValue
        break
      }
    }
  }

  // Default rule if no specific rule found
  if (!rule) {
    rule = { min: 1, max: 500, severity: 'warning' }
  }

  const length = value.trim().length

  if (length < rule.min) {
    return {
      isValid: false,
      message: `Too short (${length} chars, min ${rule.min})`,
      severity: rule.severity
    }
  }

  if (length > rule.max) {
    return {
      isValid: false,
      message: `Too long (${length} chars, max ${rule.max})`,
      severity: rule.severity
    }
  }

  return { isValid: true, message: '', severity: 'warning' }
}

/**
 * Provides fallback content for elements
 */
function getElementFallback(elementKey: string): string | string[] {
  const fallbacks: Record<string, string | string[]> = {
    headline: "Transform Your Business Today",
    subheadline: "Join thousands of companies already seeing results",
    cta_text: "Get Started",
    description: "Discover how our solution can help you achieve your goals",
    quote: "This solution changed everything for our business",

    // CTA-specific fallbacks
    urgency_text: "Limited time offer - Act now!",
    scarcity_text: "Only 50 spots remaining",
    trust_item_1: "Secure & encrypted",
    trust_item_2: "GDPR compliant",
    trust_item_3: "24/7 support",
    form_label: "Work Email",
    placeholder_text: "Enter your email address",
    privacy_text: "We respect your privacy. Unsubscribe at any time.",
    value_proposition: "Get more done in less time with powerful automation",
    testimonial_quote: "This platform transformed our workflow and increased our productivity by 300%.",
    testimonial_author: "Sarah Johnson",
    testimonial_company: "TechCorp Inc.",
    testimonial_title: "Head of Operations",
    case_study_tag: "Success Story",
    customer_count: "10,000+",
    average_rating: "4.9/5",
    guarantee_text: "30-day money-back guarantee",
    countdown_label: "Sale ends in:",
    availability_text: "Only 3 spots left at this price",
    bonus_text: "Plus get free premium support",
    supporting_text: "Trusted by industry leaders worldwide",
    secondary_cta: "Learn More",

    // Array fallbacks
    feature_titles: ["Feature 1", "Feature 2", "Feature 3"],
    feature_descriptions: ["Benefit description 1", "Benefit description 2", "Benefit description 3"],
    testimonial_quotes: ["Great product!", "Highly recommended", "Best investment we made"],
    questions: ["How does it work?", "Is it secure?", "What's included?"],
    answers: ["It works seamlessly", "Yes, enterprise-grade security", "Everything you need"],
    benefits: ["Free 14-day trial", "No credit card required", "Cancel anytime"],
    trust_badges: ["SOC 2 Certified", "GDPR Compliant", "SSL Secured"],
    value_propositions: ["Save 10+ hours weekly", "Increase productivity by 200%", "Reduce errors by 95%"],
    value_descriptions: ["Automate repetitive tasks", "Streamline your workflow", "Focus on what matters most"]
  }

  // Check for exact match
  if (fallbacks[elementKey]) {
    return fallbacks[elementKey];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(fallbacks)) {
    if (elementKey.includes(key)) {
      return value;
    }
  }

  // Determine if should be array or string based on element name
  const arrayIndicators = ['titles', 'descriptions', 'quotes', 'questions', 'answers', 'items', 'list']
  const shouldBeArray = arrayIndicators.some(indicator => elementKey.includes(indicator))

  return shouldBeArray ? ["Default content"] : "Default content";
}

/**
 * Special processing for InlineQnAList sections to handle dual format support
 */
function processInlineQnAListContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check if content uses legacy pipe-separated format
  const hasLegacyFormat = content.questions && content.answers;
  const hasIndividualFields = Object.keys(content).some(key =>
    key.startsWith('question_') || key.startsWith('answer_')
  );

  // Process legacy format and convert to individual fields if needed
  if (hasLegacyFormat && !hasIndividualFields) {
    const convertedContent = convertLegacyToIndividualFields(content);
    result.warnings.push(`${sectionId}: Converted legacy pipe-separated format to individual Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate Q&A pairs consistency
  const pairValidation = validateQnAPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Converts legacy pipe-separated format to individual Q&A fields
 */
function convertLegacyToIndividualFields(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);

    // Convert up to 6 Q&A pairs
    const maxPairs = Math.min(questions.length, answers.length, 6);

    for (let i = 0; i < maxPairs; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`answer_${i + 1}`] = answers[i] || '';
    }
  }

  return converted;
}

/**
 * Validates Q&A pairs for consistency
 */
function validateQnAPairs(content: SectionContent): {
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for orphaned questions or answers
  for (let i = 1; i <= 6; i++) {
    const question = content[`question_${i}`];
    const answer = content[`answer_${i}`];

    if (question && !answer) {
      warnings.push(`Question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Answer ${i} has no corresponding question`);
    }
  }

  return { warnings };
}

/**
 * Special processing for Hero sections
 */
function processHeroContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Handle trust items - support both individual fields and legacy pipe-separated format
  const hasTrustItems = content.trust_items;
  const hasIndividualTrustItems = Object.keys(content).some(key => key.startsWith('trust_item_'));

  if (hasTrustItems && !hasIndividualTrustItems) {
    // Convert pipe-separated trust_items to individual fields
    if (typeof content.trust_items === 'string') {
      const trustItems = content.trust_items.split('|').map(item => item.trim()).filter(Boolean);
      trustItems.forEach((item, index) => {
        if (index < 5) {
          result.content[`trust_item_${index + 1}`] = item;
        }
      });
      // Keep the legacy format as well for backward compatibility
      result.content.trust_items = content.trust_items;
      result.warnings.push(`${sectionId}: Converted trust_items to individual fields`);
    }
  }

  // Validate social proof fields
  if (content.rating_value && typeof content.rating_value === 'string') {
    // Ensure rating format is valid (e.g., "4.9/5" or "4.9")
    if (!content.rating_value.match(/^\d+(\.\d+)?(\/\d+)?$/)) {
      result.warnings.push(`${sectionId}: rating_value should be in format "4.9/5" or "4.9"`);
      result.hasIssues = true;
    }
  }

  if (content.customer_names && typeof content.customer_names === 'string') {
    // Validate pipe-separated customer names
    const names = content.customer_names.split('|');
    if (names.length > 6) {
      result.warnings.push(`${sectionId}: customer_names should have max 6 names`);
      content.customer_names = names.slice(0, 6).join('|');
    }
  }

  // Process badge text - ensure it's not too long
  if (content.badge_text && typeof content.badge_text === 'string' && content.badge_text.length > 30) {
    result.warnings.push(`${sectionId}: badge_text should be concise (max 30 chars)`);
    result.hasIssues = true;
  }

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(processedElement.warnings?.[0] || `${sectionId}: Invalid value for ${elementKey}`);
      result.hasIssues = true;
    }
  });

  // Ensure required fields are present
  if (!result.content.headline) {
    result.warnings.push(`${sectionId}: Missing required field 'headline'`);
    result.hasIssues = true;
  }
  if (!result.content.cta_text) {
    result.warnings.push(`${sectionId}: Missing required field 'cta_text'`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for AccordionFAQ sections
 */
function processAccordionFAQContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format and convert
  const hasLegacyFormat = content.questions && content.answers;
  const hasIndividualFields = Object.keys(content).some(key =>
    key.startsWith('question_') || key.startsWith('answer_')
  );

  if (hasLegacyFormat && !hasIndividualFields) {
    const convertedContent = convertLegacyToIndividualFields(content);
    result.warnings.push(`${sectionId}: Converted legacy pipe-separated format to individual Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate Q&A pairs
  const pairValidation = validateQnAPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for TwoColumnFAQ sections
 */
function processTwoColumnFAQContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.answers;
  if (hasLegacyFormat) {
    const convertedContent = convertTwoColumnLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to two-column Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate left/right column Q&A pairs
  const columnValidation = validateTwoColumnQnAPairs(result.content);
  if (columnValidation.warnings.length > 0) {
    result.warnings.push(...columnValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for SegmentedFAQTabs sections
 */
function processSegmentedFAQTabsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.tab_labels || content.questions;
  if (hasLegacyFormat) {
    const convertedContent = convertSegmentedTabsLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to tab-specific Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate tab structure
  const tabValidation = validateTabQnAPairs(result.content);
  if (tabValidation.warnings.length > 0) {
    result.warnings.push(...tabValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for QuoteStyleAnswers sections
 */
function processQuoteStyleAnswersContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.quote_answers;
  if (hasLegacyFormat) {
    const convertedContent = convertQuoteStyleLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual quote Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate quote Q&A triads (question, quote_answer, attribution)
  const quoteValidation = validateQuoteQnATriads(result.content);
  if (quoteValidation.warnings.length > 0) {
    result.warnings.push(...quoteValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for IconWithAnswers sections
 */
function processIconWithAnswersContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.answers;
  if (hasLegacyFormat) {
    const convertedContent = convertIconFAQLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual icon Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate icon Q&A triads (question, answer, icon)
  const iconValidation = validateIconQnATriads(result.content);
  if (iconValidation.warnings.length > 0) {
    result.warnings.push(...iconValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for TestimonialFAQs sections
 */
function processTestimonialFAQsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.testimonial_answers;
  if (hasLegacyFormat) {
    const convertedContent = convertTestimonialFAQLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual testimonial Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate testimonial structure
  const testimonialValidation = validateTestimonialQnAStructure(result.content);
  if (testimonialValidation.warnings.length > 0) {
    result.warnings.push(...testimonialValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for ChatBubbleFAQ sections
 */
function processChatBubbleFAQContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.answers;
  if (hasLegacyFormat) {
    const convertedContent = convertChatBubbleLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual chat Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate chat conversation structure
  const chatValidation = validateChatQnAStructure(result.content);
  if (chatValidation.warnings.length > 0) {
    result.warnings.push(...chatValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

// Conversion and validation helper functions for FAQ layouts

/**
 * Converts two-column legacy format to individual fields
 */
function convertTwoColumnLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);

    // Split into left and right columns (3 items each)
    const leftQuestions = questions.slice(0, 3);
    const leftAnswers = answers.slice(0, 3);
    const rightQuestions = questions.slice(3, 6);
    const rightAnswers = answers.slice(3, 6);

    // Convert left column
    for (let i = 0; i < Math.min(leftQuestions.length, 3); i++) {
      converted[`left_question_${i + 1}`] = leftQuestions[i];
      converted[`left_answer_${i + 1}`] = leftAnswers[i] || '';
    }

    // Convert right column
    for (let i = 0; i < Math.min(rightQuestions.length, 3); i++) {
      converted[`right_question_${i + 1}`] = rightQuestions[i];
      converted[`right_answer_${i + 1}`] = rightAnswers[i] || '';
    }
  }

  return converted;
}

/**
 * Converts segmented tabs legacy format to individual fields
 */
function convertSegmentedTabsLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.tab_labels === 'string') {
    const labels = content.tab_labels.split('|').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(labels.length, 3); i++) {
      converted[`tab_${i + 1}_label`] = labels[i];
    }
  }

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);

    // Distribute Q&A across tabs (assume 3 questions per tab)
    const questionsPerTab = 3;
    for (let tab = 1; tab <= 3; tab++) {
      const startIdx = (tab - 1) * questionsPerTab;
      const tabQuestions = questions.slice(startIdx, startIdx + questionsPerTab);
      const tabAnswers = answers.slice(startIdx, startIdx + questionsPerTab);

      for (let i = 0; i < Math.min(tabQuestions.length, questionsPerTab); i++) {
        converted[`tab_${tab}_question_${i + 1}`] = tabQuestions[i];
        converted[`tab_${tab}_answer_${i + 1}`] = tabAnswers[i] || '';
      }
    }
  }

  return converted;
}

/**
 * Converts quote style legacy format to individual fields
 */
function convertQuoteStyleLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.quote_answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const quotes = content.quote_answers.split('|').map(q => q.trim()).filter(Boolean);
    const attributions = typeof content.quote_attributions === 'string'
      ? content.quote_attributions.split('|').map(a => a.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, quotes.length, 5);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`quote_answer_${i + 1}`] = quotes[i];
      converted[`attribution_${i + 1}`] = attributions[i] || 'Anonymous';
    }
  }

  return converted;
}

/**
 * Converts icon FAQ legacy format to individual fields
 */
function convertIconFAQLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);
    const icons = typeof content.icon_labels === 'string'
      ? content.icon_labels.split('|').map(i => i.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, answers.length, 6);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`answer_${i + 1}`] = answers[i];
      converted[`icon_${i + 1}`] = icons[i] || '❓';
    }
  }

  return converted;
}

/**
 * Converts testimonial FAQ legacy format to individual fields
 */
function convertTestimonialFAQLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.testimonial_answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const testimonials = content.testimonial_answers.split('|').map(t => t.trim()).filter(Boolean);
    const names = typeof content.customer_names === 'string'
      ? content.customer_names.split('|').map(n => n.trim()).filter(Boolean)
      : [];
    const titles = typeof content.customer_titles === 'string'
      ? content.customer_titles.split('|').map(t => t.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, testimonials.length, 5);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`testimonial_answer_${i + 1}`] = testimonials[i];
      converted[`customer_name_${i + 1}`] = names[i] || 'Anonymous Customer';
      if (titles[i]) {
        converted[`customer_title_${i + 1}`] = titles[i];
      }
    }
  }

  return converted;
}

/**
 * Converts chat bubble legacy format to individual fields
 */
function convertChatBubbleLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);
    const personas = typeof content.chat_personas === 'string'
      ? content.chat_personas.split('|').map(p => p.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, answers.length, 5);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`answer_${i + 1}`] = answers[i];
      if (personas[i]) {
        converted[`persona_${i + 1}`] = personas[i];
      }
    }
  }

  return converted;
}

// Validation helper functions for FAQ layouts

/**
 * Validates two-column Q&A pairs
 */
function validateTwoColumnQnAPairs(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  // Check left column pairs
  for (let i = 1; i <= 3; i++) {
    const question = content[`left_question_${i}`];
    const answer = content[`left_answer_${i}`];
    if (question && !answer) {
      warnings.push(`Left column question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Left column answer ${i} has no corresponding question`);
    }
  }

  // Check right column pairs
  for (let i = 1; i <= 3; i++) {
    const question = content[`right_question_${i}`];
    const answer = content[`right_answer_${i}`];
    if (question && !answer) {
      warnings.push(`Right column question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Right column answer ${i} has no corresponding question`);
    }
  }

  return { warnings };
}

/**
 * Validates tab Q&A structure
 */
function validateTabQnAPairs(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let tab = 1; tab <= 3; tab++) {
    for (let i = 1; i <= 3; i++) {
      const question = content[`tab_${tab}_question_${i}`];
      const answer = content[`tab_${tab}_answer_${i}`];
      if (question && !answer) {
        warnings.push(`Tab ${tab} question ${i} has no corresponding answer`);
      }
      if (answer && !question) {
        warnings.push(`Tab ${tab} answer ${i} has no corresponding question`);
      }
    }
  }

  return { warnings };
}

/**
 * Validates quote Q&A triads
 */
function validateQuoteQnATriads(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const question = content[`question_${i}`];
    const quote = content[`quote_answer_${i}`];
    const attribution = content[`attribution_${i}`];

    if (question && !quote) {
      warnings.push(`Question ${i} has no corresponding quote answer`);
    }
    if (quote && !question) {
      warnings.push(`Quote answer ${i} has no corresponding question`);
    }
    if (quote && !attribution) {
      warnings.push(`Quote answer ${i} has no attribution`);
    }
  }

  return { warnings };
}

/**
 * Validates icon Q&A triads
 */
function validateIconQnATriads(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 6; i++) {
    const question = content[`question_${i}`];
    const answer = content[`answer_${i}`];
    const icon = content[`icon_${i}`];

    if (question && !answer) {
      warnings.push(`Question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Answer ${i} has no corresponding question`);
    }
    if (question && !icon) {
      warnings.push(`Question ${i} has no corresponding icon`);
    }
  }

  return { warnings };
}

/**
 * Validates testimonial Q&A structure
 */
function validateTestimonialQnAStructure(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const question = content[`question_${i}`];
    const testimonial = content[`testimonial_answer_${i}`];
    const name = content[`customer_name_${i}`];

    if (question && !testimonial) {
      warnings.push(`Question ${i} has no corresponding testimonial answer`);
    }
    if (testimonial && !question) {
      warnings.push(`Testimonial answer ${i} has no corresponding question`);
    }
    if (testimonial && !name) {
      warnings.push(`Testimonial answer ${i} has no customer name`);
    }
  }

  return { warnings };
}

/**
 * Validates chat Q&A structure
 */
function validateChatQnAStructure(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const question = content[`question_${i}`];
    const answer = content[`answer_${i}`];

    if (question && !answer) {
      warnings.push(`Chat question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Chat answer ${i} has no corresponding question`);
    }
  }

  return { warnings };
}

/**
 * Special processing for BeforeAfterSlider sections
 */
function processBeforeAfterSliderContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Special handling for trust_items field (pipe-separated)
    if (elementKey === 'trust_items') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: trust_items has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for icon fields (ensure single emoji)
    else if (elementKey.includes('icon')) {
      const iconValue = String(elementValue || '').trim();
      if (iconValue) {
        // Extract first emoji if multiple characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu;
        const emojis = iconValue.match(emojiRegex);
        if (emojis && emojis.length > 0) {
          result.content[elementKey] = emojis[0];
        } else {
          // Use default based on field name
          if (elementKey === 'before_icon') {
            result.content[elementKey] = '⚠️';
          } else if (elementKey === 'after_icon') {
            result.content[elementKey] = '✅';
          } else if (elementKey === 'hint_icon') {
            result.content[elementKey] = '👆';
          } else {
            result.content[elementKey] = '📌';
          }
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        // Set defaults for empty icons
        if (elementKey === 'before_icon') {
          result.content[elementKey] = '⚠️';
        } else if (elementKey === 'after_icon') {
          result.content[elementKey] = '✅';
        } else if (elementKey === 'hint_icon') {
          result.content[elementKey] = '👆';
        } else {
          result.content[elementKey] = '';
        }
      }
    }
    // Special handling for boolean flags
    else if (elementKey === 'show_interaction_hint') {
      const value = String(elementValue || 'true').toLowerCase();
      result.content[elementKey] = (value === 'true' || value === 'yes' || value === '1') ? 'true' : 'false';
    }
    // Regular processing for other fields
    else {
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  // Validate paired fields
  const pairValidation = validateBeforeAfterPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Validates Before/After paired fields for consistency
 */
function validateBeforeAfterPairs(content: SectionContent): {
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for mismatched before/after content
  if (content.before_label && !content.after_label) {
    warnings.push('Before label exists without corresponding after label');
  }
  if (content.after_label && !content.before_label) {
    warnings.push('After label exists without corresponding before label');
  }
  if (content.before_description && !content.after_description) {
    warnings.push('Before description exists without corresponding after description');
  }
  if (content.after_description && !content.before_description) {
    warnings.push('After description exists without corresponding before description');
  }

  return { warnings };
}

/**
 * Special processing for SideBySideBlocks sections
 */
function processSideBySideBlocksContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Special handling for trust_items field (pipe-separated)
    if (elementKey === 'trust_items') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: trust_items has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for icon fields (ensure single emoji)
    else if (elementKey.includes('icon')) {
      const iconValue = String(elementValue || '').trim();
      if (iconValue) {
        // Extract first emoji if multiple characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu;
        const emojis = iconValue.match(emojiRegex);
        if (emojis && emojis.length > 0) {
          result.content[elementKey] = emojis[0];
        } else {
          // Use default based on field name
          if (elementKey === 'before_icon') {
            result.content[elementKey] = '⚠️';
          } else if (elementKey === 'after_icon') {
            result.content[elementKey] = '✅';
          } else {
            result.content[elementKey] = '📌';
          }
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        // Set defaults for empty icons
        if (elementKey === 'before_icon') {
          result.content[elementKey] = '⚠️';
        } else if (elementKey === 'after_icon') {
          result.content[elementKey] = '✅';
        } else {
          result.content[elementKey] = '';
        }
      }
    }
    // Regular processing for other fields
    else {
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  // Validate paired fields
  const pairValidation = validateBeforeAfterPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for TextListTransformation sections
 */
function processTextListTransformationContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Special handling for list fields (pipe-separated)
    if (elementKey === 'before_list' || elementKey === 'after_list') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join('|');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for trust_items field (pipe-separated)
    else if (elementKey === 'trust_items') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: trust_items has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for icon fields (ensure single emoji)
    else if (elementKey.includes('icon')) {
      const iconValue = String(elementValue || '').trim();
      if (iconValue) {
        // Extract first emoji if multiple characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu;
        const emojis = iconValue.match(emojiRegex);
        if (emojis && emojis.length > 0) {
          result.content[elementKey] = emojis[0];
        } else {
          // Use default based on field name
          if (elementKey === 'before_icon') {
            result.content[elementKey] = '❌';
          } else if (elementKey === 'after_icon') {
            result.content[elementKey] = '✅';
          } else if (elementKey === 'transformation_icon') {
            result.content[elementKey] = '➡️';
          } else {
            result.content[elementKey] = '📌';
          }
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        // Set defaults for empty icons
        if (elementKey === 'before_icon') {
          result.content[elementKey] = '❌';
        } else if (elementKey === 'after_icon') {
          result.content[elementKey] = '✅';
        } else if (elementKey === 'transformation_icon') {
          result.content[elementKey] = '➡️';
        } else {
          result.content[elementKey] = '';
        }
      }
    }
    // Regular processing for other fields
    else {
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  // Validate paired fields
  const pairValidation = validateBeforeAfterPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Generic processing for BeforeAfter sections
 */
function processBeforeAfterGenericContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Special handling for pipe-separated fields
    if (elementKey.includes('stats') || elementKey.includes('steps') || elementKey.includes('journey') ||
        elementKey === 'trust_items') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for icon fields (ensure single emoji)
    else if (elementKey.includes('icon')) {
      const iconValue = String(elementValue || '').trim();
      if (iconValue) {
        // Extract first emoji if multiple characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu;
        const emojis = iconValue.match(emojiRegex);
        if (emojis && emojis.length > 0) {
          result.content[elementKey] = emojis[0];
        } else {
          // Use default emoji
          result.content[elementKey] = '📊';
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        result.content[elementKey] = '📊';
      }
    }
    // Special handling for boolean flags
    else if (elementKey.includes('show_')) {
      const value = String(elementValue || 'true').toLowerCase();
      result.content[elementKey] = (value === 'true' || value === 'yes' || value === '1') ? 'true' : 'false';
    }
    // Regular processing for other fields
    else {
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  return result;
}

/**
 * Special processing for EmojiOutcomeGrid sections to handle pipe-separated format
 */
function processEmojiOutcomeGridContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Handle pipe-separated fields
    if (elementKey === 'emojis' || elementKey === 'outcomes' || elementKey === 'descriptions') {
      // Ensure it's a string and convert to pipe-separated format if needed
      let processedValue: string = '';

      if (Array.isArray(elementValue)) {
        // Convert array to pipe-separated string
        processedValue = elementValue.join('|');
        result.warnings.push(`${sectionId}: Converted array to pipe-separated format for ${elementKey}`);
      } else if (typeof elementValue === 'string') {
        // Already a string, use as-is
        processedValue = elementValue;
      } else {
        // Invalid format
        result.warnings.push(`${sectionId}: Invalid format for ${elementKey}, expected string or array`);
        result.hasIssues = true;
        processedValue = '';
      }

      result.content[elementKey] = processedValue;
    } else {
      // Process other fields normally
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  // Validate matching counts for emojis, outcomes, and descriptions
  const emojiValidation = validateEmojiOutcomeGridData(result.content);
  if (emojiValidation.warnings.length > 0) {
    result.warnings.push(...emojiValidation.warnings);
    // Apply corrections if needed
    if (emojiValidation.corrected) {
      Object.assign(result.content, emojiValidation.corrected);
      result.warnings.push(`${sectionId}: Applied automatic correction to match emoji/outcome/description counts`);
    }
  }

  return result;
}

/**
 * Validates EmojiOutcomeGrid data consistency
 */
function validateEmojiOutcomeGridData(content: SectionContent): {
  warnings: string[];
  corrected?: SectionContent;
} {
  const warnings: string[] = [];
  let corrected: SectionContent | undefined;

  // Get the pipe-separated values
  const emojis = typeof content.emojis === 'string' ? content.emojis.split('|').filter(Boolean) : [];
  const outcomes = typeof content.outcomes === 'string' ? content.outcomes.split('|').filter(Boolean) : [];
  const descriptions = typeof content.descriptions === 'string' ? content.descriptions.split('|').filter(Boolean) : [];

  // Check if counts match
  const maxCount = Math.max(emojis.length, outcomes.length, descriptions.length);
  const minCount = Math.min(emojis.length, outcomes.length, descriptions.length);

  if (maxCount !== minCount && maxCount > 0) {
    warnings.push(`Mismatched counts: ${emojis.length} emojis, ${outcomes.length} outcomes, ${descriptions.length} descriptions`);

    // Auto-correct by trimming to minimum count or filling with defaults
    if (minCount > 0) {
      corrected = {
        emojis: emojis.slice(0, minCount).join('|'),
        outcomes: outcomes.slice(0, minCount).join('|'),
        descriptions: descriptions.slice(0, minCount).join('|')
      };
    } else {
      // If any is empty, provide defaults
      const defaultCount = maxCount || 3;
      const defaultEmojis = ['🚀', '💡', '⭐', '🎯', '📈', '✨'];
      const defaultOutcomes = ['Amazing Result', 'Great Outcome', 'Success Achieved', 'Goal Reached', 'Milestone Hit', 'Victory Won'];
      const defaultDescriptions = ['Experience incredible improvements', 'See remarkable transformations', 'Achieve outstanding results', 'Reach new heights', 'Unlock new potential', 'Discover new possibilities'];

      corrected = {
        emojis: emojis.length === 0 ? defaultEmojis.slice(0, defaultCount).join('|') : content.emojis,
        outcomes: outcomes.length === 0 ? defaultOutcomes.slice(0, defaultCount).join('|') : content.outcomes,
        descriptions: descriptions.length === 0 ? defaultDescriptions.slice(0, defaultCount).join('|') : content.descriptions
      };
    }
  }

  return { warnings, corrected };
}

/**
 * UniqueMechanism section processing functions
 */

function processAlgorithmExplainerContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy algorithm_steps format if exists
  if (content.algorithm_steps && typeof content.algorithm_steps === 'string' && content.algorithm_steps.includes('|')) {
    const steps = content.algorithm_steps.split('|').map(step => step.trim()).filter(Boolean);

    steps.forEach((step, index) => {
      result.content[`algorithm_step_${index + 1}`] = step;
    });

    result.warnings.push(`${sectionId}: Converted legacy algorithm_steps to individual step fields`);
    delete content.algorithm_steps; // Remove to avoid double processing
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  return result;
}

function processInnovationTimelineContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy timeline_items format if exists
  if (content.timeline_items && typeof content.timeline_items === 'string' && content.timeline_items.includes('|')) {
    const items = content.timeline_items.split('|').map(item => item.trim()).filter(Boolean);

    items.forEach((item, index) => {
      result.content[`timeline_item_${index + 1}`] = item;
    });

    result.warnings.push(`${sectionId}: Converted legacy timeline_items to individual item fields`);
    delete content.timeline_items; // Remove to avoid double processing
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  return result;
}

function processMethodologyBreakdownContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy formats if they exist
  if (content.key_principles && typeof content.key_principles === 'string' && content.key_principles.includes('|')) {
    const principles = content.key_principles.split('|').map(p => p.trim()).filter(Boolean);
    principles.forEach((principle, index) => {
      result.content[`principle_${index + 1}`] = principle;
    });
    result.warnings.push(`${sectionId}: Converted legacy key_principles to individual principle fields`);
    delete content.key_principles;
  }

  if (content.principle_details && typeof content.principle_details === 'string' && content.principle_details.includes('|')) {
    const details = content.principle_details.split('|').map(d => d.trim()).filter(Boolean);
    details.forEach((detail, index) => {
      result.content[`detail_${index + 1}`] = detail;
    });
    result.warnings.push(`${sectionId}: Converted legacy principle_details to individual detail fields`);
    delete content.principle_details;
  }

  if (content.result_metrics && typeof content.result_metrics === 'string' && content.result_metrics.includes('|')) {
    const metrics = content.result_metrics.split('|').map(m => m.trim()).filter(Boolean);
    metrics.forEach((metric, index) => {
      result.content[`result_metric_${index + 1}`] = metric;
    });
    result.warnings.push(`${sectionId}: Converted legacy result_metrics to individual metric fields`);
    delete content.result_metrics;
  }

  if (content.result_labels && typeof content.result_labels === 'string' && content.result_labels.includes('|')) {
    const labels = content.result_labels.split('|').map(l => l.trim()).filter(Boolean);
    labels.forEach((label, index) => {
      result.content[`result_label_${index + 1}`] = label;
    });
    result.warnings.push(`${sectionId}: Converted legacy result_labels to individual label fields`);
    delete content.result_labels;
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  return result;
}

function processProcessFlowDiagramContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'process_steps' || elementKey === 'step_descriptions' ||
        elementKey === 'benefit_titles' || elementKey === 'benefit_descriptions') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 2) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 2 items`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
      const processedElement = processElement(sectionId, elementKey, elementValue);
      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  return result;
}

function processPropertyComparisonMatrixContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated comparison fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'properties' || elementKey === 'us_values' || elementKey === 'competitors_values') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 3) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 3 comparison points`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
      const processedElement = processElement(sectionId, elementKey, elementValue);
      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  return result;
}

function processSecretSauceRevealContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  return result;
}

function processStackedHighlightsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated highlight fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'highlight_titles' || elementKey === 'highlight_descriptions') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 3) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 3 highlights`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
      const processedElement = processElement(sectionId, elementKey, elementValue);
      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  return result;
}

function processSystemArchitectureContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy architecture_components format if exists
  if (content.architecture_components && typeof content.architecture_components === 'string' && content.architecture_components.includes('|')) {
    const components = content.architecture_components.split('|').map(comp => comp.trim()).filter(Boolean);

    components.forEach((component, index) => {
      result.content[`component_${index + 1}`] = component;
    });

    result.warnings.push(`${sectionId}: Converted legacy architecture_components to individual component fields`);
    delete content.architecture_components; // Remove to avoid double processing
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  return result;
}

function processTechnicalAdvantageContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated advantage fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'advantages' || elementKey === 'advantage_descriptions') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 3) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 3 advantages`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
      const processedElement = processElement(sectionId, elementKey, elementValue);
      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  return result;
}


/**
 * Special processing for CenteredHeadlineCTA sections
 */
function processCenteredHeadlineCTAContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element with CTA-specific validation
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // CTA-specific validations
  if (!result.content.headline) {
    result.warnings.push(`${sectionId}: Missing required field 'headline'`);
    result.hasIssues = true;
  }

  if (!result.content.cta_text) {
    result.warnings.push(`${sectionId}: Missing required field 'cta_text'`);
    result.hasIssues = true;
  }

  // Process trust items (pipe-separated to individual fields)
  if (content.trust_items && typeof content.trust_items === 'string') {
    const trustItems = content.trust_items.split('|').map(item => item.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(trustItems.length, 5); i++) {
      result.content[`trust_item_${i + 1}`] = trustItems[i];
    }
  }

  return result;
}

/**
 * Problem Section Processing Functions
 */

/**
 * Special processing for StackedPainBullets sections
 */
function processStackedPainBulletsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element with pain bullet-specific validation
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  if (!result.content.headline) {
    result.warnings.push(`${sectionId}: Missing required field 'headline'`);
    result.hasIssues = true;
  }

  if (!result.content.pain_points) {
    result.warnings.push(`${sectionId}: Missing required field 'pain_points'`);
    result.hasIssues = true;
  }

  // Validate pipe-separated pain points
  if (content.pain_points && typeof content.pain_points === 'string') {
    const painPoints = content.pain_points.split('|').map(item => item.trim()).filter(Boolean);
    if (painPoints.length < 3) {
      result.warnings.push(`${sectionId}: pain_points should contain at least 3 items`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for BeforeImageAfterText sections
 */
function processBeforeImageAfterTextContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'before_description', 'after_description'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  return result;
}

/**
 * Special processing for SideBySideSplit sections
 */
function processSideBySideSplitContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'problem_title', 'problem_description', 'solution_preview'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate pipe-separated points
  ['problem_points', 'solution_points'].forEach(field => {
    if (content[field] && typeof content[field] === 'string') {
      const points = content[field].split('|').map(item => item.trim()).filter(Boolean);
      if (points.length < 3) {
        result.warnings.push(`${sectionId}: ${field} should contain at least 3 items`);
        result.hasIssues = true;
      }
    }
  });

  return result;
}

/**
 * Special processing for EmotionalQuotes sections
 */
function processEmotionalQuotesContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'emotional_quotes', 'quote_attributions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate quote/attribution pairing
  if (content.emotional_quotes && content.quote_attributions) {
    const quotes = typeof content.emotional_quotes === 'string'
      ? content.emotional_quotes.split('|').map((item: string) => item.trim()).filter(Boolean)
      : [];
    const attributions = typeof content.quote_attributions === 'string'
      ? content.quote_attributions.split('|').map((item: string) => item.trim()).filter(Boolean)
      : [];

    if (quotes.length !== attributions.length) {
      result.warnings.push(`${sectionId}: Number of quotes (${quotes.length}) doesn't match attributions (${attributions.length})`);
      result.hasIssues = true;
    }

    if (quotes.length < 3) {
      result.warnings.push(`${sectionId}: Should have at least 3 emotional quotes`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for CollapsedCards sections
 */
function processCollapsedCardsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'problem_titles', 'problem_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate title/description pairing
  if (content.problem_titles && content.problem_descriptions) {
    const titles = content.problem_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.problem_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    if (titles.length < 4) {
      result.warnings.push(`${sectionId}: Should have at least 4 problem cards`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for PainMeterChart sections
 */
function processPainMeterChartContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'pain_categories', 'pain_levels'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate category/level pairing and numeric levels
  if (content.pain_categories && content.pain_levels) {
    const categories = content.pain_categories.split('|').map(item => item.trim()).filter(Boolean);
    const levels = content.pain_levels.split('|').map(item => item.trim()).filter(Boolean);

    if (categories.length !== levels.length) {
      result.warnings.push(`${sectionId}: Number of categories (${categories.length}) doesn't match levels (${levels.length})`);
      result.hasIssues = true;
    }

    // Validate pain levels are numbers 0-100
    levels.forEach((level: string, index: number) => {
      const numLevel = parseInt(level);
      if (isNaN(numLevel) || numLevel < 0 || numLevel > 100) {
        result.warnings.push(`${sectionId}: Pain level ${index + 1} '${level}' should be a number between 0-100`);
        result.hasIssues = true;
      }
    });

    if (categories.length < 4) {
      result.warnings.push(`${sectionId}: Should have at least 4 pain categories for meaningful chart`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for PersonaPanels sections
 */
function processPersonaPanelsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'persona_names', 'persona_problems'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate name/problem pairing
  if (content.persona_names && content.persona_problems) {
    const names = content.persona_names.split('|').map(item => item.trim()).filter(Boolean);
    const problems = content.persona_problems.split('|').map(item => item.trim()).filter(Boolean);

    if (names.length !== problems.length) {
      result.warnings.push(`${sectionId}: Number of names (${names.length}) doesn't match problems (${problems.length})`);
      result.hasIssues = true;
    }

    if (names.length < 3) {
      result.warnings.push(`${sectionId}: Should have at least 3 persona panels`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for ProblemChecklist sections
 */
function processProblemChecklistContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'problem_statements', 'checklist_items'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate statement/item pairing
  if (content.problem_statements && content.checklist_items) {
    const statements = content.problem_statements.split('|').map(item => item.trim()).filter(Boolean);
    const items = content.checklist_items.split('|').map(item => item.trim()).filter(Boolean);

    if (statements.length !== items.length) {
      result.warnings.push(`${sectionId}: Number of statements (${statements.length}) doesn't match items (${items.length})`);
      result.hasIssues = true;
    }

    if (statements.length < 6) {
      result.warnings.push(`${sectionId}: Should have at least 6 checklist items for meaningful assessment`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for ThreeStepHorizontal sections
 */
function processThreeStepHorizontalContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'step_titles', 'step_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate step consistency
  if (content.step_titles && content.step_descriptions) {
    const titles = content.step_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.step_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of step titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    if (titles.length !== 3) {
      result.warnings.push(`${sectionId}: ThreeStepHorizontal should have exactly 3 steps, found ${titles.length}`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for VerticalTimeline sections
 */
function processVerticalTimelineContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'step_titles', 'step_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate step consistency and durations
  if (content.step_titles && content.step_descriptions) {
    const titles = content.step_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.step_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of step titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    // Check durations if provided
    if (content.step_durations) {
      const durations = content.step_durations.split('|').map(item => item.trim()).filter(Boolean);
      if (durations.length !== titles.length) {
        result.warnings.push(`${sectionId}: Number of durations (${durations.length}) doesn't match steps (${titles.length})`);
        result.hasIssues = true;
      }
    }

    if (titles.length < 3) {
      result.warnings.push(`${sectionId}: VerticalTimeline should have at least 3 steps, found ${titles.length}`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for IconCircleSteps sections
 */
function processIconCircleStepsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'step_titles', 'step_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate step consistency
  if (content.step_titles && content.step_descriptions) {
    const titles = content.step_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.step_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of step titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    if (titles.length < 3) {
      result.warnings.push(`${sectionId}: IconCircleSteps should have at least 3 steps, found ${titles.length}`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for AccordionSteps sections
 */
function processAccordionStepsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'step_titles', 'step_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate step consistency and details
  if (content.step_titles && content.step_descriptions) {
    const titles = content.step_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.step_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of step titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    // Check details if provided
    if (content.step_details) {
      const details = content.step_details.split('|').map(item => item.trim()).filter(Boolean);
      if (details.length !== titles.length) {
        result.warnings.push(`${sectionId}: Number of step details (${details.length}) doesn't match steps (${titles.length})`);
        result.hasIssues = true;
      }
    }

    if (titles.length < 3) {
      result.warnings.push(`${sectionId}: AccordionSteps should have at least 3 steps, found ${titles.length}`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for CardFlipSteps sections
 */
function processCardFlipStepsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'step_titles', 'step_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate step consistency and flip content
  if (content.step_titles && content.step_descriptions) {
    const titles = content.step_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.step_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of step titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    // Check details for card flip reveal content
    if (content.step_details) {
      const details = content.step_details.split('|').map(item => item.trim()).filter(Boolean);
      if (details.length !== titles.length) {
        result.warnings.push(`${sectionId}: Number of flip details (${details.length}) doesn't match steps (${titles.length})`);
        result.hasIssues = true;
      }
    }

    if (titles.length < 3) {
      result.warnings.push(`${sectionId}: CardFlipSteps should have at least 3 steps, found ${titles.length}`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for VideoWalkthrough sections
 */
function processVideoWalkthroughContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'video_title', 'video_description'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate video chapters if provided
  if (content.chapter_titles) {
    const chapters = content.chapter_titles.split('|').map(item => item.trim()).filter(Boolean);
    if (chapters.length > 8) {
      result.warnings.push(`${sectionId}: Too many chapters (${chapters.length}), consider limiting to 8 for better UX`);
    }
  }

  // Validate video duration format if provided
  if (content.video_duration && typeof content.video_duration === 'string') {
    const durationPattern = /^\d+:\d{2}$/;
    if (!durationPattern.test(content.video_duration)) {
      result.warnings.push(`${sectionId}: Video duration should be in MM:SS format (e.g., "3:45")`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for ZigzagImageSteps sections
 */
function processZigzagImageStepsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'step_titles', 'step_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate step and image caption consistency
  if (content.step_titles && content.step_descriptions) {
    const titles = content.step_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.step_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of step titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    // Check image captions if provided
    if (content.image_captions) {
      const captions = content.image_captions.split('|').map(item => item.trim()).filter(Boolean);
      if (captions.length !== titles.length) {
        result.warnings.push(`${sectionId}: Number of image captions (${captions.length}) doesn't match steps (${titles.length})`);
        result.hasIssues = true;
      }
    }

    if (titles.length < 3) {
      result.warnings.push(`${sectionId}: ZigzagImageSteps should have at least 3 steps, found ${titles.length}`);
      result.hasIssues = true;
    }

    if (titles.length > 6) {
      result.warnings.push(`${sectionId}: ZigzagImageSteps works best with 3-6 steps, found ${titles.length}`);
    }
  }

  return result;
}

/**
 * Special processing for AnimatedProcessLine sections
 */
function processAnimatedProcessLineContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Required field validation
  const requiredFields = ['headline', 'process_titles', 'process_descriptions'];
  requiredFields.forEach(field => {
    if (!result.content[field]) {
      result.warnings.push(`${sectionId}: Missing required field '${field}'`);
      result.hasIssues = true;
    }
  });

  // Validate process consistency and animation labels
  if (content.process_titles && content.process_descriptions) {
    const titles = content.process_titles.split('|').map(item => item.trim()).filter(Boolean);
    const descriptions = content.process_descriptions.split('|').map(item => item.trim()).filter(Boolean);

    if (titles.length !== descriptions.length) {
      result.warnings.push(`${sectionId}: Number of process titles (${titles.length}) doesn't match descriptions (${descriptions.length})`);
      result.hasIssues = true;
    }

    // Check animation labels if provided
    if (content.animation_labels) {
      const labels = content.animation_labels.split('|').map(item => item.trim()).filter(Boolean);
      if (labels.length !== titles.length) {
        result.warnings.push(`${sectionId}: Number of animation labels (${labels.length}) doesn't match process steps (${titles.length})`);
        result.hasIssues = true;
      }
    }

    if (titles.length < 3) {
      result.warnings.push(`${sectionId}: AnimatedProcessLine should have at least 3 process steps, found ${titles.length}`);
      result.hasIssues = true;
    }

    if (titles.length > 8) {
      result.warnings.push(`${sectionId}: AnimatedProcessLine works best with 3-8 steps for animation clarity, found ${titles.length}`);
    }
  }

  return result;
}

/**
 * Special processing for ObjectionAccordion sections
 */
function processObjectionAccordionContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual objection fields (preferred format)
  const individualFields = ['objection_1', 'objection_2', 'objection_3', 'objection_4', 'objection_5', 'objection_6'];
  const responseFields = ['response_1', 'response_2', 'response_3', 'response_4', 'response_5', 'response_6'];

  let hasIndividualFields = individualFields.some(field => content[field]);
  let hasResponseFields = responseFields.some(field => content[field]);

  if (hasIndividualFields || hasResponseFields) {
    // Validate individual field pairs
    for (let i = 1; i <= 6; i++) {
      const objectionField = `objection_${i}`;
      const responseField = `response_${i}`;

      if (content[objectionField] && !content[responseField]) {
        result.warnings.push(`${sectionId}: Found ${objectionField} but missing ${responseField}`);
        result.hasIssues = true;
      }
      if (content[responseField] && !content[objectionField]) {
        result.warnings.push(`${sectionId}: Found ${responseField} but missing ${objectionField}`);
        result.hasIssues = true;
      }
    }

    // Ensure at least 3 objection/response pairs for meaningful conversion
    const validPairs = individualFields.filter((field, index) =>
      content[field] && content[responseFields[index]]
    ).length;

    if (validPairs < 2) {
      result.warnings.push(`${sectionId}: ObjectionAccordion should have at least 2 objection/response pairs, found ${validPairs}`);
      result.hasIssues = true;
    }
  }

  // Legacy format support
  if (content.objection_titles && content.objection_responses) {
    const titles = String(content.objection_titles).split('|').filter(t => t.trim());
    const responses = String(content.objection_responses).split('|').filter(r => r.trim());

    if (titles.length !== responses.length) {
      result.warnings.push(`${sectionId}: Objection titles (${titles.length}) and responses (${responses.length}) count mismatch`);
      result.hasIssues = true;
    }

    if (titles.length < 2) {
      result.warnings.push(`${sectionId}: ObjectionAccordion should have at least 2 objections for credibility, found ${titles.length}`);
      result.hasIssues = true;
    }

    if (titles.length > 6) {
      result.warnings.push(`${sectionId}: ObjectionAccordion with ${titles.length} objections may be overwhelming - consider 3-6 key objections`);
    }
  }

  return result;
}

/**
 * Special processing for MythVsRealityGrid sections
 */
function processMythVsRealityGridContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual myth/reality pairs (preferred format)
  const mythFields = ['myth_1', 'myth_2', 'myth_3', 'myth_4', 'myth_5', 'myth_6'];
  const realityFields = ['reality_1', 'reality_2', 'reality_3', 'reality_4', 'reality_5', 'reality_6'];

  let hasIndividualFields = mythFields.some(field => content[field]) || realityFields.some(field => content[field]);

  if (hasIndividualFields) {
    // Validate individual field pairs
    for (let i = 1; i <= 6; i++) {
      const mythField = `myth_${i}`;
      const realityField = `reality_${i}`;

      if (content[mythField] && !content[realityField]) {
        result.warnings.push(`${sectionId}: Found ${mythField} but missing ${realityField}`);
        result.hasIssues = true;
      }
      if (content[realityField] && !content[mythField]) {
        result.warnings.push(`${sectionId}: Found ${realityField} but missing ${mythField}`);
        result.hasIssues = true;
      }
    }

    // Ensure at least 2 myth/reality pairs for effective comparison
    const validPairs = mythFields.filter((field, index) =>
      content[field] && content[realityFields[index]]
    ).length;

    if (validPairs < 2) {
      result.warnings.push(`${sectionId}: MythVsRealityGrid should have at least 2 myth/reality pairs, found ${validPairs}`);
      result.hasIssues = true;
    }
  }

  // Legacy format support
  if (content.myth_reality_pairs) {
    const pairs = String(content.myth_reality_pairs).split('|');
    if (pairs.length % 2 !== 0) {
      result.warnings.push(`${sectionId}: myth_reality_pairs should have even number of items (myth|reality pairs), found ${pairs.length}`);
      result.hasIssues = true;
    }

    const pairCount = Math.floor(pairs.length / 2);
    if (pairCount < 2) {
      result.warnings.push(`${sectionId}: MythVsRealityGrid should have at least 2 pairs for effective comparison, found ${pairCount}`);
      result.hasIssues = true;
    }

    if (pairCount > 6) {
      result.warnings.push(`${sectionId}: ${pairCount} myth/reality pairs may be overwhelming - consider 2-4 key contrasts`);
    }
  }

  return result;
}

/**
 * Special processing for QuoteBackedAnswers sections
 */
function processQuoteBackedAnswersContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual triplet fields (preferred format)
  let validTriplets = 0;
  for (let i = 1; i <= 6; i++) {
    const objectionField = `objection_${i}`;
    const quoteField = `quote_response_${i}`;
    const attributionField = `quote_attribution_${i}`;

    const hasObjection = content[objectionField];
    const hasQuote = content[quoteField];
    const hasAttribution = content[attributionField];

    if (hasObjection || hasQuote || hasAttribution) {
      if (!hasObjection) {
        result.warnings.push(`${sectionId}: Missing ${objectionField} for quote ${i}`);
        result.hasIssues = true;
      }
      if (!hasQuote) {
        result.warnings.push(`${sectionId}: Missing ${quoteField} for quote ${i}`);
        result.hasIssues = true;
      }
      if (!hasAttribution) {
        result.warnings.push(`${sectionId}: Missing ${attributionField} for quote ${i} - attribution is crucial for credibility`);
        result.hasIssues = true;
      }

      if (hasObjection && hasQuote && hasAttribution) {
        validTriplets++;
      }
    }
  }

  if (validTriplets > 0 && validTriplets < 2) {
    result.warnings.push(`${sectionId}: QuoteBackedAnswers should have at least 2 complete quote triplets for authority, found ${validTriplets}`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for SkepticToBelieverSteps sections
 */
function processSkepticToBelieverStepsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual step fields (preferred format)
  let validSteps = 0;
  for (let i = 1; i <= 5; i++) {
    const nameField = `step_name_${i}`;
    const quoteField = `step_quote_${i}`;
    const resultField = `step_result_${i}`;

    const hasName = content[nameField];
    const hasQuote = content[quoteField];
    const hasResult = content[resultField];

    if (hasName || hasQuote || hasResult) {
      if (!hasName) {
        result.warnings.push(`${sectionId}: Missing ${nameField} for step ${i}`);
        result.hasIssues = true;
      }
      if (!hasQuote) {
        result.warnings.push(`${sectionId}: Missing ${quoteField} for step ${i}`);
        result.hasIssues = true;
      }
      if (!hasResult) {
        result.warnings.push(`${sectionId}: Missing ${resultField} for step ${i}`);
        result.hasIssues = true;
      }

      if (hasName && hasQuote && hasResult) {
        validSteps++;
      }
    }
  }

  if (validSteps > 0 && validSteps < 3) {
    result.warnings.push(`${sectionId}: SkepticToBelieverSteps should show a clear progression with at least 3 steps, found ${validSteps}`);
    result.hasIssues = true;
  }

  // Legacy format support
  if (content.conversion_steps) {
    const steps = String(content.conversion_steps).split('|');
    if (steps.length % 3 !== 0) {
      result.warnings.push(`${sectionId}: conversion_steps should have groups of 3 (name|quote|result), found ${steps.length} items`);
      result.hasIssues = true;
    }

    const stepCount = Math.floor(steps.length / 3);
    if (stepCount < 3) {
      result.warnings.push(`${sectionId}: SkepticToBelieverSteps needs at least 3 steps for credible progression, found ${stepCount}`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Special processing for VisualObjectionTiles sections
 */
function processVisualObjectionTilesContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual tile fields (preferred format)
  let validTiles = 0;
  for (let i = 1; i <= 6; i++) {
    const objectionField = `tile_objection_${i}`;
    const responseField = `tile_response_${i}`;

    const hasObjection = content[objectionField];
    const hasResponse = content[responseField];

    if (hasObjection || hasResponse) {
      if (!hasObjection) {
        result.warnings.push(`${sectionId}: Missing ${objectionField} for tile ${i}`);
        result.hasIssues = true;
      }
      if (!hasResponse) {
        result.warnings.push(`${sectionId}: Missing ${responseField} for tile ${i}`);
        result.hasIssues = true;
      }

      if (hasObjection && hasResponse) {
        validTiles++;
      }
    }
  }

  if (validTiles > 0 && validTiles < 3) {
    result.warnings.push(`${sectionId}: VisualObjectionTiles should have at least 3 tiles for visual impact, found ${validTiles}`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for ProblemToReframeBlocks sections
 */
function processProblemToReframeBlocksContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual problem/reframe pairs (preferred format)
  let validPairs = 0;
  for (let i = 1; i <= 6; i++) {
    const problemField = `problem_${i}`;
    const reframeField = `reframe_${i}`;

    const hasProblem = content[problemField];
    const hasReframe = content[reframeField];

    if (hasProblem || hasReframe) {
      if (!hasProblem) {
        result.warnings.push(`${sectionId}: Missing ${problemField} for reframe ${i}`);
        result.hasIssues = true;
      }
      if (!hasReframe) {
        result.warnings.push(`${sectionId}: Missing ${reframeField} for problem ${i}`);
        result.hasIssues = true;
      }

      if (hasProblem && hasReframe) {
        validPairs++;
      }
    }
  }

  if (validPairs > 0 && validPairs < 2) {
    result.warnings.push(`${sectionId}: ProblemToReframeBlocks should have at least 2 problem/reframe pairs, found ${validPairs}`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for BoldGuaranteePanel sections
 */
function processBoldGuaranteePanelContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate essential guarantee elements
  if (!content.guarantee_statement) {
    result.warnings.push(`${sectionId}: Missing guarantee_statement - essential for bold guarantee panel`);
    result.hasIssues = true;
  }

  if (!content.guarantee_details) {
    result.warnings.push(`${sectionId}: Missing guarantee_details - specifics build credibility`);
    result.hasIssues = true;
  }

  // Check for risk reversal elements
  const riskReversalFields = ['risk_reversal_text', 'refund_process', 'no_questions_asked'];
  const hasRiskReversal = riskReversalFields.some(field => content[field]);

  if (!hasRiskReversal) {
    result.warnings.push(`${sectionId}: Consider adding risk reversal elements to strengthen the guarantee`);
  }

  return result;
}

/**
 * Special processing for ObjectionCarousel sections
 */
function processObjectionCarouselContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content } as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for individual slide fields (preferred format)
  let validSlides = 0;
  for (let i = 1; i <= 8; i++) {
    const objectionField = `slide_objection_${i}`;
    const responseField = `slide_response_${i}`;

    const hasObjection = content[objectionField];
    const hasResponse = content[responseField];

    if (hasObjection || hasResponse) {
      if (!hasObjection) {
        result.warnings.push(`${sectionId}: Missing ${objectionField} for slide ${i}`);
        result.hasIssues = true;
      }
      if (!hasResponse) {
        result.warnings.push(`${sectionId}: Missing ${responseField} for slide ${i}`);
        result.hasIssues = true;
      }

      if (hasObjection && hasResponse) {
        validSlides++;
      }
    }
  }

  if (validSlides > 0 && validSlides < 3) {
    result.warnings.push(`${sectionId}: ObjectionCarousel should have at least 3 slides for meaningful progression, found ${validSlides}`);
    result.hasIssues = true;
  }

  if (validSlides > 6) {
    result.warnings.push(`${sectionId}: ${validSlides} slides may cause carousel fatigue - consider 3-6 key objections`);
  }

  return result;
}

/**
 * Processes FoundersBeliefStack content with special handling for belief items and company values
 */
function processFoundersBeliefStackContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Process belief_items (pipe-separated format: Icon|Title|Description)
  if (content.belief_items && typeof content.belief_items === 'string') {
    const beliefItems = content.belief_items.split('|').map(item => item.trim());
    if (beliefItems.length % 3 !== 0) {
      result.warnings.push(`${sectionId}: belief_items should be in groups of 3 (Icon|Title|Description format)`);
      result.hasIssues = true;
    } else if (beliefItems.length < 6) {
      result.warnings.push(`${sectionId}: belief_items should have at least 2 beliefs (6 pipe-separated values)`);
      result.hasIssues = true;
    }
  }

  // Validate company values progression
  const companyValueFields = ['company_value_1', 'company_value_2', 'company_value_3', 'company_value_4', 'company_value_5'];
  let valueCount = 0;
  companyValueFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      valueCount++;
    }
  });

  if (valueCount > 0 && valueCount < 3) {
    result.warnings.push(`${sectionId}: Should have at least 3 company values when values are included`);
    result.hasIssues = true;
  }

  // Validate trust items progression
  const trustItemFields = ['trust_item_1', 'trust_item_2', 'trust_item_3', 'trust_item_4', 'trust_item_5'];
  let trustCount = 0;
  trustItemFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      trustCount++;
    }
  });

  if (trustCount > 0 && trustCount < 2) {
    result.warnings.push(`${sectionId}: Should have at least 2 trust items when trust items are included`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Processes LetterStyleBlock content with special handling for letter formatting
 */
function processLetterStyleBlockContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate letter_body formatting
  if (content.letter_body && typeof content.letter_body === 'string') {
    if (!content.letter_body.includes('\\n')) {
      result.warnings.push(`${sectionId}: letter_body should include \\n for proper paragraph formatting`);
      result.hasIssues = true;
    }

    if (content.letter_body.length < 200) {
      result.warnings.push(`${sectionId}: letter_body seems too short for a personal letter`);
      result.hasIssues = true;
    }
  }

  // Validate ps_text if present
  if (content.ps_text && typeof content.ps_text === 'string') {
    if (!content.ps_text.toLowerCase().includes('p.s.')) {
      result.warnings.push(`${sectionId}: ps_text should start with 'P.S.' for proper letter format`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Processes VideoNoteWithTranscript content with special handling for transcript formatting
 */
function processVideoNoteWithTranscriptContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate transcript_text formatting
  if (content.transcript_text && typeof content.transcript_text === 'string') {
    if (!content.transcript_text.includes('\\n')) {
      result.warnings.push(`${sectionId}: transcript_text should include \\n for natural conversation breaks`);
      result.hasIssues = true;
    }

    if (content.transcript_text.length < 300) {
      result.warnings.push(`${sectionId}: transcript_text seems too short for a meaningful video transcript`);
      result.hasIssues = true;
    }

    // Check for conversational tone indicators
    const conversationalIndicators = ['I', 'you', 'we', 'our', 'my', 'your'];
    const hasConversationalTone = conversationalIndicators.some(indicator =>
      content.transcript_text.toLowerCase().includes(indicator.toLowerCase())
    );

    if (!hasConversationalTone) {
      result.warnings.push(`${sectionId}: transcript_text should sound conversational and personal`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Processes MissionQuoteOverlay content with special handling for mission stats
 */
function processMissionQuoteOverlayContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate mission stats progression
  const missionStatFields = ['mission_stat_1', 'mission_stat_2', 'mission_stat_3', 'mission_stat_4'];
  let statCount = 0;
  missionStatFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      statCount++;

      // Check if stat contains numbers
      const hasNumbers = /\d/.test(content[field] as string);
      if (!hasNumbers) {
        result.warnings.push(`${sectionId}: ${field} should include specific numbers for credibility`);
        result.hasIssues = true;
      }
    }
  });

  if (statCount > 0 && statCount < 2) {
    result.warnings.push(`${sectionId}: Should have at least 2 mission stats when stats are included`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Processes TimelineToToday content with special handling for timeline format
 */
function processTimelineTodayContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Process timeline_items (pipe-separated format: Year|Event|Description)
  if (content.timeline_items && typeof content.timeline_items === 'string') {
    const timelineItems = content.timeline_items.split('|').map(item => item.trim());
    if (timelineItems.length % 3 !== 0) {
      result.warnings.push(`${sectionId}: timeline_items should be in groups of 3 (Year|Event|Description format)`);
      result.hasIssues = true;
    } else if (timelineItems.length < 9) {
      result.warnings.push(`${sectionId}: timeline_items should have at least 3 timeline entries (9 pipe-separated values)`);
      result.hasIssues = true;
    } else {
      // Validate year format in timeline
      for (let i = 0; i < timelineItems.length; i += 3) {
        const year = timelineItems[i];
        if (!/^\d{4}$/.test(year)) {
          result.warnings.push(`${sectionId}: Timeline year "${year}" should be in YYYY format`);
          result.hasIssues = true;
        }
      }
    }
  }

  // Validate trust items progression
  const trustItemFields = ['trust_item_1', 'trust_item_2', 'trust_item_3', 'trust_item_4', 'trust_item_5'];
  let trustCount = 0;
  trustItemFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      trustCount++;
    }
  });

  if (trustCount > 0 && trustCount < 2) {
    result.warnings.push(`${sectionId}: Should have at least 2 trust items when trust items are included`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Processes SideBySidePhotoStory content with special handling for story stats
 */
function processSideBySidePhotoStoryContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate story stats progression
  const storyStatFields = ['story_stat_1', 'story_stat_2', 'story_stat_3', 'story_stat_4'];
  let statCount = 0;
  storyStatFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      statCount++;

      // Check if stat contains numbers
      const hasNumbers = /\d/.test(content[field] as string);
      if (!hasNumbers) {
        result.warnings.push(`${sectionId}: ${field} should include specific numbers for impact`);
        result.hasIssues = true;
      }
    }
  });

  if (statCount > 0 && statCount < 2) {
    result.warnings.push(`${sectionId}: Should have at least 2 story stats when stats are included`);
    result.hasIssues = true;
  }

  // Validate trust items progression
  const trustItemFields = ['trust_item_1', 'trust_item_2', 'trust_item_3', 'trust_item_4', 'trust_item_5'];
  let trustCount = 0;
  trustItemFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      trustCount++;
    }
  });

  if (trustCount > 0 && trustCount < 2) {
    result.warnings.push(`${sectionId}: Should have at least 2 trust items when trust items are included`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Processes StoryBlockWithPullquote content with special handling for pullquote extraction
 */
function processStoryBlockWithPullquoteContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate that pullquote relates to story content
  if (content.story_content && content.pullquote_text &&
      typeof content.story_content === 'string' && typeof content.pullquote_text === 'string') {

    // Check if pullquote appears to be extracted from story content
    const storyWords = content.story_content.toLowerCase().split(/\s+/);
    const pullquoteWords = content.pullquote_text.toLowerCase().split(/\s+/);

    // Look for word overlap
    const overlap = pullquoteWords.filter(word => storyWords.includes(word));
    if (overlap.length < pullquoteWords.length * 0.3) {
      result.warnings.push(`${sectionId}: pullquote_text should be extracted from or closely related to story_content`);
      result.hasIssues = true;
    }
  }

  // Validate trust items progression
  const trustItemFields = ['trust_item_1', 'trust_item_2', 'trust_item_3', 'trust_item_4', 'trust_item_5'];
  let trustCount = 0;
  trustItemFields.forEach(field => {
    if (content[field] && typeof content[field] === 'string' && content[field].length > 0) {
      trustCount++;
    }
  });

  if (trustCount > 0 && trustCount < 2) {
    result.warnings.push(`${sectionId}: Should have at least 2 trust items when trust items are included`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Processes FounderCardWithQuote content with basic validation
 */
function processFounderCardWithQuoteContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate quote authenticity indicators
  if (content.founder_quote && typeof content.founder_quote === 'string') {
    if (content.founder_quote.length < 50) {
      result.warnings.push(`${sectionId}: founder_quote seems too short for meaningful impact`);
      result.hasIssues = true;
    }

    if (content.founder_quote.length > 300) {
      result.warnings.push(`${sectionId}: founder_quote is too long for a card format - keep under 300 characters`);
      result.hasIssues = true;
    }
  }

  // Validate founder bio length
  if (content.founder_bio && typeof content.founder_bio === 'string') {
    if (content.founder_bio.length < 100) {
      result.warnings.push(`${sectionId}: founder_bio should provide meaningful credibility information`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Pricing Section Processing Functions - Enhanced for 5/5 completeness rating
 */

/**
 * Processes TierCards content with comprehensive validation for pricing accuracy
 */
function processTierCardsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate tier structure consistency
  if (content.tier_names && content.tier_prices) {
    const tierNames = parseContentArray(content.tier_names);
    const tierPrices = parseContentArray(content.tier_prices);

    if (tierNames.length !== tierPrices.length) {
      result.warnings.push(`${sectionId}: Mismatch between number of tier names (${tierNames.length}) and prices (${tierPrices.length})`);
      result.hasIssues = true;
    }

    // Validate pricing format
    tierPrices.forEach((price, index) => {
      if (typeof price === 'string' && !price.match(/^\$?\d+(\.\d{2})?(\s*\/\s*(month|mo|year|yr))?$/i)) {
        result.warnings.push(`${sectionId}: Tier ${index + 1} price "${price}" should follow format like "$29/month" or "$299"`);
        result.hasIssues = true;
      }
    });

    // Validate tier naming consistency
    tierNames.forEach((name, index) => {
      if (typeof name === 'string' && name.length < 3) {
        result.warnings.push(`${sectionId}: Tier ${index + 1} name "${name}" is too short for clarity`);
        result.hasIssues = true;
      }
    });
  }

  // Validate individual tier features
  const tierFeaturePattern = /tier_\d+_feature_\d+/;
  const tierFeatures = Object.keys(content).filter(key => tierFeaturePattern.test(key));

  if (tierFeatures.length > 0) {
    // Group features by tier
    const tierGroups: { [key: string]: string[] } = {};
    tierFeatures.forEach(feature => {
      const tierMatch = feature.match(/tier_(\d+)_feature_\d+/);
      if (tierMatch) {
        const tierNum = tierMatch[1];
        if (!tierGroups[tierNum]) tierGroups[tierNum] = [];
        tierGroups[tierNum].push(feature);
      }
    });

    // Validate each tier has meaningful features
    Object.entries(tierGroups).forEach(([tierNum, features]) => {
      const populatedFeatures = features.filter(f => content[f] && typeof content[f] === 'string' && content[f].toString().trim().length > 0);
      if (populatedFeatures.length > 0 && populatedFeatures.length < 3) {
        result.warnings.push(`${sectionId}: Tier ${tierNum} has only ${populatedFeatures.length} features - consider adding more for value clarity`);
        result.hasIssues = true;
      }
    });
  }

  // Validate trust indicators
  const trustItems = Object.keys(content).filter(key => key.includes('trust_item'));
  if (trustItems.length > 0) {
    const populatedTrustItems = trustItems.filter(key => content[key] && typeof content[key] === 'string' && content[key].toString().trim().length > 0);
    if (populatedTrustItems.length > 0 && populatedTrustItems.length < 2) {
      result.warnings.push(`${sectionId}: Should have at least 2 trust items when trust indicators are included`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Processes ToggleableMonthlyYearly content with billing validation
 */
function processToggleableMonthlyYearlyContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate monthly vs yearly pricing consistency
  if (content.monthly_prices && content.yearly_prices) {
    const monthlyPrices = parseContentArray(content.monthly_prices);
    const yearlyPrices = parseContentArray(content.yearly_prices);

    if (monthlyPrices.length !== yearlyPrices.length) {
      result.warnings.push(`${sectionId}: Mismatch between monthly (${monthlyPrices.length}) and yearly (${yearlyPrices.length}) pricing tiers`);
      result.hasIssues = true;
    }

    // Validate pricing logic (yearly should typically be discounted)
    for (let i = 0; i < Math.min(monthlyPrices.length, yearlyPrices.length); i++) {
      const monthlyPrice = parseFloat(monthlyPrices[i].toString().replace(/[^\d.]/g, ''));
      const yearlyPrice = parseFloat(yearlyPrices[i].toString().replace(/[^\d.]/g, ''));

      if (!isNaN(monthlyPrice) && !isNaN(yearlyPrice)) {
        const annualFromMonthly = monthlyPrice * 12;
        const savings = ((annualFromMonthly - yearlyPrice) / annualFromMonthly) * 100;

        if (savings < 10) {
          result.warnings.push(`${sectionId}: Tier ${i + 1} annual discount is only ${savings.toFixed(1)}% - consider increasing for better conversion`);
          result.hasIssues = true;
        }
        if (savings > 50) {
          result.warnings.push(`${sectionId}: Tier ${i + 1} annual discount is ${savings.toFixed(1)}% - verify this is realistic`);
          result.hasIssues = true;
        }
      }
    }
  }

  // Validate platform features structure
  const platformFeatures = Object.keys(content).filter(key => key.includes('platform_feature') && key.includes('title'));
  if (platformFeatures.length > 0) {
    platformFeatures.forEach(titleKey => {
      const descKey = titleKey.replace('title', 'desc');
      const iconKey = titleKey.replace('title', 'icon');

      if (!content[descKey] || !content[descKey].toString().trim()) {
        result.warnings.push(`${sectionId}: ${titleKey} has no corresponding description in ${descKey}`);
        result.hasIssues = true;
      }
    });
  }

  return result;
}

/**
 * Processes FeatureMatrix content with matrix validation
 */
function processFeatureMatrixContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate feature matrix structure
  if (content.feature_names && content.feature_categories && content.feature_availability) {
    const featureNames = parseContentArray(content.feature_names);
    const featureCategories = parseContentArray(content.feature_categories);
    const featureAvailability = parseContentArray(content.feature_availability);

    if (featureNames.length !== featureAvailability.length) {
      result.warnings.push(`${sectionId}: Feature names (${featureNames.length}) and availability (${featureAvailability.length}) arrays must match`);
      result.hasIssues = true;
    }

    // Validate feature availability format (should be like "✓|✓|✗" for 3 tiers)
    featureAvailability.forEach((availability, index) => {
      if (typeof availability === 'string') {
        const tierAvailability = availability.split('|');
        if (tierAvailability.length < 2) {
          result.warnings.push(`${sectionId}: Feature ${index + 1} availability "${availability}" should specify availability per tier (e.g., "✓|✓|✗")`);
          result.hasIssues = true;
        }
      }
    });

    // Validate feature categories distribution
    if (featureCategories.length < 2) {
      result.warnings.push(`${sectionId}: Should have at least 2 feature categories for meaningful comparison`);
      result.hasIssues = true;
    }
  }

  // Validate enterprise features section
  const enterpriseFeatures = Object.keys(content).filter(key => key.includes('enterprise_feature') && key.includes('title'));
  if (enterpriseFeatures.length > 0) {
    if (enterpriseFeatures.length < 2) {
      result.warnings.push(`${sectionId}: Enterprise section should have at least 2 features to justify premium positioning`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Processes SegmentBasedPricing content with segment validation
 */
function processSegmentBasedPricingContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate segment structure consistency
  if (content.segment_names && content.segment_descriptions && content.segment_use_cases) {
    const segmentNames = parseContentArray(content.segment_names);
    const segmentDescriptions = parseContentArray(content.segment_descriptions);
    const segmentUseCases = parseContentArray(content.segment_use_cases);

    if (segmentNames.length !== segmentDescriptions.length || segmentNames.length !== segmentUseCases.length) {
      result.warnings.push(`${sectionId}: Segment names, descriptions, and use cases must have matching lengths`);
      result.hasIssues = true;
    }

    // Validate segment differentiation
    segmentNames.forEach((name, index) => {
      if (typeof name === 'string' && name.length < 5) {
        result.warnings.push(`${sectionId}: Segment ${index + 1} name "${name}" should be more descriptive`);
        result.hasIssues = true;
      }
    });

    segmentUseCases.forEach((useCase, index) => {
      if (typeof useCase === 'string' && useCase.length < 30) {
        result.warnings.push(`${sectionId}: Segment ${index + 1} use case should be more detailed for clarity`);
        result.hasIssues = true;
      }
    });
  }

  // Validate tier features for segments
  if (content.tier_features) {
    const tierFeatures = parseContentArray(content.tier_features);
    tierFeatures.forEach((features, index) => {
      if (typeof features === 'string') {
        const featureList = features.split('|');
        if (featureList.length < 3) {
          result.warnings.push(`${sectionId}: Tier ${index + 1} should have at least 3 features for value justification`);
          result.hasIssues = true;
        }
      }
    });
  }

  return result;
}

/**
 * Processes SliderPricing content with usage-based validation
 */
function processSliderPricingContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate pricing configuration
  if (content.base_price && content.unit_price) {
    const basePrice = parseFloat(content.base_price.toString().replace(/[^\d.]/g, ''));
    const unitPrice = parseFloat(content.unit_price.toString().replace(/[^\d.]/g, ''));

    if (isNaN(basePrice) || isNaN(unitPrice)) {
      result.warnings.push(`${sectionId}: Base price and unit price must be valid numbers`);
      result.hasIssues = true;
    }

    if (basePrice > unitPrice * 10) {
      result.warnings.push(`${sectionId}: Base price (${basePrice}) seems high compared to unit price (${unitPrice}) - verify pricing structure`);
      result.hasIssues = true;
    }
  }

  // Validate unit configuration
  if (content.min_units && content.max_units && content.default_units) {
    const minUnits = parseInt(content.min_units.toString());
    const maxUnits = parseInt(content.max_units.toString());
    const defaultUnits = parseInt(content.default_units.toString());

    if (minUnits >= maxUnits) {
      result.warnings.push(`${sectionId}: min_units (${minUnits}) must be less than max_units (${maxUnits})`);
      result.hasIssues = true;
    }

    if (defaultUnits < minUnits || defaultUnits > maxUnits) {
      result.warnings.push(`${sectionId}: default_units (${defaultUnits}) must be between min_units (${minUnits}) and max_units (${maxUnits})`);
      result.hasIssues = true;
    }
  }

  // Validate tier breakpoints and discounts
  if (content.tier_breakpoints && content.tier_discounts) {
    const breakpoints = parseContentArray(content.tier_breakpoints);
    const discounts = parseContentArray(content.tier_discounts);

    if (breakpoints.length !== discounts.length) {
      result.warnings.push(`${sectionId}: Tier breakpoints and discounts must have matching lengths`);
      result.hasIssues = true;
    }

    // Validate breakpoint progression
    for (let i = 1; i < breakpoints.length; i++) {
      const current = parseInt(breakpoints[i].toString());
      const previous = parseInt(breakpoints[i - 1].toString());

      if (current <= previous) {
        result.warnings.push(`${sectionId}: Tier breakpoints must be in ascending order`);
        result.hasIssues = true;
        break;
      }
    }
  }

  return result;
}

/**
 * Processes CallToQuotePlan content with enterprise validation
 */
function processCallToQuotePlanContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate contact options structure
  if (content.contact_options && content.contact_ctas) {
    const contactOptions = parseContentArray(content.contact_options);
    const contactCtas = parseContentArray(content.contact_ctas);

    if (contactOptions.length !== contactCtas.length) {
      result.warnings.push(`${sectionId}: Contact options (${contactOptions.length}) and CTAs (${contactCtas.length}) must match`);
      result.hasIssues = true;
    }

    // Validate variety in contact methods
    if (contactOptions.length < 2) {
      result.warnings.push(`${sectionId}: Should provide at least 2 contact options for customer preference`);
      result.hasIssues = true;
    } else if (contactOptions.length > 4) {
      result.warnings.push(`${sectionId}: Too many contact options (${contactOptions.length}) may overwhelm users - consider 2-4 options`);
      result.hasIssues = true;
    }

    // Validate CTA text quality
    contactCtas.forEach((cta, index) => {
      if (typeof cta === 'string' && cta.length < 5) {
        result.warnings.push(`${sectionId}: Contact CTA ${index + 1} "${cta}" should be more descriptive`);
        result.hasIssues = true;
      }
    });
  }

  // Validate value proposition length
  if (content.value_proposition && typeof content.value_proposition === 'string') {
    if (content.value_proposition.length < 50) {
      result.warnings.push(`${sectionId}: Value proposition should be more detailed for enterprise audience`);
      result.hasIssues = true;
    }
    if (content.value_proposition.length > 300) {
      result.warnings.push(`${sectionId}: Value proposition is too long - keep it concise for executive attention`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Processes CardWithTestimonial content with social proof validation
 */
function processCardWithTestimonialContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate testimonial authenticity
  if (content.testimonial_quote && typeof content.testimonial_quote === 'string') {
    if (content.testimonial_quote.length < 50) {
      result.warnings.push(`${sectionId}: Testimonial quote should be more substantial for credibility`);
      result.hasIssues = true;
    }
    if (content.testimonial_quote.length > 200) {
      result.warnings.push(`${sectionId}: Testimonial quote is too long for card format - keep under 200 characters`);
      result.hasIssues = true;
    }

    // Check for generic testimonial language
    const genericPhrases = ['great product', 'amazing service', 'highly recommend', 'best ever'];
    const hasGenericLanguage = genericPhrases.some(phrase =>
      content.testimonial_quote.toLowerCase().includes(phrase)
    );

    if (hasGenericLanguage) {
      result.warnings.push(`${sectionId}: Testimonial contains generic language - consider more specific, outcome-focused quotes`);
      result.hasIssues = true;
    }
  }

  // Validate social metrics structure
  const socialMetrics = Object.keys(content).filter(key => key.includes('social_metric_') && !key.includes('label'));
  const socialLabels = Object.keys(content).filter(key => key.includes('social_metric_') && key.includes('label'));

  if (socialMetrics.length !== socialLabels.length) {
    result.warnings.push(`${sectionId}: Social metrics and labels must have matching counts`);
    result.hasIssues = true;
  }

  // Validate social metrics realism
  socialMetrics.forEach((metricKey, index) => {
    const metric = content[metricKey];
    if (typeof metric === 'string') {
      const numericValue = parseInt(metric.replace(/[^\d]/g, ''));
      if (!isNaN(numericValue)) {
        if (numericValue > 1000000) {
          result.warnings.push(`${sectionId}: Social metric ${index + 1} (${numericValue}) seems unrealistically high - verify accuracy`);
          result.hasIssues = true;
        }
        if (numericValue < 10) {
          result.warnings.push(`${sectionId}: Social metric ${index + 1} (${numericValue}) may be too low for credibility`);
          result.hasIssues = true;
        }
      }
    }
  });

  // Validate guarantee section
  if (content.guarantee_title || content.guarantee_description) {
    if (content.guarantee_title && typeof content.guarantee_title === 'string' && content.guarantee_title.length < 10) {
      result.warnings.push(`${sectionId}: Guarantee title should be more descriptive`);
      result.hasIssues = true;
    }

    if (content.guarantee_description && typeof content.guarantee_description === 'string' && content.guarantee_description.length < 30) {
      result.warnings.push(`${sectionId}: Guarantee description should provide clear terms`);
      result.hasIssues = true;
    }
  }

  return result;
}

/**
 * Processes MiniStackedCards content with compact format validation
 */
function processMiniStackedCardsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: { ...content },
    warnings: [] as string[],
    hasIssues: false
  };

  // Validate FAQ structure
  const faqQuestions = Object.keys(content).filter(key => key.includes('faq_question_'));
  const faqAnswers = Object.keys(content).filter(key => key.includes('faq_answer_'));

  if (faqQuestions.length !== faqAnswers.length) {
    result.warnings.push(`${sectionId}: FAQ questions (${faqQuestions.length}) and answers (${faqAnswers.length}) must match`);
    result.hasIssues = true;
  }

  // Validate FAQ content quality
  faqQuestions.forEach((questionKey, index) => {
    const answerKey = questionKey.replace('question', 'answer');
    const question = content[questionKey];
    const answer = content[answerKey];

    if (typeof question === 'string' && question.length < 10) {
      result.warnings.push(`${sectionId}: FAQ question ${index + 1} should be more detailed`);
      result.hasIssues = true;
    }

    if (typeof answer === 'string' && answer.length < 20) {
      result.warnings.push(`${sectionId}: FAQ answer ${index + 1} should provide more comprehensive information`);
      result.hasIssues = true;
    }
  });

  // Validate plans features structure
  const plansFeatures = Object.keys(content).filter(key => key.includes('plans_feature_') && key.includes('title'));
  if (plansFeatures.length > 0) {
    plansFeatures.forEach((titleKey, index) => {
      const descKey = titleKey.replace('title', 'desc');
      if (!content[descKey] || !content[descKey].toString().trim()) {
        result.warnings.push(`${sectionId}: Plans feature ${index + 1} title has no corresponding description`);
        result.hasIssues = true;
      }
    });

    if (plansFeatures.length < 2) {
      result.warnings.push(`${sectionId}: Should have at least 2 plan features to highlight value`);
      result.hasIssues = true;
    }
  }

  // Validate trust indicators structure
  const trustItems = Object.keys(content).filter(key => key.includes('trust_item_') && !key.includes('show_'));
  const showTrustItems = Object.keys(content).filter(key => key.includes('show_trust_item_'));

  if (trustItems.length > 0 && showTrustItems.length === 0) {
    result.warnings.push(`${sectionId}: Trust items defined but no show/hide flags found - consider adding visibility controls`);
    result.hasIssues = true;
  }

  // Validate compact format constraints
  if (content.tier_descriptions) {
    const descriptions = parseContentArray(content.tier_descriptions);
    descriptions.forEach((desc, index) => {
      if (typeof desc === 'string' && desc.length > 100) {
        result.warnings.push(`${sectionId}: Tier ${index + 1} description is too long for mini card format - keep under 100 characters`);
        result.hasIssues = true;
      }
    });
  }

  return result;
}

/**
 * Helper function to parse content that might be a string or array
 */
function parseContentArray(content: string | string[]): string[] {
  if (Array.isArray(content)) {
    return content;
  }
  if (typeof content === 'string') {
    return content.split('|').map((item: string) => item.trim()).filter(Boolean);
  }
  return [];
}
