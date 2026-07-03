import { describe, it, expect } from 'vitest';
import { isReservedBlogPath } from './reservedPaths';

describe('isReservedBlogPath', () => {
  it('reserves /blog and everything under it (case-insensitive, slash-normalized)', () => {
    expect(isReservedBlogPath('/blog')).toBe(true);
    expect(isReservedBlogPath('/blog/my-post')).toBe(true);
    expect(isReservedBlogPath('blog')).toBe(true);
    expect(isReservedBlogPath('/BLOG')).toBe(true);
  });

  it('does not reserve lookalikes', () => {
    expect(isReservedBlogPath('/blogging')).toBe(false);
    expect(isReservedBlogPath('/my-blog')).toBe(false);
    expect(isReservedBlogPath('/')).toBe(false);
    expect(isReservedBlogPath('/contact')).toBe(false);
  });
});
