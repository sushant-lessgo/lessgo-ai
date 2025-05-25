'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import LandingPagePreview from '@/components/generatedLanding/LandingPagePreview';
import type { GPTOutput } from '@/modules/prompt/types';

type Props = {
  data: GPTOutput;
  themeValues: {
    primary: string;
    background: string;
    muted: string;
  };
};

export default function PublishedLandingWrapper({ data, themeValues }: Props) {
  const { setTheme, getFullTheme } = useThemeStore();

  useEffect(() => {
    if (!themeValues) return;

    // 1. Set Zustand state
    setTheme(themeValues);

    // 2. Inject into DOM
    const full = getFullTheme();
    for (const [key, val] of Object.entries(full)) {
      document.documentElement.style.setProperty(key, val);
    }
  }, [themeValues]);

  return (
    <LandingPagePreview data={data} isStaticExport={true} />
  );
}
