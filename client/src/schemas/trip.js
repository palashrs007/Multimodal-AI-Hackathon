import { z } from 'zod';
import { PLACE_CATEGORIES, TRAVEL_PACES, CURRENCIES } from './common.js';

export const tripFormSchema = z.object({
  title: z.string().max(80).optional(),
  budget_amount: z.coerce.number().positive('Budget must be greater than 0').max(100000000).optional(),
  budget_currency: z.enum(CURRENCIES).default('INR'),
  duration_days: z.coerce.number().int().min(1, 'Duration must be 1 to 30 days').max(30).optional(),
  travelers: z.coerce.number().int().min(1, 'At least 1 traveler').max(20).default(1),
  pace: z.enum(TRAVEL_PACES).default('balanced'),
  start_date: z.string().optional(),
  note_text: z
    .string({ required_error: 'Please describe your dream trip (at least 10 characters).' })
    .min(10, 'Please enter at least 10 characters describing your trip.')
    .max(2000, 'Notes cannot exceed 2000 characters.'),
  destination: z.string().max(120, 'Destination cannot exceed 120 characters').optional(),
  origin_city: z.string().max(120, 'Starting city cannot exceed 120 characters').optional(),
  destination_hint: z.string().max(120).optional(),
  interests: z.array(z.string()).max(8, 'Maximum 8 interests').default([]),
  dietary_or_access_notes: z.string().max(300, 'Dietary/access notes cannot exceed 300 characters').optional(),
  source_platform: z.string().default('unknown'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(80),
});
