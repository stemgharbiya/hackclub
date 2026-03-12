import { defineCollection, z } from 'astro:content';

const team = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      committee: z.string(),
      order: z.number().int().nonnegative(),
      photo: image(),
      github: z.string().url().optional(),
      instagram: z.string().url().optional(),
      featured: z.boolean().default(false)
    })
});

const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    location: z.string(),
    season: z.number().int().positive(),
    outcome: z.string(),
    featured: z.boolean().default(false),
    registrationUrl: z.string().url().optional(),
    description: z.string().optional()
  })
});

const bootcamps = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    period: z.string(),
    level: z.string(),
    order: z.number().int().nonnegative(),
    mentorTrack: z.string(),
    featured: z.boolean().default(true)
  })
});

const workshops = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    provider: z.string(),
    outcome: z.string(),
    description: z.string().optional(),
    participations: z.number().int().nonnegative().optional(),
    approvedSubmissions: z.number().int().nonnegative().optional(),
    budgetSpent: z.string().optional(),
    rewardsMarketing: z.string().optional(),
    note: z.string().optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url()
        })
      )
      .optional()
  })
});

const faqs = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    order: z.number().int().nonnegative()
  })
});

export const collections = {
  team,
  events,
  bootcamps,
  workshops,
  faqs
};
