import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string(),
    description: z.string(),
    date: z
      .union([z.string(), z.date()])
      .transform((val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val)),
    category: z.string().nullish().transform((v) => v || 'Branding'),
    author: z.string().nullish().transform((v) => v || 'Eiko Visual'),
    authorRole: z.string().nullish().transform((v) => v || 'Brand Strategist'),
    authorAvatar: z.string().nullish().transform((v) => v || '/assets/blog/author-avatar.webp'),
    featuredImage: z.string(),
    ctaHeading: z.string().nullish(),
    ctaDescription: z.string().nullish(),
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .nullish(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string(),
    metaDescription: z.string().nullish(),
    slug: z.string(),
    cardTitle: z.string(),
    cardSummary: z.string(),
    cardImage: z.string(),
    cardTags: z.array(z.string()),
    order: z.coerce.number(),
    featuredOnHome: z.boolean().nullish().transform((v) => Boolean(v)),
    yearBadge: z.string().nullish().transform((v) => v || '©2025'),
    heroTitlePrefix: z.string(),
    heroTitleHighlight: z.string(),
    topGallery: z.array(z.string()),
    summaryText: z.string(),
    clientName: z.string(),
    clientScope: z.string(),
    projectDate: z
      .union([z.string(), z.date()])
      .transform((val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val)),
    middleGalleryRow1: z.array(z.string()),
    challengeText: z.string(),
    deliverables: z.array(z.string()),
    middleGalleryRow2: z.array(z.string()).nullish(),
    solutionHeading: z.string().nullish().transform((v) => v || 'Solusi Kami'),
    solutionHtml: z.string(),
    valuePoints: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    ),
    ctaBadge2: z.string().nullish().transform((v) => v || 'Digital Agency'),
    ctaHeading: z.string(),
    ctaDescription: z.string().nullish(),
    relatedArticlesHeadingPrefix: z.string().nullish(),
    relatedArticlesHeadingHighlight: z.string().nullish(),
    relatedArticleSlugs: z.array(z.string()).nullish(),
  }),
});

export const collections = { blog, projects };
