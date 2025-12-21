import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

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
      },
    });

    if (!page) {
      return new Response('Page not found', { status: 404 });
    }

    // Extract content from hero section
    const content = page.content as any;
    const sections = content?.layout?.sections || [];
    const heroSectionId = sections.find((id: string) => id.includes('hero'));
    const heroElements = heroSectionId
      ? content?.content?.[heroSectionId]?.elements || {}
      : {};

    const headline = heroElements.headline?.content || page.title || 'Landing Page';
    const subheadline = heroElements.subheadline?.content || '';
    const badgeText = heroElements.badge_text?.content || '';

    // Extract theme colors
    const theme = page.themeValues as any;
    const baseColor = theme?.colors?.baseColor || 'blue';
    const accentColor = theme?.colors?.accentColor || 'purple';

    const gradientStart = COLOR_MAP[baseColor] || COLOR_MAP.blue;
    const gradientEnd = COLOR_MAP[accentColor] || COLOR_MAP.purple;

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
          {badgeText && (
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
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
