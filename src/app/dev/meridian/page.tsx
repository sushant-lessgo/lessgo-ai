// src/app/dev/meridian/page.tsx
// P1 verification — renders Meridian surfaces / type / accent across all 9
// palettes and 3 variants. Internal-only, gated by the /dev/* convention
// (public route, blocked in production by middleware).
//
// Imports fonts-self-hosted.css so Meridian's fonts (Inter Tight / Inter /
// JetBrains Mono) render here — on /p they come from p/layout's import.

import '@/styles/fonts-self-hosted.css';
import { MeridianDemoClient } from './MeridianDemoClient';

export const metadata = {
  title: 'Meridian demo · /dev',
  robots: { index: false, follow: false },
};

export default function MeridianDemoPage() {
  return <MeridianDemoClient />;
}
