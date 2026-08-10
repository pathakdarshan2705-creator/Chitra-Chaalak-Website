// src/content/config.ts
// Astro 7 Content Layer API — uses `loader`, not the legacy `type: 'content'`.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    topic: z.string(),           // e.g. "ESSAY", "TRAVEL" — shown in card meta
    image: z.string(),           // path under /public, e.g. "/images/cassette-shop.jpg"
    imageAlt: z.string().optional(),
    excerpt: z.string().optional(),
    time: z.string().optional(),
    tags: z.array(z.string()).optional(),
    references: z.array(z.object({
      term: z.string(),
      description: z.string()
    })).optional(),
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/updates' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    location: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

const films = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/films' }),
  schema: z.object({
    title: z.string(),
    director: z.string(),
    year: z.number(),
    genre: z.string(),
    cast: z.string().optional(),
    image: z.string(),
    excerpt: z.string().optional(),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    section: z.string(),
    date: z.date(),
    image: z.string(),
    description: z.string(),
    youtubeId: z.string().optional(),
  }),
});

const tour = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tour' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    excerpt: z.string().optional(),
  }),
});

export const collections = { blog, updates, films, portfolio, tour };