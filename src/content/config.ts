// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    topic: z.string(),           // e.g. "ESSAY", "TRAVEL" — shown in card meta
    image: z.string(),           // path under /public, e.g. "/images/cassette-shop.jpg"
    imageAlt: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

export const collections = { blog };