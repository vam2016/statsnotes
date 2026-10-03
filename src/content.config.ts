import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    updated: z.coerce.date().optional(), category: z.string(),
    tags: z.array(z.string()).default([]), author: z.string().default('博主'),
    featured: z.boolean().default(false), draft: z.boolean().default(false),
    demo: z.boolean().default(false), visual: z.enum(['survival', 'power', 'estimand', 'writing']).default('writing'),
  }),
});
export const collections = { posts };
