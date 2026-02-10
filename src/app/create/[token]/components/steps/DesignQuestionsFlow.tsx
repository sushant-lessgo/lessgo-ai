'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import {
  getColorFamilies,
  getPaletteById,
  type Palette,
} from '@/modules/Design/background/palettes';
import {
  getCompatibleTextures,
  compileBackground,
} from '@/modules/Design/background/textures';
import PalettePreviewCard from './PalettePreviewCard';

// ─── Types ───

export interface DesignChoices {
  paletteId: string;
  textureId: string;
}

interface DesignQuestionsFlowProps {
  productName: string;
  oneLiner: string;
  ctaText: string;
  audience?: string;
  vibe: string;
  apiComplete: boolean;
  onComplete: (choices: DesignChoices) => void;
  onSkip: () => void;
  onInteraction?: () => void; // reset inactivity timer
}

// ─── Helper text (from spec) ───

const FAMILY_HELPER_TEXT: Record<string, string> = {
  // Dark families
  'navy-slate': 'Used by 70% of dev tool landing pages',
  'indigo': 'AI & ML products use this palette family',
  'teal-ocean': 'Data & analytics platforms favor this',
  'pure-gray': 'Clean canvas. Lets your product UI stand out',
  'brown': 'Signals premium. Finance, luxury SaaS',
  'green': 'Sustainability, health, nature tech',
  // Light families
  'blue': '#1 in B2B SaaS. Stripe, Intercom use this',
  'purple': 'Creative & AI tools. Stand out in crowded markets',
  'teal': 'Growth & health products. Productivity tools',
  'gray': 'Content-first. Stripe, Notion, Linear style',
  'amber-gold': 'Ecommerce & marketplaces. Premium feel',
  'orange': 'Highest energy. Conversion focused pages',
  'rose-pink': 'Consumer, lifestyle, creator tools, health',
};

const PALETTE_HELPER_TEXT: Record<string, string> = {
  // Dark navy-slate (4)
  'midnight-slate': 'Deep navy with blue warmth',
  'arctic-night': 'Cool gray-dark, infrastructure feel',
  'steel-midnight': 'Subtle radial glow, restrained',
  'graphite': 'Lighter slate, more contrast',
  // Dark pure-gray (2)
  'obsidian': 'Near-black, warm undertone. Premium',
  'charcoal': 'Zinc-dark. Modern, minimal',
  // Dark brown (2)
  'espresso': 'Rich dark brown. Warm premium',
  'dark-terracotta': 'Rust-dark. Bold warmth',
  // Light blue (4)
  'ice-blue': 'Classic SaaS blue, lighter feel',
  'trust-blue': 'Deeper blue, enterprise trust',
  'sky-bright': 'Light sky blue, friendly',
  'ocean': 'Multi-stop gradient, dynamic',
  // Light green (2)
  'emerald-clean': 'Clean green. Success, fintech',
  'mint-warm': 'Soft mint gradient. Friendly, growth',
  // Light gray (5)
  'cloud-white': 'Gray primary. Ultra-minimal, Notion-style',
  'pearl-gray': 'Slate primary. Corporate, professional',
  'steel': 'Light gray gradient. Very subtle, content-first',
  'soft-stone': 'Warm gray. Consulting, professional',
  'zinc-modern': 'Cool modern gray. Dev tools, dashboards',
  // Light amber-gold (3)
  'warm-sand': 'Amber on cream. Ecommerce, marketplaces',
  'sunset': 'Amber-to-orange gradient. Optimistic',
  'golden-hour': 'Gold. Premium, exclusive, luxury',
  // Light rose-pink (2)
  'blush': 'Bold rose. Consumer, lifestyle',
  'rose-soft': 'Softer pink. Approachable, friendly',
};

const STEP_HEADERS = [
  '', // unused index 0
  'Choose your style',
  'Pick a color',
  'Refine your look',
  'Add texture',
];

