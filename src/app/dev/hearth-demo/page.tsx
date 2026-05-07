// src/app/dev/hearth-demo/page.tsx
// Phase 1 verification — renders Hearth surfaces / type / accent across all
// 9 palettes. Internal-only, gated by /dev/* convention.

import '@/styles/fonts-self-hosted.css';
import { HearthDemoClient } from './HearthDemoClient';

export const metadata = {
  title: 'Hearth demo · /dev',
  robots: { index: false, follow: false },
};

export default function HearthDemoPage() {
  return <HearthDemoClient />;
}
