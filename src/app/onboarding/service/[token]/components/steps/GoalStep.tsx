'use client';

// scale-05 phase 9 — intent-first service goal step. Shows the businessType's
// `likelyIntents` (serviceType → businessType: agency→agency,
// consultancy→consultant, coaching→coach; default agency) as OptionCards,
// pre-selects the store/prefill `goalIntent` (the AI `goalIntentGuess` lands
// there via briefToServicePrefill), and reveals the full 18-intent vocabulary
// behind an inline "Other goals" expand (no modal). On pick it sets BOTH the
// real `goalIntent` AND the mirrored legacy `goal` (via intentToLegacyGoal) so
// every downstream generation path stays untouched.

import { useEffect, useState } from 'react';
import { useServiceGenerationStore } from '@/hooks/useServiceGenerationStore';
import { Button } from '@/components/ui/button';
import { usePostHog } from 'posthog-js/react';
import type { ServiceType } from '@/types/service';
import { intentToLegacyGoal } from '@/modules/brief/bridge';
import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';
import { goalIntents, goalIntentMeta, type GoalIntent } from '@/modules/goals/vocabulary';
import OptionCard from '@/components/onboarding/shared/OptionCard';
import GoalParamFields, {
  intentHasParamFields,
  intentParamSatisfied,
} from '@/components/onboarding/shared/GoalParamFields';
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

/** serviceType → businessType (inverse of bridge's BUSINESS_TYPE_TO_SERVICE_TYPE). */
const SERVICE_TYPE_TO_BUSINESS_TYPE: Partial<Record<ServiceType, BusinessTypeKey>> = {
  agency: 'agency',
  consultancy: 'consultant',
  coaching: 'coach',
};

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
  'enquiry': 'Get enquiries from prospective clients',
  'request-quote': 'Visitors ask for a custom, scoped estimate',
  'book-call': 'Guide visitors to book a discovery call',
  'request-demo': 'Schedule a walkthrough',
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
  const posthog = usePostHog();
  const goalIntent = useServiceGenerationStore((s) => s.goalIntent);
  const setGoal = useServiceGenerationStore((s) => s.setGoal);
  const setGoalIntent = useServiceGenerationStore((s) => s.setGoalIntent);
  const goalParam = useServiceGenerationStore((s) => s.goalParam);
  const setGoalParam = useServiceGenerationStore((s) => s.setGoalParam);
  const nextStep = useServiceGenerationStore((s) => s.nextStep);
  const understanding = useServiceGenerationStore((s) => s.understanding);

  // businessType resolution (scale-05 phase 9): serviceType → businessType,
  // default agency. (The service store carries no brief.businessType override.)
  const businessTypeKey =
    SERVICE_TYPE_TO_BUSINESS_TYPE[understanding?.serviceType as ServiceType] ?? 'agency';
  const likelyIntents = businessTypes[businessTypeKey].likelyIntents;

  const selectedIntent: GoalIntent = goalIntent ?? likelyIntents[0];

  const [showAll, setShowAll] = useState<boolean>(
    goalIntent !== null && !likelyIntents.includes(goalIntent)
  );

  useEffect(() => {
    // Default the store to the current selection so a user who hits Continue
    // immediately still has an intent + mirrored legacy goal set.
    setGoalIntent(selectedIntent);
    setGoal(intentToLegacyGoal(selectedIntent, 'service'));
    posthog?.capture('service_onboarding_step_view', {
      step: 'goal',
      stepIndex: 2,
      audienceType: 'service',
      goal: selectedIntent,
    });
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showParamFields = intentHasParamFields(selectedIntent);
  const canProceed = intentParamSatisfied(selectedIntent, goalParam);

  const otherIntents = goalIntents.filter((i) => !likelyIntents.includes(i));

  const handleSelect = (intent: GoalIntent) => {
    if (intent !== goalIntent) setGoalParam({}); // stale params don't cross intents
    setGoalIntent(intent);
    // Mirror to the legacy enum so all downstream generation plumbing keeps
    // working (design call #4). The real intent is what writeback prefers.
    setGoal(intentToLegacyGoal(intent, 'service'));
  };

  const handleContinue = () => {
    posthog?.capture('service_onboarding_step_submit', {
      step: 'goal',
      audienceType: 'service',
      goal: selectedIntent,
    });
    nextStep();
  };

  const renderCard = (intent: GoalIntent) => (
    <OptionCard
      key={intent}
      icon={goalIntentIcons[intent]}
      label={goalIntentMeta[intent].label}
      description={goalIntentDescriptions[intent]}
      selected={selectedIntent === intent}
      onClick={() => handleSelect(intent)}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What should the page get visitors to do?
        </h1>
        <p className="mt-2 text-gray-600">
          Pick the single most important action. It shapes the call-to-action
          copy and the form we suggest.
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

      {showParamFields && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <GoalParamFields
            intent={selectedIntent}
            value={goalParam}
            onChange={setGoalParam}
          />
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={!canProceed}
        className="w-full bg-brand-accentPrimary hover:bg-orange-500"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
