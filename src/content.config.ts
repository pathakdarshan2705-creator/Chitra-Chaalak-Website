import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
  }),

  schema: z.object({
    title: z.string(),
    date: z.date(),
    topic: z.string(),
    image: z.string(),
    imageAlt: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

export const collections = {
  blog,
};