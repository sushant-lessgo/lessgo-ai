import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractLogoUrl } from '@/lib/staticExport/structuredData';

// Using Node.js runtime instead of edge because Prisma doesn't support edge runtime

// Legacy fallback only: old pages stored themeValues.colors.{baseColor,accentColor}
// as named tokens. Current publishes store real hex in content.layout.theme.colors.
const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#10b981',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
};

/** True for values we can safely drop into a CSS gradient stop. */
function isCssColor(v: unknown): v is string {
  return typeof v === 'string' && /^(#([0-9a-f]{3}|[0-9a-f]{6})$|rgb|hsl)/i.test(v.trim());
}

/**
 * Darken a hex color by `amount` (0..1) for a readable gradient end. Tolerates
 * 3-digit hex; returns null for anything it can't parse (rgb()/hsl()/tokens) —
 * callers fall back rather than throw.
 */
function darkenHex(hex: string, amount: number): string | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const scale = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  const r = scale((n >> 16) & 0xff);
  const g = scale((n >> 8) & 0xff);
  const b = scale(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.publishedPage.findUnique({
      where: { slug: params.slug },
      select: {
        title: true,
        content: true,
        themeValues: true,
        projectId: true, // blog: post lookup for ?path=/blog/* OG images
      },
    });

    if (!page) {
      return new Response('Page not found', { status: 404 });
    }

    const content = page.content as any;

    // Multi-page: ?path=/gallery renders the subpage's own hero. Subpages store
    // sections flat under `.content` (same nested shape as the root).
    const rawPath = req.nextUrl.searchParams.get('path');
    const path = rawPath && rawPath !== '/' ? (rawPath.startsWith('/') ? rawPath : `/${rawPath}`) : null;

    // Blog (P2): /blog paths live in the BlogPost table, not content.subpages —
    // without this branch every blog OG URL (already emitted by buildPageMetadata)
    // 404s. Text comes from the post; palette/logo derive from the ROOT content.
    let blogText: { headline: string; subheadline: string } | null = null;
    if (path === '/blog' || path?.startsWith('/blog/')) {
      if (path === '/blog') {
        blogText = { headline: page.title ? `Blog — ${page.title}` : 'Blog', subheadline: '' };
      } else {
        const postSlug = path.slice('/blog/'.length);
        const post = page.projectId
          ? await prisma.blogPost.findUnique({
              where: { projectId_slug: { projectId: page.projectId, slug: postSlug } },
              select: { title: true, excerpt: true, status: true },
            })
          : null;
        if (!post || post.status !== 'published') {
          return new Response('Page not found', { status: 404 });
        }
        blogText = { headline: post.title, subheadline: post.excerpt || '' };
      }
    }

    const sub = path && !blogText ? (content?.subpages || {})[path] || (content?.subpages || {})[path.slice(1)] : null;
    if (path && !blogText && !sub) {
      return new Response('Page not found', { status: 404 });
    }

    const sections: string[] = (sub ? sub?.layout?.sections : content?.layout?.sections) || [];
    const container: Record<string, any> = (sub ? sub?.content : content?.content) || {};
    const flatView = { layout: { sections }, ...container };

    const heroSectionId = sections.find((id: string) => id.includes('hero'));
    const heroElements = heroSectionId ? container?.[heroSectionId]?.elements || {} : {};

    let headline = heroElements.headline?.content || sub?.title || page.title || 'Landing Page';
    let subheadline = heroElements.subheadline?.content || '';
    let badgeText = heroElements.badge_text?.content || '';

    // Product-detail subpages have no hero — derive from the Product entry record
    // (same derivation as the dynamic subpath route).
    if (sub && !heroSectionId) {
      const pdId = sections.find((id: string) => /^productdetail/i.test(id));
      const pdEl = pdId ? container?.[pdId]?.elements || {} : null;
      if (pdEl) {
        const model = typeof pdEl.model === 'string' ? pdEl.model : '';
        const name = typeof pdEl.name === 'string' ? pdEl.name : '';
        headline = [model, name].filter(Boolean).join(' ') || headline;
        subheadline =
          (typeof pdEl.oneLiner === 'string' && pdEl.oneLiner) ||
          (typeof pdEl.lede === 'string' && pdEl.lede) ||
          '';
        badgeText = '';
      }
    }

    // Blog pages: text from the post/index (root palette + logo below apply as-is).
    if (blogText) {
      headline = blogText.headline;
      subheadline = blogText.subheadline;
      badgeText = '';
    }

    // Palette: the real page theme (content.layout.theme.colors — hex values used
    // by the published CSS vars) with the legacy named-token map as last resort.
    // themeValues.colors is dead for current publishes (stores {primary,background,
    // muted}), so without this every new page rendered blue→purple.
    const pageTheme = (sub?.layout?.theme || content?.layout?.theme) as any;
    const gradientColors = pageTheme?.colors?.gradientColors;
    const accent = pageTheme?.colors?.accentColor;

    let gradientStart: string;
    let gradientEnd: string;
    if (isCssColor(gradientColors?.from) && isCssColor(gradientColors?.to)) {
      gradientStart = gradientColors.from;
      gradientEnd = gradientColors.to;
    } else if (isCssColor(accent) && darkenHex(accent, 0.3)) {
      gradientStart = accent;
      gradientEnd = darkenHex(accent, 0.3)!;
    } else {
      const legacy = page.themeValues as any;
      gradientStart = COLOR_MAP[legacy?.colors?.baseColor] || COLOR_MAP.blue;
      gradientEnd = COLOR_MAP[legacy?.colors?.accentColor] || COLOR_MAP.purple;
    }

    // Uploaded site logo (header chrome is injected per page at publish).
    const logoUrl = extractLogoUrl(flatView);

    // Truncate text for display
    const displayHeadline = headline.length > 60 ? headline.slice(0, 57) + '...' : headline;
    const displaySubheadline = subheadline.length > 120 ? subheadline.slice(0, 117) + '...' : subheadline;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
            padding: '80px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              style={{
                position: 'absolute',
                top: 52,
                left: 80,
                height: 56,
                maxWidth: 240,
                objectFit: 'contain',
              }}
            />
          ) : (
            badgeText && (
              <div
                style={{
                  position: 'absolute',
                  top: 60,
                  left: 80,
                  fontSize: 24,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {badgeText}
              </div>
            )
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 24,
            }}
          >
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {displayHeadline}
            </h1>

            {displaySubheadline && (
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.95)',
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: '800px',
                }}
              >
                {displaySubheadline}
              </p>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                letterSpacing: '0.02em',
              }}
            >
              lessgo.ai
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          // OG scrapers + CDN cache; SWR keeps shares fresh after a republish
          // without a hard hourly miss.
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
