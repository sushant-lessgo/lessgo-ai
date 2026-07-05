// Manufacturer-flow signal (onboarding1, D1).
//
// This is the SINGLE place where the manufacturer↔vestria 1:1 assumption
// lives. Today "manufacturer persona" is exactly "templateId === 'vestria'";
// when onboarding2 breaks that 1:1, ONLY this helper changes.
//
// Plain module — no 'use client'. Must stay importable by both server routes
// (understand / scrape-website / strategy) and client onboarding steps.

export function isManufacturerFlow(templateId: string | null | undefined): boolean {
  return templateId === 'vestria';
}
