// src/modules/UIBlocks/normalizers/mythRealityNormalizer.ts
// Normalizer for MythVsRealityGrid - converts any input format to canonical array

const MAX_PAIRS = 6;

// Canonical type with id per item
export type MythRealityItem = {
  id: string;
  myth: string;
  reality: string;
};

export type MythRealityCanonical = {
  headline: string;
  subheadline?: string;
  myth_icon?: string;
  reality_icon?: string;
  items: MythRealityItem[];
};

// Incoming type - supports all formats
export type MythRealityIncoming = {
  headline?: string;
  subheadline?: string;
  myth_icon?: string;
  reality_icon?: string;

  // AI / canonical format (array)
  myth_reality_items?: Array<{ myth: string; reality: string; id?: string }>;
  myth_reality_pairs?:
    | Array<{ myth: string; reality: string; id?: string }>  // AI array
    | string;  // Legacy pipe-separated

  // Individual fields (legacy/manual)
  myth_1?: string; reality_1?: string;
  myth_2?: string; reality_2?: string;
  myth_3?: string; reality_3?: string;
  myth_4?: string; reality_4?: string;
  myth_5?: string; reality_5?: string;
  myth_6?: string; reality_6?: string;
};

/**
 * Normalize any MythReality format to canonical array
 * Single gate - call this once at boundary
 */
export function normalizeMythReality(content: MythRealityIncoming): MythRealityCanonical {
  const headline = content.headline ?? '';
  const subheadline = content.subheadline;
  const myth_icon = content.myth_icon;
  const reality_icon = content.reality_icon;

  // 1) Check for myth_reality_items array first (preferred canonical)
  if (Array.isArray(content.myth_reality_items)) {
    const arr = content.myth_reality_items.filter(x => x?.myth && x?.reality);
    if (arr.length) {
      return {
        headline,
        subheadline,
        myth_icon,
        reality_icon,
        items: arr.slice(0, MAX_PAIRS).map((x, i) => ({
          id: x.id ?? `mr_${i}`,
          myth: x.myth,
          reality: x.reality,
        })),
      };
    }
  }

  // 2) Check for myth_reality_pairs (could be array or pipe-separated string)
  if (content.myth_reality_pairs) {
    // 2a) If it's an array
    if (Array.isArray(content.myth_reality_pairs)) {
      const arr = content.myth_reality_pairs.filter(x => x?.myth && x?.reality);
      if (arr.length) {
        return {
          headline,
          subheadline,
          myth_icon,
          reality_icon,
          items: arr.slice(0, MAX_PAIRS).map((x, i) => ({
            id: x.id ?? `mr_${i}`,
            myth: x.myth,
            reality: x.reality,
          })),
        };
      }
    }
    // 2b) If it's a pipe-separated string
    else if (typeof content.myth_reality_pairs === 'string') {
      const parts = content.myth_reality_pairs.split('|');
      const items: MythRealityItem[] = [];

      for (let i = 0; i < parts.length - 1; i += 2) {
        const myth = parts[i].replace(/^Myth:\s*/i, '').trim();
        const reality = parts[i + 1].replace(/^Reality:\s*/i, '').trim();
        if (myth && reality) {
          items.push({ id: `mr_${items.length}`, myth, reality });
        }
      }

      if (items.length) {
        return {
          headline,
          subheadline,
          myth_icon,
          reality_icon,
          items: items.slice(0, MAX_PAIRS),
        };
      }
    }
  }

  // 3) Fall back to individual numbered fields
  const items: MythRealityItem[] = [];
  for (let i = 1; i <= MAX_PAIRS; i++) {
    const myth = (content as Record<string, unknown>)[`myth_${i}`];
    const reality = (content as Record<string, unknown>)[`reality_${i}`];
    if (typeof myth === 'string' && myth.trim() &&
        typeof reality === 'string' && reality.trim()) {
      items.push({ id: `mr_${i - 1}`, myth: myth.trim(), reality: reality.trim() });
    }
  }

  return { headline, subheadline, myth_icon, reality_icon, items };
}

/**
 * Convert canonical format back to individual fields for save
 * Keeps both formats in sync during migration
 */
export function toIndividualFields(canonical: MythRealityCanonical): Record<string, string> {
  const fields: Record<string, string> = {
    headline: canonical.headline,
  };

  if (canonical.subheadline) {
    fields.subheadline = canonical.subheadline;
  }
  if (canonical.myth_icon) {
    fields.myth_icon = canonical.myth_icon;
  }
  if (canonical.reality_icon) {
    fields.reality_icon = canonical.reality_icon;
  }

  // Clear all first
  for (let i = 1; i <= MAX_PAIRS; i++) {
    fields[`myth_${i}`] = '';
    fields[`reality_${i}`] = '';
  }

  // Set from canonical items
  canonical.items.forEach((item, index) => {
    fields[`myth_${index + 1}`] = item.myth;
    fields[`reality_${index + 1}`] = item.reality;
  });

  return fields;
}
