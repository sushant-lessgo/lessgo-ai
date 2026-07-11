// Blog (Phase 1) — shared article block, registered as section type 'blogpostbody'
// in EVERY template's resolveBlock map (edit + published point here; blog pages
// never enter the edit canvas, so there is no separate edit variant).
//
// Server-safe: no 'use client', no hooks — renders under renderToStaticMarkup for
// the static export AND under the SSR fallback route (same page def, see
// buildBlogPages.ts). Markdown goes through ReactMarkdown (raw HTML escaped inert,
// javascript: URLs stripped — pinned by src/lib/blog/__tests__/markdown.test.tsx).
//
// Styling contract: template-agnostic via the --blog-* vars each template defines
// in its tokens (ink/ink-2/line/accent/accent-on), with light-theme fallbacks. The
// section sits on each template's body surface (sectionRules entry); the surface
// paints the background, this block never does.
//
// Subscribe CTA: vanilla <form data-lessgo-form> markup (FormMarkupPublished
// pattern) — form.v1.js binds it on the published page; posts to /api/forms/submit.
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface BlogPostData {
  slug?: string;
  title?: string;
  excerpt?: string;
  heroImage?: string;
  markdown?: string;
  publishedAtISO?: string;
}

interface BlogPostBodyBlockProps {
  post?: BlogPostData;
  subscribeFormId?: string;
  publishedPageId?: string;
  pageOwnerId?: string;
  sectionId?: string;
}

export function formatPostDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

export default function BlogPostBodyBlock(props: BlogPostBodyBlockProps) {
  const post = props.post || {};
  const date = formatPostDate(post.publishedAtISO);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <article className="lg-blog">
        <header className="lg-blog__header">
          <a className="lg-blog__back" href="/blog">
            ← Blog
          </a>
          <h1 className="lg-blog__title">{post.title || 'Untitled'}</h1>
          {(date || post.excerpt) && (
            <div className="lg-blog__meta">
              {date && <time dateTime={post.publishedAtISO}>{date}</time>}
              {date && post.excerpt && <span aria-hidden="true"> · </span>}
              {post.excerpt && <span className="lg-blog__excerpt">{post.excerpt}</span>}
            </div>
          )}
        </header>

        {post.heroImage && (
          <img className="lg-blog__hero" src={post.heroImage} alt={post.title || ''} loading="lazy" decoding="async" />
        )}

        <div className="lg-blog__body">
          <ReactMarkdown>{post.markdown || ''}</ReactMarkdown>
        </div>

        {props.subscribeFormId && (
          <aside className="lg-blog__subscribe">
            <p className="lg-blog__subscribe-title">Get new posts in your inbox</p>
            <form
              data-lessgo-form
              data-form-id={props.subscribeFormId}
              data-page-id={props.publishedPageId}
              data-owner-id={props.pageOwnerId}
              data-success-message="Thanks — you are subscribed!"
              className="lg-blog__subscribe-form"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                aria-label="Email address"
                className="lg-blog__subscribe-input"
              />
              <button type="submit" className="lg-blog__subscribe-btn">
                Subscribe
              </button>
            </form>
          </aside>
        )}
      </article>
    </>
  );
}

const STYLES = `
.lg-blog { max-width:720px; margin:0 auto; padding:clamp(48px,7vw,88px) clamp(20px,4vw,32px); color:var(--blog-ink, #1c2420); font-family:var(--font-body, ui-sans-serif, system-ui, sans-serif); }
.lg-blog__back { display:inline-block; font-size:13.5px; letter-spacing:0.02em; color:var(--blog-ink-2, #5c6660); text-decoration:none; margin-bottom:28px; }
.lg-blog__back:hover { color:var(--blog-accent, #1c2420); }
.lg-blog__title { font-family:var(--font-display, inherit); font-weight:650; font-size:clamp(30px,4.4vw,46px); line-height:1.12; letter-spacing:-0.018em; margin:0 0 14px; }
.lg-blog__meta { font-size:14px; line-height:1.6; color:var(--blog-ink-2, #5c6660); margin-bottom:8px; }
.lg-blog__hero { width:100%; height:auto; border-radius:10px; margin:26px 0 6px; display:block; }
.lg-blog__body { margin-top:28px; font-size:17px; line-height:1.75; }
.lg-blog__body h1, .lg-blog__body h2, .lg-blog__body h3, .lg-blog__body h4 { font-family:var(--font-display, inherit); font-weight:600; letter-spacing:-0.012em; line-height:1.25; margin:2em 0 0.6em; }
.lg-blog__body h1 { font-size:1.7em; } .lg-blog__body h2 { font-size:1.45em; } .lg-blog__body h3 { font-size:1.2em; } .lg-blog__body h4 { font-size:1.05em; }
.lg-blog__body p { margin:0 0 1.15em; }
.lg-blog__body a { color:var(--blog-accent, inherit); text-decoration:underline; text-underline-offset:3px; }
.lg-blog__body ul, .lg-blog__body ol { margin:0 0 1.15em; padding-left:1.4em; }
.lg-blog__body li { margin:0.35em 0; }
.lg-blog__body blockquote { margin:1.4em 0; padding:0.2em 0 0.2em 1.1em; border-left:2px solid var(--blog-line, rgba(0,0,0,0.14)); color:var(--blog-ink-2, #5c6660); }
.lg-blog__body code { font-family:var(--font-mono, ui-monospace, monospace); font-size:0.88em; padding:0.15em 0.4em; border:1px solid var(--blog-line, rgba(0,0,0,0.12)); border-radius:5px; }
.lg-blog__body pre { overflow-x:auto; padding:16px 18px; border:1px solid var(--blog-line, rgba(0,0,0,0.12)); border-radius:9px; margin:0 0 1.3em; }
.lg-blog__body pre code { border:none; padding:0; font-size:13.5px; line-height:1.6; }
.lg-blog__body img { max-width:100%; height:auto; border-radius:8px; }
.lg-blog__body hr { border:none; border-top:1px solid var(--blog-line, rgba(0,0,0,0.12)); margin:2.2em 0; }
.lg-blog__subscribe { margin-top:56px; padding:26px 26px 28px; border:1px solid var(--blog-line, rgba(0,0,0,0.12)); border-radius:12px; }
.lg-blog__subscribe-title { font-family:var(--font-display, inherit); font-weight:600; font-size:17px; margin:0 0 14px; }
.lg-blog__subscribe-form { display:flex; flex-wrap:wrap; gap:10px; }
.lg-blog__subscribe-input { flex:1 1 220px; padding:11px 14px; font-size:15px; font-family:inherit; color:inherit; background:transparent; border:1px solid var(--blog-line, rgba(0,0,0,0.18)); border-radius:8px; }
.lg-blog__subscribe-input::placeholder { color:var(--blog-ink-2, #5c6660); opacity:0.7; }
.lg-blog__subscribe-btn { padding:11px 22px; font-family:var(--font-display, inherit); font-weight:600; font-size:14.5px; color:var(--blog-accent-on, #ffffff); background:var(--blog-accent, #1c2420); border:none; border-radius:8px; cursor:pointer; }
.lg-blog__subscribe-btn:hover { opacity:0.9; }
`;
