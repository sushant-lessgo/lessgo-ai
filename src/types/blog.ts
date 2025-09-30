export interface BlogPostMeta {
  title: string;
  description: string;
  date: string;
  slug?: string;
  image?: string;
  author: string;
  published: boolean;
  tags: string[];
}

export interface BlogPost {
  slug: string;
  meta: BlogPostMeta;
  content?: string;
  readingTime: string;
}