'use client';

// scale-05 phase 9 — intent-first product goal step. Shows the businessType's
// `likelyIntents` (manufacturer flow → manufacturer, else saas) as OptionCards,
// pre-selects the store/prefill `goalIntent` (the AI `goalIntentGuess` lands
// there via briefToProductPrefill), and reveals the full 18-intent vocabulary
// behind an inline "Other goals" expand (no modal). On pick it sets BOTH the
// real `goalIntent` AND the mirrored legacy `landingGoal` (via
// intentToLegacyGoal) so every downstream generation path stays untouched.

import { useState } from 'react';
import { useProductGenerationStore } from '@/hooks/useProductGenerationStore';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import { intentToLegacyGoal } from '@/modules/brief/bridge';
import { businessTypes } from '@/modules/businessTypes/config';
import { goalIntents, goalIntentMeta, type GoalIntent } from '@/modules/goals/vocabulary';
import OptionCard from '@/components/onboarding/shared/OptionCard';
import GoalParamFields, {
  intentHasParamFields,
  intentParamSatisfied,
} from '@/components/onboarding/shared/GoalParamFields';
import { Button } from '@/components/ui/button';
import {
  Mail,
  FileText,
  Calendar,
  MonitorPlay,
  CalendarCheck,
  GraduationCap,
  ClipboardCheck,
  Gift,
  ClipboardList,
  UserPlus,
  PlayCircle,
  Download,
  CreditCard,
  ShoppingBag,
  Wallet,
  Inbox,
  Heart,
  CalendarClock,
} from 'lucide-react';

const goalIntentIcons: Record<GoalIntent, React.ReactNode> = {
  'enquiry': <Mail className="w-6 h-6" />,
  'request-quote': <FileText className="w-6 h-6" />,
  'book-call': <Calendar className="w-6 h-6" />,
  'request-demo': <MonitorPlay className="w-6 h-6" />,
  'book-me': <CalendarCheck className="w-6 h-6" />,
  'enroll': <GraduationCap className="w-6 h-6" />,
  'apply': <ClipboardCheck className="w-6 h-6" />,
  'lead-magnet': <Gift className="w-6 h-6" />,
  'waitlist': <ClipboardList className="w-6 h-6" />,
  'signup-free': <UserPlus className="w-6 h-6" />,
  'free-trial': <PlayCircle className="w-6 h-6" />,
  'download-app': <Download className="w-6 h-6" />,
  'buy-via-link': <CreditCard className="w-6 h-6" />,
  'order-via-platform': <ShoppingBag className="w-6 h-6" />,
  'pay-via-link': <Wallet className="w-6 h-6" />,
  'subscribe-newsletter': <Inbox className="w-6 h-6" />,
  'follow-social': <Heart className="w-6 h-6" />,
  'rsvp': <CalendarClock className="w-6 h-6" />,
};

const goalIntentDescriptions: Record<GoalIntent, string> = {
  'enquiry': 'Get enquiries / quote requests from buyers',
  'request-quote': 'Visitors ask for a custom, scoped estimate',
  'book-call': 'Guide visitors to book a call with you',
  'request-demo': 'Schedule a product walkthrough',
  'book-me': 'Get hired for an event or engagement',
  'enroll': 'Register for a course or program',
  'apply': 'Submit an application',
  'lead-magnet': 'Capture leads with a free resource',
  'waitlist': 'Collect emails for early access',
  'signup-free': 'Create an account to get started',
  'free-trial': 'Try the product for free',
  'download-app': 'Get the app from the store',
  'buy-via-link': 'Purchase via an external checkout',
  'order-via-platform': 'Order / reserve via a platform',
  'pay-via-link': 'Pay or donate via a link',
  'subscribe-newsletter': 'Grow an email audience',
  'follow-social': 'Grow a social following',
  'rsvp': 'Get visitors to attend an event',
};

export default function GoalStep() {
  const goalIntent = useProductGenerationStore((s) => s.goalIntent);
  const setLandingGoal = useProductGenerationStore((s) => s.setLandingGoal);
  const setGoalIntent = useProductGenerationStore((s) => s.setGoalIntent);
  const goalParam = useProductGenerationStore((s) => s.goalParam);
  const setGoalParam = useProductGenerationStore((s) => s.setGoalParam);
  const nextStep = useProductGenerationStore((s) => s.nextStep);
  const templateId = useProductGenerationStore((s) => s.templateId);

  // businessType resolution (scale-05 phase 9): manufacturer flow → manufacturer,
  // else saas. (The product store carries no brief.businessType to override.)
  const businessTypeKey = isManufacturerFlow(templateId) ? 'manufacturer' : 'saas';
  const likelyIntents = businessTypes[businessTypeKey].likelyIntents;

  const selectedIntent = goalIntent;

  // Auto-open "Other" when the pre-selected intent isn't one of the likely few
  // (e.g. the AI guessed a different intent, or a prior "Other" pick).
  const [showAll, setShowAll] = useState<boolean>(
    selectedIntent !== null && !likelyIntents.includes(selectedIntent)
  );

  // Goal-slot param capture (scale-05 phase 1): intents that need a param pause
  // the auto-advance and show GoalParamFields + Continue/Skip.
  const showParamFields = selectedIntent !== null && intentHasParamFields(selectedIntent);
  const canProceed =
    selectedIntent !== null && intentParamSatisfied(selectedIntent, goalParam);

  const otherIntents = goalIntents.filter((i) => !likelyIntents.includes(i));

  const handleSelect = (intent: GoalIntent) => {
    if (intent !== goalIntent) setGoalParam({}); // stale params don't cross intents
    setGoalIntent(intent);
    // Mirror to the legacy enum so all downstream generation plumbing keeps
    // working (design call #4). The real intent is what writeback prefers.
    setLandingGoal(intentToLegacyGoal(intent, 'product'));
    if (!intentHasParamFields(intent)) {
      nextStep(); // Auto-advance (original behavior for param-less intents)
    }
  };

  const renderCard = (intent: GoalIntent) => (
    <OptionCard
      key={intent}
      icon={goalIntentIcons[intent]}
      label={goalIntentMeta[intent].label}
      description={goalIntentDescriptions[intent]}
      selected={goalIntent === intent}
      onClick={() => handleSelect(intent)}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What should visitors do?
        </h1>
        <p className="mt-2 text-gray-600">
          Choose the primary action for your landing page
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {likelyIntents.map(renderCard)}
      </div>

      {!showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm font-medium text-brand-accentPrimary hover:text-orange-500"
        >
          Other goals…
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">Other goals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherIntents.map(renderCard)}
          </div>
        </div>
      )}

      {showParamFields && selectedIntent && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <GoalParamFields
            intent={selectedIntent}
            value={goalParam}
            onChange={setGoalParam}
          />
          <div className="flex items-center gap-4">
            <Button
              onClick={nextStep}
              disabled={!canProceed}
              className="bg-brand-accentPrimary hover:bg-orange-500"
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={() => {
                setGoalParam({});
                nextStep();
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
