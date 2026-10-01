import { z } from 'zod';
import { travelPaceEnum } from './common.js';

export const constraintParseSchema = z.object({
  transcript: z.string().nullable().optional(),
  budget_amount: z.number().positive().nullable().optional(),
  budget_currency: z.string().nullable().optional(),
  budget_scope: z.enum(['total', 'per_person', 'per_day', 'unknown']).nullable().optional(),
  duration_days: z.number().int().min(1).max(30).nullable().optional(),
  travelers: z.number().int().min(1).max(20).nullable().optional(),
  pace: travelPaceEnum.nullable().optional(),
  destination_mentioned: z.string().nullable().optional(),
  origin_city: z.string().nullable().optional(),
  places_mentioned: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  must_include: z.array(z.string()).default([]),
  must_avoid: z.array(z.string()).default([]),
  dietary_notes: z.string().nullable().optional(),
  accessibility_notes: z.string().nullable().optional(),
  stay_preference: z.string().nullable().optional(),
  transport_preference: z.string().nullable().optional(),
  ambiguities: z.array(z.string()).default([]),
});
