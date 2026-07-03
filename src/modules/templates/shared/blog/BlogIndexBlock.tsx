// Blog (Phase 1) — shared /blog index block, section type 'blogindex'. Same
// contract as BlogPostBodyBlock: server-safe, registered in every template,
// styled via the --blog-* vars, background painted by the surface wrapper.
// Card hrefs are RELATIVE (/blog/{slug}) so one blob serves every host.
import React from 'react';
import { formatPostDate } from './BlogPostBodyBlock';

interface BlogIndexCard {
  slug?: string;
  title?: string;
  excerpt?: string;
  heroImage?: string;
  publishedAtISO?: string;
}

interface BlogIndexBlockProps {
  posts?: BlogIndexCard[];
  siteTitle?: string;
}

export default function BlogIndexBlock(props: BlogIndexBlockProps) {
  const posts = Array.isArray(props.posts) ? props.posts : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lg-blogix">
        <header className="lg-blogix__header">
          <h1 className="lg-blogix__title">Blog</h1>
          {props.siteTitle && <p className="lg-blogix__sub">Articles and updates from {props.siteTitle}.</p>}
        </header>
        {posts.length === 0 ? (
          <p className="lg-blogix__empty">No posts yet.</p>
        ) : (
          <div className="lg-blogix__list">
            {posts.map((post, i) => {
              const date = formatPostDate(post.publishedAtISO);
              return (
                <a key={post.slug || i} className="lg-blogix__card" href={`/blog/${post.slug}`}>
                  {post.heroImage && (
                    <img className="lg-blogix__img" src={post.heroImage} alt="" loading="lazy" />
                  )}
                  <div className="lg-blogix__card-body">
                    {date && (
                      <time className="lg-blogix__date" dateTime={post.publishedAtISO}>
                        {date}
                      </time>
                    )}
                    <h2 className="lg-blogix__card-title">{post.title || 'Untitled'}</h2>
                    {post.excerpt && <p className="lg-blogix__card-excerpt">{post.excerpt}</p>}
                    <span className="lg-blogix__more">Read article →</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

const STYLES = `
.lg-blogix { max-width:840px; margin:0 auto; padding:clamp(48px,7vw,88px) clamp(20px,4vw,32px); color:var(--blog-ink, #1c2420); font-family:var(--font-body, ui-sans-serif, system-ui, sans-serif); }
.lg-blogix__title { font-family:var(--font-display, inherit); font-weight:650; font-size:clamp(32px,4.6vw,48px); letter-spacing:-0.018em; line-height:1.1; margin:0 0 10px; }
.lg-blogix__sub { font-size:16px; line-height:1.6; color:var(--blog-ink-2, #5c6660); margin:0; }
.lg-blogix__empty { margin-top:40px; color:var(--blog-ink-2, #5c6660); }
.lg-blogix__list { margin-top:44px; display:flex; flex-direction:column; }
.lg-blogix__card { display:flex; gap:22px; align-items:flex-start; padding:26px 0; border-top:1px solid var(--blog-line, rgba(0,0,0,0.12)); text-decoration:none; color:inherit; }
.lg-blogix__card:last-child { border-bottom:1px solid var(--blog-line, rgba(0,0,0,0.12)); }
.lg-blogix__img { width:168px; height:112px; object-fit:cover; border-radius:9px; flex:none; }
.lg-blogix__card-body { min-width:0; }
.lg-blogix__date { display:block; font-size:13px; letter-spacing:0.02em; color:var(--blog-ink-2, #5c6660); margin-bottom:6px; }
.lg-blogix__card-title { font-family:var(--font-display, inherit); font-weight:600; font-size:clamp(19px,2.4vw,24px); letter-spacing:-0.012em; line-height:1.25; margin:0 0 8px; }
.lg-blogix__card:hover .lg-blogix__card-title { color:var(--blog-accent, inherit); }
.lg-blogix__card-excerpt { font-size:15.5px; line-height:1.65; color:var(--blog-ink-2, #5c6660); margin:0 0 10px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.lg-blogix__more { font-family:var(--font-display, inherit); font-weight:600; font-size:13.5px; color:var(--blog-accent, inherit); }
@media (max-width:560px) {
  .lg-blogix__card { flex-direction:column; gap:14px; }
  .lg-blogix__img { width:100%; height:auto; aspect-ratio:3/2; }
}
`;
