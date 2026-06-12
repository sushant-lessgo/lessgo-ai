// src/app/dev/meridian/page.tsx
// P1 verification — renders Meridian surfaces / type / accent across all 9
// palettes and 3 variants. Internal-only, gated by the /dev/* convention
// (public route, blocked in production by middleware).
//
// No fonts-self-hosted.css import: Meridian's three fonts (Inter Tight / Inter /
// JetBrains Mono) load via the Google Fonts <link> in MeridianThemeInjector.

import { MeridianDemoClient } from './MeridianDemoClient';

export const metadata = {
  title: 'Meridian demo · /dev',
  robots: { index: false, follow: false },
};

export default function MeridianDemoPage() {
  return <MeridianDemoClient />;
}
