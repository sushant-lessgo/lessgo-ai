
export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type CopyIntent = "pain-led" | "desire-led";

export type StartupStageGroup =
  | "idea"
  | "mvp"
  | "traction"
  | "growth"
  | "scale";

export type FounderNoteLayout =
  | "FounderCardWithQuote"
  | "LetterStyleBlock"
  | "VideoNoteWithTranscript"
  | "MissionQuoteOverlay"
  | "TimelineToToday"
  | "SideBySidePhotoStory"
  | "StoryBlockWithPullquote"
  | "FoundersBeliefStack";

interface LayoutPickerInput {
  toneProfile: ToneProfile;
  copyIntent: CopyIntent;
  startupStageGroup: StartupStageGroup;
}

export function pickFounderNoteLayout({
  toneProfile,
  copyIntent,
  startupStageGroup,
}: LayoutPickerInput): FounderNoteLayout {
  // Priority rules
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    return "FounderCardWithQuote";
  }

  if (copyIntent === "pain-led" && toneProfile === "bold-persuasive") {
    return "LetterStyleBlock";
  }

  if (copyIntent === "desire-led" && toneProfile === "luxury-expert") {
    return "MissionQuoteOverlay";
  }

  if (toneProfile === "confident-playful" || toneProfile === "friendly-helpful") {
    return "SideBySidePhotoStory";
  }

  if (toneProfile === "minimal-technical") {
    return "VideoNoteWithTranscript";
  }

  if (startupStageGroup === "growth" || startupStageGroup === "scale") {
    return "TimelineToToday";
  }

  if (copyIntent === "desire-led" && toneProfile === "friendly-helpful") {
    return "FoundersBeliefStack";
  }

  // Fallback default
  return "StoryBlockWithPullquote";
}
