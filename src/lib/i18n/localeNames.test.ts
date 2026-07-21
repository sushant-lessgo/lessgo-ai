// language-settings phase 1 — locale name maps + label↔code mapping.
//
// The load-bearing distinction pinned here: NATIVE names are UI-only, ENGLISH
// EXONYMS are what reaches an AI prompt (ruling 3). A regression that fed
// `LOCALE_DISPLAY_NAMES` to prompts would produce "unless Nederlands IS
// English" in the generation instructions.

import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES } from './localeContent';
import {
  LOCALE_DISPLAY_NAMES,
  LOCALE_ENGLISH_NAMES,
  LOCALE_LABEL_TO_CODE,
  labelToLocaleCode,
  localeLabel,
  toPromptLanguage,
} from './localeNames';

describe('localeNames — map parity', () => {
  it('every SUPPORTED_LOCALES code has BOTH a native display name and an English name', () => {
    for (const code of SUPPORTED_LOCALES) {
      expect(LOCALE_DISPLAY_NAMES[code], `display name for ${code}`).toBeTruthy();
      expect(LOCALE_ENGLISH_NAMES[code], `english name for ${code}`).toBeTruthy();
    }
  });

  it('neither map carries codes outside SUPPORTED_LOCALES', () => {
    const supported = new Set<string>(SUPPORTED_LOCALES as readonly string[]);
    expect(Object.keys(LOCALE_DISPLAY_NAMES).filter((c) => !supported.has(c))).toEqual([]);
    expect(Object.keys(LOCALE_ENGLISH_NAMES).filter((c) => !supported.has(c))).toEqual([]);
  });

  it('the two maps are genuinely different vocabularies (native ≠ exonym where they should differ)', () => {
    expect(LOCALE_DISPLAY_NAMES.nl).toBe('Nederlands');
    expect(LOCALE_ENGLISH_NAMES.nl).toBe('Dutch');
    expect(LOCALE_DISPLAY_NAMES.ja).toBe('日本語');
    expect(LOCALE_ENGLISH_NAMES.ja).toBe('Japanese');
    // 'en' is the one legitimate coincidence.
    expect(LOCALE_DISPLAY_NAMES.en).toBe('English');
    expect(LOCALE_ENGLISH_NAMES.en).toBe('English');
  });
});

describe('toPromptLanguage', () => {
  it('maps a code to its English exonym, never the native name', () => {
    expect(toPromptLanguage('nl')).toBe('Dutch');
    expect(toPromptLanguage('nl')).not.toBe('Nederlands');
    expect(toPromptLanguage('de')).toBe('German');
    expect(toPromptLanguage('ja')).toBe('Japanese');
    expect(toPromptLanguage('en')).toBe('English');
  });

  it('falls back to the raw code for an unknown locale (callers validate first)', () => {
    expect(toPromptLanguage('xx')).toBe('xx');
    expect(toPromptLanguage('')).toBe('');
  });
});

describe('localeLabel', () => {
  it('returns the native name, and uppercases an unmapped code', () => {
    expect(localeLabel('nl')).toBe('Nederlands');
    expect(localeLabel('hi')).toBe('HI');
  });
});

describe('labelToLocaleCode', () => {
  it('maps English exonyms to codes', () => {
    expect(labelToLocaleCode('Dutch')).toBe('nl');
    expect(labelToLocaleCode('English')).toBe('en');
    expect(labelToLocaleCode('Japanese')).toBe('ja');
  });

  it('maps native labels to codes', () => {
    expect(labelToLocaleCode('Nederlands')).toBe('nl');
    expect(labelToLocaleCode('日本語')).toBe('ja');
    expect(labelToLocaleCode('Español')).toBe('es');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(labelToLocaleCode('  dutch ')).toBe('nl');
    expect(labelToLocaleCode('DUTCH')).toBe('nl');
    expect(labelToLocaleCode('nederlands')).toBe('nl');
  });

  it('returns null for an unsupported language, empty, or non-string input', () => {
    // 'Hindi' is a REAL work-engine answer; `hi` is not in SUPPORTED_LOCALES, so
    // no localeConfig may be written for it.
    expect(labelToLocaleCode('Hindi')).toBeNull();
    expect(labelToLocaleCode('Klingon')).toBeNull();
    expect(labelToLocaleCode('')).toBeNull();
    expect(labelToLocaleCode('   ')).toBeNull();
    expect(labelToLocaleCode(undefined)).toBeNull();
    expect(labelToLocaleCode(null)).toBeNull();
    expect(labelToLocaleCode(42)).toBeNull();
  });

  it('does NOT accept a bare ISO code as a label (labels only, by contract)', () => {
    expect(labelToLocaleCode('nl')).toBeNull();
  });

  it('LOCALE_LABEL_TO_CODE covers every value of BOTH name maps', () => {
    for (const code of SUPPORTED_LOCALES) {
      expect(LOCALE_LABEL_TO_CODE[LOCALE_DISPLAY_NAMES[code]]).toBe(code);
      expect(LOCALE_LABEL_TO_CODE[LOCALE_ENGLISH_NAMES[code]]).toBe(code);
    }
  });
});
