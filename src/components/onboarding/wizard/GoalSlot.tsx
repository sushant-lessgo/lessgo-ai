'use client';

// scale-06 phase 4 — the UNIFIED intent-first GOAL slot.
//
// Ports the scale-05 intent-first GoalStep (service/product) onto `useWizardStore`
// instead of the old per-audience generation stores. Shows the businessType's
// `likelyIntents` as OptionCards (pre-selecting the store/prefill `goalIntent`),
// reveals the full 18-intent vocabulary behind an inline "Other goals" expand,
// and collects the per-intent params via the shared GoalParamFields.
//
// On save (WizardShell.save → buildBriefPatch) the store composes `brief.goal`
// via `intentToBriefGoal`. LEGACY-ENUM MIRRORING IS NOT DONE HERE — that lives in
// the phase-5 generation adapters; the old stores stay untouched (D "old code").
//
// CARRY-FORWARD (phase-1 review): goal-param convergence lives IN THIS SLOT, not
// the waterfall — the waterfall marks `goal` inferred once `brief.goal.intent`
// exists (even with no param). So GoalSlot ALWAYS renders and ALWAYS collects the
// param; it is never skipped just because an intent was pre-filled.
//
// FIREWALL: client-only. Reads/writes `useWizardStore`; no template/renderer imports.

import { useEffect, useState } from 'react';
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
import { useWizardStore } from '@/hooks/useWizardStore';
import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';
import { goalIntents, goalIntentMeta, type GoalIntent } from '@/modules/goals/vocabulary';
import OptionCard from '@/components/onboarding/shared/OptionCard';
import GoalParamFields, {
  intentHasParamFields,
  intentParamRequired,
  intentParamSatisfied,
} from '@/components/onboarding/shared/GoalParamFields';

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

export default function GoalSlot() {
  const businessTypeKey = useWizardStore((s) => s.businessTypeKey);
  const goalIntent = useWizardStore((s) => s.goalIntent);
  const goalParam = useWizardStore((s) => s.goalParam);
  const goalParamSkipped = useWizardStore((s) => s.goalParamSkipped);
  const setGoalIntent = useWizardStore((s) => s.setGoalIntent);
  const setGoalParam = useWizardStore((s) => s.setGoalParam);
  const setGoalParamSkipped = useWizardStore((s) => s.setGoalParamSkipped);

  // likelyIntents from the resolved businessType; fall back to the full list
  // when the businessType is unknown (never trap the user without options).
  const likelyIntents =
    (businessTypeKey && (businessTypes[businessTypeKey as BusinessTypeKey]?.likelyIntents)) ||
    ([] as readonly GoalIntent[]);
  const fallbackFirst = likelyIntents[0] ?? goalIntents[0];
  const selectedIntent: GoalIntent = goalIntent ?? fallbackFirst;

  // Always keep a card VISIBLY selected (F20): when the businessType has no
  // likelyIntents to render, expand the full list so the pre-selected default
  // is on screen instead of silently defaulting behind an "Other goals…" link.
  const [showAll, setShowAll] = useState<boolean>(
    (goalIntent !== null && !likelyIntents.includes(goalIntent)) ||
      likelyIntents.length === 0
  );

  // Default the store to the current selection so a user who never taps still
  // has an intent (param composition happens on save via intentToBriefGoal).
  useEffect(() => {
    if (!goalIntent) setGoalIntent(selectedIntent);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const otherIntents = goalIntents.filter((i) => !likelyIntents.includes(i));
  const showParamFields = intentHasParamFields(selectedIntent);
  // A REQUIRED, still-empty param blocks Continue (gated in WizardShell) unless
  // the user explicitly skips it (F14).
  const paramGateOpen =
    intentParamRequired(selectedIntent) &&
    !intentParamSatisfied(selectedIntent, goalParam) &&
    !goalParamSkipped;

  const handleSelect = (intent: GoalIntent) => {
    if (intent !== goalIntent) setGoalParam({}); // stale params don't cross intents
    setGoalIntent(intent);
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

      {likelyIntents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {likelyIntents.map(renderCard)}
        </div>
      )}

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
          {likelyIntents.length > 0 && (
            <p className="text-sm font-medium text-gray-500">Other goals</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherIntents.map(renderCard)}
          </div>
        </div>
      )}

      {showParamFields && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <GoalParamFields
            intent={selectedIntent}
            value={goalParam}
            onChange={setGoalParam}
          />
          {paramGateOpen && (
            <div className="space-y-3 pt-1">
              {/* F14: a required-but-empty param blocks Continue — explain the
                  block right where the user is looking, and make the escape
                  hatch a prominent secondary button (not a faint text link). */}
              <p className="text-sm text-gray-600">
                Add the link, or skip for now to continue.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setGoalParamSkipped(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Skip for now
                </button>
                <span className="text-sm text-gray-500">
                  You can add the link later in the editor.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
