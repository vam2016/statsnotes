import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    updated: z.coerce.date().optional(), category: z.string(),
    tags: z.array(z.string()).default([]), author: z.string().default('博主'),
    kind: z.enum(['note', 'book']).default('note'),
    book: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    chapter: z.number().int().positive().optional(),
    featured: z.boolean().default(false), draft: z.boolean().default(false),
    demo: z.boolean().default(false), visual: z.enum(['survival', 'power', 'estimand', 'writing']).default('writing'),
  }).superRefine((data, ctx) => {
    if (data.kind === 'book' && (!data.book || !data.chapter)) ctx.addIssue({ code: 'custom', message: '读书笔记必须填写 book（书籍标识）和 chapter（章节顺序）。' });
  }),
});
const books = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/books' }),
  schema: z.object({
    title: z.string(), description: z.string(), author: z.string().optional(),
    edition: z.string().optional(), demo: z.boolean().default(false),
    color: z.enum(['blue', 'green', 'violet']).default('blue'),
  }),
});
export const collections = { posts, books };
