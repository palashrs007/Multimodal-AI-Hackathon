import { z } from 'zod';
import { placeCategoryEnum, timeStringRegex } from './common.js';

export const activitySchema = z
  .object({
    start_time: z.string().regex(timeStringRegex, 'start_time must be HH:MM in 24hr format'),
    end_time: z.string().regex(timeStringRegex, 'end_time must be HH:MM in 24hr format'),
    title: z.string().min(1).max(160),
    place_name: z.string().min(1).max(160),
    city: z.string().optional(),
    country: z.string().optional(),
    category: placeCategoryEnum.catch('other'),
    description: z.string().max(280).default(''),
    estimated_cost: z.coerce.number().min(0).default(0),
    travel_minutes_from_previous: z.coerce.number().min(0).default(0),
    maps_query: z.string().min(1),
    tips: z.string().nullable().optional(),
    booking_recommended: z.boolean().default(false),
    source_place_id: z.string().nullable().optional(),
    is_ai_suggested: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Validate end_time > start_time
      return data.end_time > data.start_time;
    },
    {
      message: 'end_time must be after start_time',
      path: ['end_time'],
    }
  );

export const daySchema = z.object({
  day_number: z.coerce.number().int().min(1),
  title: z.string().min(1).max(120),
  theme: z.string().max(120).default(''),
  daily_estimated_cost: z.coerce.number().min(0).default(0),
  notes: z.string().nullable().optional(),
  activities: z.array(activitySchema).min(1),
});

export const budgetBreakdownSchema = z.object({
  accommodation: z.coerce.number().min(0).default(0),
  food: z.coerce.number().min(0).default(0),
  activities: z.coerce.number().min(0).default(0),
  local_transport: z.coerce.number().min(0).default(0),
  other: z.coerce.number().min(0).default(0),
});

export const itinerarySchema = z.object({
  title: z.string().min(1).max(120),
  destination: z.string().min(1).max(120),
  destination_country: z.string().optional(),
  summary: z.string().max(400),
  currency: z.string().min(3).max(3).default('INR'),
  total_estimated_cost: z.coerce.number().min(0).default(0),
  budget_status: z.enum(['within_budget', 'near_limit', 'over_budget']).default('within_budget'),
  budget_breakdown: budgetBreakdownSchema.default({
    accommodation: 0,
    food: 0,
    activities: 0,
    local_transport: 0,
    other: 0,
  }),
  warnings: z.array(z.string()).default([]),
  general_tips: z.array(z.string()).default([]),
  days: z.array(daySchema).min(1),
});

export const swapActivityResponseSchema = z.object({
  activity: activitySchema,
});

export const regenerateDayRequestSchema = z
  .object({
    instruction: z.string().max(300).optional(),
  })
  .strict();

export const swapActivityRequestSchema = z
  .object({
    instruction: z.string().max(300).optional(),
  })
  .strict();

export const activityUpdateSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    place_name: z.string().min(1).max(160).optional(),
    category: placeCategoryEnum.optional(),
    start_time: z.string().regex(timeStringRegex).optional(),
    end_time: z.string().regex(timeStringRegex).optional(),
    estimated_cost: z.coerce.number().min(0).optional(),
    travel_minutes_from_previous: z.coerce.number().min(0).optional(),
    maps_query: z.string().optional(),
    tips: z.string().nullable().optional(),
    description: z.string().max(280).optional(),
    booking_recommended: z.boolean().optional(),
  })
  .strict();

export const reorderSchema = z
  .object({
    orderedActivityIds: z.array(z.string().uuid()).min(1),
  })
  .strict();

export const shareTokenSchema = z.string().regex(/^[a-zA-Z0-9_-]{16,64}$/);