const STEP_SUBTITLES: Record<number, string> = {
  1: 'This is just the starting point \u2014 you\'ll refine next',
  2: 'Each family has palette variations you can explore',
  3: 'Pick the exact shade for your page',
  4: 'Optional \u2014 adds subtle depth to backgrounds',
};

// ─── Component ───

export default function DesignQuestionsFlow({
  productName,
  oneLiner,
  ctaText,
  audience,
  vibe: _vibe,
  apiComplete,
  onComplete,
  onSkip,
  onInteraction,
}: DesignQuestionsFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mode, setMode] = useState<'dark' | 'light' | null>(null);
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [textureId, setTextureId] = useState<string | null>(null);

  // ─── Rotating personalized loading messages ───
  const loadingMessages = useMemo(() => {
    const name = productName || 'your product';
    const msgs: string[] = [];
    if (audience) msgs.push(`Writing copy for ${audience}...`);
    msgs.push(`Crafting your ${name} landing page...`);
    if (audience) msgs.push(`Picking the right words for ${audience}...`);
    msgs.push(`Building sections for ${name}...`);
    return msgs;
  }, [productName, audience]);

  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    if (apiComplete) return;
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % loadingMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [apiComplete, loadingMessages.length]);

  const handleInteraction = useCallback(() => {
    onInteraction?.();
  }, [onInteraction]);

  // ─── Q1: Dark or Light ───

  function handleModeSelect(m: 'dark' | 'light') {
    handleInteraction();
    setMode(m);
    // Reset downstream
    setColorFamily(null);
    setPaletteId(null);
    setTextureId(null);
    setStep(2);
  }

  // ─── Q2: Color Family ───

  function handleFamilySelect(family: string, palettesInFamily: Palette[]) {
    handleInteraction();
    setColorFamily(family);
    setPaletteId(null);
    setTextureId(null);

    if (palettesInFamily.length === 1) {
      // Single palette in family — auto-select, skip Q3
      setPaletteId(palettesInFamily[0].id);
      setStep(4);
    } else {
      setStep(3);
    }
  }

  // ─── Q3: Specific Palette ───

  function handlePaletteSelect(id: string) {
    handleInteraction();
    setPaletteId(id);
    setTextureId(null);
    setStep(4);
  }

  // ─── Q4: Texture ───

  function handleTextureSelect(id: string) {
    handleInteraction();
    setTextureId(id);
    onComplete({ paletteId: paletteId!, textureId: id });
  }

  // ─── Back navigation ───

  function handleBack() {
    handleInteraction();
    if (step === 2) {
      setMode(null);
      setColorFamily(null);
      setPaletteId(null);
      setTextureId(null);
      setStep(1);
    } else if (step === 3) {
      setColorFamily(null);
      setPaletteId(null);
      setTextureId(null);
      setStep(2);
    } else if (step === 4) {
      setTextureId(null);
      // If we skipped Q3 (single palette family), go back to Q2
      if (mode && colorFamily) {
        const families = getColorFamilies(mode);
        const currentFamily = families.find(f => f.family === colorFamily);
        if (currentFamily && currentFamily.palettes.length === 1) {
          setPaletteId(null);
          setStep(2);
        } else {
          setStep(3);
        }
      } else {
        setStep(2);
      }
    }
  }

  // ─── Representative palettes for Q1 ───
  const darkPreview = getPaletteById('midnight-slate')!;
  const lightPreview = getPaletteById('trust-blue')!;

  // ─── Render helpers ───

  const selectedPalette = paletteId ? getPaletteById(paletteId) : null;

  return (
    <div
      className="flex flex-col items-center justify-center py-8 mx-auto px-4"
      onClick={handleInteraction}
    >
      {/* Step header + back button */}
      <div className="flex items-center gap-3 mb-6 w-full">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {STEP_HEADERS[step]}
          </h2>
          {STEP_SUBTITLES[step] && (
            <p className="text-xs text-gray-400 mt-0.5">{STEP_SUBTITLES[step]}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-brand-accentPrimary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Intro context — only on step 1 */}
      {step === 1 && (
        <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
          While AI writes your copy, pick the look and feel for your page.
          You&apos;ll choose colors and textures in the next few steps.
        </p>
      )}

      {/* ─── Q1: Dark or Light ─── */}
      {step === 1 && (
        <div className="flex flex-row gap-4 justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Dark</span>
            <PalettePreviewCard
              palette={darkPreview}
              productName={productName}
              oneLiner={oneLiner}
              ctaText={ctaText}
              selected={mode === 'dark'}
              onClick={() => handleModeSelect('dark')}
            />
            <p className="text-sm text-gray-500 text-center max-w-[220px]">
              Tech & developer audiences prefer dark interfaces
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Light</span>
            <PalettePreviewCard
              palette={lightPreview}
              productName={productName}
              oneLiner={oneLiner}
              ctaText={ctaText}
              selected={mode === 'light'}
              onClick={() => handleModeSelect('light')}
            />
            <p className="text-sm text-gray-500 text-center max-w-[220px]">
              Builds instant trust with mainstream B2B audiences
            </p>
          </div>
        </div>
      )}

      {/* ─── Q2: Color Family ─── */}
      {step === 2 && mode && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
          {getColorFamilies(mode).map(({ family, palettes: pals }) => {
            const representative = pals[0];
            return (
              <button
                key={family}
                type="button"
                onClick={() => handleFamilySelect(family, pals)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl
                  transition-all duration-200 cursor-pointer
                  ${colorFamily === family
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div
                  className="w-[80px] h-[80px] rounded-lg shadow-sm"
                  style={{ background: representative.primary }}
                />
                <p className="text-xs text-gray-500 text-center leading-tight max-w-[140px]">
                  {FAMILY_HELPER_TEXT[family] || family}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Q3: Specific Palette ─── */}
      {step === 3 && mode && colorFamily && (
        <div className="flex flex-wrap justify-center gap-5 w-full">
          {getColorFamilies(mode)
            .find(f => f.family === colorFamily)
            ?.palettes.map((pal) => (
              <div key={pal.id} className="flex flex-col items-center gap-2">
                <PalettePreviewCard
                  palette={pal}
                  productName={productName}
                  oneLiner={oneLiner}
                  ctaText={ctaText}
                  selected={paletteId === pal.id}
                  onClick={() => handlePaletteSelect(pal.id)}
                />
                <p className="text-xs text-gray-500 text-center max-w-[220px]">
                  {PALETTE_HELPER_TEXT[pal.id] || pal.label}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* ─── Q4: Texture ─── */}
      {step === 4 && selectedPalette && (
        <div className="flex flex-row gap-3 justify-center">
          {getCompatibleTextures(selectedPalette).map((tex) => {
            const isSelected = textureId === tex.id;
            const swatchBg = compileBackground(selectedPalette, tex.id, 'primary');
            return (
              <button
                key={tex.id}
                type="button"
                onClick={() => handleTextureSelect(tex.id)}
                className={`
                  flex flex-col items-center gap-2 cursor-pointer
                  transition-all duration-200
                  ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
                `}
              >
                <div
                  className={`
                    w-[130px] h-[130px] rounded-lg shadow-sm
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  `}
                  style={{ background: swatchBg }}
                />
                <p className="text-xs text-gray-600 font-medium">
                  {tex.label}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Bottom bar: progress + skip ─── */}
      <div className="mt-8 w-full">
        <div className="flex items-center gap-3 mb-3">
          {apiComplete ? (
            <>
              <div className="w-5 h-5 rounded-full bg-brand-accentPrimary/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-brand-accentPrimary" />
              </div>
              <span className="text-sm text-brand-accentPrimary font-medium">
                Your {productName || 'page'} is ready &mdash; finish picking to see it
              </span>
            </>
          ) : (
            <>
              <div className="relative w-5 h-5 flex-shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-brand-accentPrimary animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">{loadingMessages[msgIndex]}</p>
                <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-accentPrimary/40 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip, use defaults &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
