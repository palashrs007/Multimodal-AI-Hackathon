import { z } from 'zod';
import {
  placeCategoryEnum,
  travelPaceEnum,
  budgetCurrencyEnum,
  PLACE_CATEGORIES,
} from './common.js';

export const tripCreateSchema = z.object({
  title: z.string().min(3).max(80).optional(),
  budget_amount: z.coerce.number().positive().max(100000000).optional(),
  budget_currency: budgetCurrencyEnum.default('INR'),
  duration_days: z.coerce.number().int().min(1).max(30).optional(),
  travelers: z.coerce.number().int().min(1).max(20).default(1),
  pace: travelPaceEnum.default('balanced'),
  start_date: z.string().optional(),
  note_text: z
    .string({ required_error: 'Trip description is required (10-2000 characters).' })
    .min(10, 'Trip description must be at least 10 characters.')
    .max(2000, 'Trip description cannot exceed 2000 characters.'),
  destination: z.string().max(120).optional(),
  origin_city: z.string().max(120).optional(),
  destination_hint: z.string().max(120).optional(),
  interests: z
    .union([
      z.array(placeCategoryEnum),
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return val ? [val] : [];
        }
      }),
    ])
    .pipe(z.array(placeCategoryEnum).max(8))
    .default([]),
  dietary_or_access_notes: z.string().max(300).optional(),
  has_voice_note: z.coerce.boolean().optional(),
  source_platform: z.string().optional(),
});

export const tripUpdateSchema = z
  .object({
    title: z.string().min(3).max(80).optional(),
    destination: z.string().max(120).nullable().optional(),
    origin_city: z.string().max(120).nullable().optional(),
    destination_hint: z.string().max(120).nullable().optional(),
    duration_days: z.coerce.number().int().min(1).max(30).optional(),
    budget_amount: z.coerce.number().positive().max(100000000).optional(),
    budget_currency: budgetCurrencyEnum.optional(),
    travelers: z.coerce.number().int().min(1).max(20).optional(),
    pace: travelPaceEnum.optional(),
    start_date: z.string().nullable().optional(),
    dietary_or_access_notes: z.string().max(300).nullable().optional(),
    interests: z.array(placeCategoryEnum).max(8).optional(),
  })
  .strict();

export const destinationUpdateSchema = z.object({
  destination: z.string().min(1, 'Destination is required').max(120),
  rerun_matching: z.boolean().default(false),
});

export const placeUpdateSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    city: z.string().max(100).nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    country: z.string().max(100).nullable().optional(),
    category: placeCategoryEnum.optional(),
    included: z.boolean().optional(),
    approx_lat: z.number().min(-90).max(90).nullable().optional(),
    approx_lng: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict();

export const placeCreateSchema = z
  .object({
    name: z.string().min(1).max(160),
    category: placeCategoryEnum.default('other'),
    city: z.string().max(100).nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    country: z.string().max(100).nullable().optional(),
    description: z.string().max(240).optional(),
    style_tags: z.array(z.string()).max(6).default([]),
    approx_lat: z.number().min(-90).max(90).nullable().optional(),
    approx_lng: z.number().min(-180).max(180).nullable().optional(),
    included: z.boolean().default(true),
  })
  .strict();
