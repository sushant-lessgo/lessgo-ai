// src/app/dev/meridian/blocks/page.tsx
// P2 verification gallery — renders all 7 Meridian pilot blocks (edit + published)
// from schema-default / design-reference mock content, across palettes + variants.
// Internal-only (/dev/* convention; blocked in production by middleware).

import { MeridianBlocksClient } from './MeridianBlocksClient';

export const metadata = {
  title: 'Meridian blocks · /dev',
  robots: { index: false, follow: false },
};

export default function MeridianBlocksPage() {
  return <MeridianBlocksClient />;
}
