import { cn } from '@/lib/utils';

/**
 * AppIcon — app-chrome icon primitive (ui-foundation).
 *
 * Renders a Material Symbols Rounded glyph. The icon name is the element text
 * (a ligature, e.g. "arrow_forward"); the `.app-icon` font-family (defined in
 * src/styles/app-chrome.css) turns it into a glyph. Filled state flips the
 * variable font's FILL axis to 1.
 *
 * APP-CHROME ONLY. This component MUST NEVER be imported by anything under
 * `src/modules/templates/**` or `src/components/published/**` — those surfaces use
 * lucide + IconPublished. Importing AppIcon there would pull the Material Symbols
 * font onto the template/published surface and break isolation.
 */
export interface AppIconProps {
  /** Material Symbols ligature name, e.g. "arrow_forward", "auto_awesome". */
  name: string;
  /** Use the filled variant (FILL axis = 1). */
  filled?: boolean;
  /** Font size (drives the glyph size), e.g. 18 or "1.25rem". */
  size?: number | string;
  className?: string;
}

export function AppIcon({ name, filled, size, className }: AppIconProps) {
  return (
    <span
      aria-hidden
      className={cn('app-icon', filled && 'app-icon--filled', className)}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
