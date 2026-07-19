// Shared plain-language engine copy for the decider screens (engineDecider
// Phase 3 follow-up). Lives here — not on any single screen — so nothing imports
// from a deleted component. D2Known was cut (the clear/known path now skips
// straight through the silent FinalizeHandoff), so its former exports
// (`ENGINE_LEAD` + `ENGINE_QUESTION`) moved here. Consumed by D3AlmostSure today;
// D4 (Phase 4) will reuse it too.
//
// NO engine jargon surfaces in this copy — the closed-5 engine names never
// appear in user-facing text. Phase 7 does the final humanization + icon pass.
//
// Firewall: pure `@/modules/brief` types + lucide only. No template/generation graph.

import { BadgeCheck, Boxes, Images, Store, Zap } from 'lucide-react';
import { createElement, type ReactNode } from 'react';
import type { ResolvedEngine } from '@/modules/brief/classify';

/** Plain-language "how you win" copy per engine (no engine jargon surfaces). */
export const ENGINE_LEAD: Record<
  ResolvedEngine,
  { label: string; descriptor: string; lead: string; icon: ReactNode }
> = {
  work: {
    label: 'Lead with your work',
    descriptor: 'your portfolio does the talking',
    lead: 'so your site will lead with your work',
    icon: createElement(Images, { className: 'w-[18px] h-[18px]' }),
  },
  trust: {
    label: 'Lead with your experience',
    descriptor: 'people trust your track record',
    lead: 'so your site will lead with your experience',
    icon: createElement(BadgeCheck, { className: 'w-[18px] h-[18px]' }),
  },
  thing: {
    label: 'Lead with your product',
    descriptor: 'what it does, made obvious',
    lead: 'so your site will lead with what your product does',
    icon: createElement(Boxes, { className: 'w-[18px] h-[18px]' }),
  },
  place: {
    label: 'Lead with your place',
    descriptor: 'your space, menu or location',
    lead: 'so your site will lead with your place',
    icon: createElement(Store, { className: 'w-[18px] h-[18px]' }),
  },
  'quick-yes': {
    label: 'One clear ask',
    descriptor: 'they already know you — just act',
    lead: 'so your site will make one clear ask',
    icon: createElement(Zap, { className: 'w-[18px] h-[18px]' }),
  },
};

/** Plain-language buyer-decision question per engine (no jargon). */
export const ENGINE_QUESTION: Record<ResolvedEngine, string> = {
  work: 'Sounds like people pick you once they see your work — is that right?',
  trust: 'Sounds like people hire you for your experience — is that right?',
  thing: 'Sounds like people decide once they get what your product does — is that right?',
  place: 'Sounds like people decide once they see your place — is that right?',
  'quick-yes': 'Sounds like people already know you and just need one clear ask — is that right?',
};
