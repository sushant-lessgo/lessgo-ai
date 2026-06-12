// src/modules/UIBlocks/normalizers/mythRealityNormalizer.ts
// Normalizer for MythVsRealityGrid - converts any input format to V2 pairs array

const MAX_PAIRS = 6;

// V2 Canonical type
export type MythRealityPair = {
  id: string;
  myth: string;
  reality: string;
};

export type MythRealityCanonical = {
  headline: string;
  subheadline?: string;
  myth_icon?: string;
  reality_icon?: string;
  pairs: MythRealityPair[];
};

// Incoming type - supports all formats for backward compatibility
export type MythRealityIncoming = {
  headline?: string;
  subheadline?: string;
  myth_icon?: string;
  reality_icon?: string;

  // V2 format (preferred)
  pairs?: Array<{ id?: string; myth: string; reality: string }>;

  // Legacy formats
  myth_reality_items?: Array<{ myth: string; reality: string; id?: string }>;
  myth_reality_pairs?:
    | Array<{ myth: string; reality: string; id?: string }>
    | string;  // Legacy pipe-separated

  // Individual fields (legacy)
  myth_1?: string; reality_1?: string;
  myth_2?: string; reality_2?: string;
  myth_3?: string; reality_3?: string;
  myth_4?: string; reality_4?: string;
  myth_5?: string; reality_5?: string;
  myth_6?: string; reality_6?: string;
};

/**
 * Normalize any MythReality format to V2 canonical (pairs array)
 * Single gate - call this once at boundary
 */
export function normalizeMythReality(content: MythRealityIncoming): MythRealityCanonical {
  const headline = content.headline ?? '';
  const subheadline = content.subheadline;
  const myth_icon = content.myth_icon;
  const reality_icon = content.reality_icon;

  // 1) Check for V2 pairs array first (preferred)
  if (Array.isArray(content.pairs)) {
    const arr = content.pairs.filter(x => x?.myth && x?.reality);
    if (arr.length) {
      return {
        headline,
        subheadline,
        myth_icon,
        reality_icon,
        pairs: arr.slice(0, MAX_PAIRS).map((x, i) => ({
          id: x.id ?? `p${i + 1}`,
          myth: x.myth,
          reality: x.reality,
        })),
      };
    }
  }

  // 2) Check for myth_reality_items array (legacy)
  if (Array.isArray(content.myth_reality_items)) {
    const arr = content.myth_reality_items.filter(x => x?.myth && x?.reality);
    if (arr.length) {
      return {
        headline,
        subheadline,
        myth_icon,
        reality_icon,
        pairs: arr.slice(0, MAX_PAIRS).map((x, i) => ({
          id: x.id ?? `p${i + 1}`,
          myth: x.myth,
          reality: x.reality,
        })),
      };
    }
  }

  // 3) Check for myth_reality_pairs (could be array or pipe-separated string)
  if (content.myth_reality_pairs) {
    // 3a) If it's an array
    if (Array.isArray(content.myth_reality_pairs)) {
      const arr = content.myth_reality_pairs.filter(x => x?.myth && x?.reality);
      if (arr.length) {
        return {
          headline,
          subheadline,
          myth_icon,
          reality_icon,
          pairs: arr.slice(0, MAX_PAIRS).map((x, i) => ({
            id: x.id ?? `p${i + 1}`,
            myth: x.myth,
            reality: x.reality,
          })),
        };
      }
    }
    // 3b) If it's a pipe-separated string (legacy)
    else if (typeof content.myth_reality_pairs === 'string') {
      const parts = content.myth_reality_pairs.split('|');
      const pairs: MythRealityPair[] = [];

      for (let i = 0; i < parts.length - 1; i += 2) {
        const myth = parts[i].replace(/^Myth:\s*/i, '').trim();
        const reality = parts[i + 1].replace(/^Reality:\s*/i, '').trim();
        if (myth && reality) {
          pairs.push({ id: `p${pairs.length + 1}`, myth, reality });
        }
      }

      if (pairs.length) {
        return {
          headline,
          subheadline,
          myth_icon,
          reality_icon,
          pairs: pairs.slice(0, MAX_PAIRS),
        };
      }
    }
  }

  // 4) Fall back to individual numbered fields (legacy)
  const pairs: MythRealityPair[] = [];
  for (let i = 1; i <= MAX_PAIRS; i++) {
    const myth = (content as Record<string, unknown>)[`myth_${i}`];
    const reality = (content as Record<string, unknown>)[`reality_${i}`];
    if (typeof myth === 'string' && myth.trim() &&
        typeof reality === 'string' && reality.trim()) {
      pairs.push({ id: `p${i}`, myth: myth.trim(), reality: reality.trim() });
    }
  }

  return { headline, subheadline, myth_icon, reality_icon, pairs };
}

/**
 * Convert V2 canonical format to flat object for component props
 */
export function toComponentProps(canonical: MythRealityCanonical): Record<string, unknown> {
  return {
    headline: canonical.headline,
    subheadline: canonical.subheadline,
    myth_icon: canonical.myth_icon,
    reality_icon: canonical.reality_icon,
    pairs: canonical.pairs,
  };
}
