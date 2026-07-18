// src/lib/leadReply/messageExtraction.ts
// PURE, dependency-free lead-message extraction for the dashboard "Draft reply"
// affordance. No 'use client', no prisma, no next/*, no AI — a plain module.
//
// This is the ONE shared gate for BOTH the client UI affordance (the pane) and
// the server route: `hasReplyableMessage(data)` decides whether a submission has
// a real, replyable message. Keeping a single source of truth guarantees the UI
// never offers a draft the route would refuse (and vice-versa).
//
// NOTE: `previewOf` in `LeadsInbox.tsx` deliberately picks *contact* fields
// (name/email) to label a row. This module is the INVERSE — it finds the free
// text a human wrote. Do NOT merge the two heuristics.

/** Keys whose name signals an explicit message field (checked as substrings). */
const MESSAGE_KEY_HINTS = ['message', 'comment', 'note', 'enquiry', 'inquiry'];

/** Contact-field key fragments — never the message (they carry name/email/phone). */
const CONTACT_KEY_HINTS = [
  'name',
  'email',
  'e-mail',
  'phone',
  'mobile',
  'tel',
  'whatsapp',
  'contact',
];

/**
 * Non-message key denylist (N2). Free-text-ish values that are NOT a message —
 * a long `company: "Acme Corporation Ltd"` must not clear the substance floor
 * and offer a draft on a no-real-message submission.
 */
const NON_MESSAGE_KEY_HINTS = [
  'company',
  'organization',
  'organisation',
  'business',
  'subject',
  'budget',
  'website',
  'url',
  'link',
  'city',
  'state',
  'country',
  'address',
  'zip',
  'postcode',
  'role',
  'title',
  'position',
  'occupation',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)\S+$/i;
// A value that is "mostly digits" (phone-like): after stripping +/-/()/spaces,
// 6+ chars all digits.
const PHONE_RE = /^[+\d][\d\s()\-.]{5,}$/;

function keyContainsAny(key: string, hints: string[]): boolean {
  const k = key.toLowerCase();
  return hints.some((h) => k.includes(h));
}

/** Does the value look like a bare email / phone / URL (i.e. not prose)? */
function looksLikeContactValue(value: string): boolean {
  return EMAIL_RE.test(value) || URL_RE.test(value) || PHONE_RE.test(value);
}

/** Substance floor: ≥ 2 words OR ≥ 8 chars, so `"yes"` / `"ok"` don't count. */
function hasSubstance(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  return words.length >= 2 || value.length >= 8;
}

/**
 * Extract the lead's free-text message from a form submission's `data` map.
 *
 * Heuristic:
 *   (a) first key whose name signals a message field (message/comment/note/
 *       enquiry/inquiry) with a substantive, non-empty value; else
 *   (b) the longest substantive free-text value whose key is NOT a contact
 *       field and NOT on the non-message denylist, and whose value doesn't
 *       itself look like an email/phone/URL; else
 *   (c) null.
 *
 * Values are trimmed; only substantive values (≥ 2 words or ≥ 8 chars) qualify.
 */
export function extractLeadMessage(
  data: Record<string, string> | null | undefined
): { key: string; value: string } | null {
  if (!data || typeof data !== 'object') return null;

  // (a) explicit message-named key.
  for (const [key, raw] of Object.entries(data)) {
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) continue;
    if (keyContainsAny(key, MESSAGE_KEY_HINTS) && hasSubstance(value)) {
      return { key, value };
    }
  }

  // (b) longest free-text value from a non-contact, non-denylisted key.
  let best: { key: string; value: string } | null = null;
  for (const [key, raw] of Object.entries(data)) {
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) continue;
    if (keyContainsAny(key, CONTACT_KEY_HINTS)) continue;
    if (keyContainsAny(key, NON_MESSAGE_KEY_HINTS)) continue;
    if (looksLikeContactValue(value)) continue;
    if (!hasSubstance(value)) continue;
    if (!best || value.length > best.value.length) {
      best = { key, value };
    }
  }

  return best;
}

/**
 * Thin wrapper — the single shared gate for the UI affordance and the route.
 * `true` iff the submission carries a real, replyable message.
 */
export function hasReplyableMessage(
  data: Record<string, string> | null | undefined
): boolean {
  return extractLeadMessage(data) !== null;
}
