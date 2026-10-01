import { z } from 'zod';
import { placeCategoryEnum } from './common.js';

export const extractedPlaceAiSchema = z.object({
  name: z.string().min(1).max(160),
  is_identified: z.boolean().default(true),
  category: placeCategoryEnum.catch('other'),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  approx_lat: z.number().min(-90).max(90).nullable().optional(),
  approx_lng: z.number().min(-180).max(180).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
  style_tags: z
    .array(z.string().toLowerCase().trim())
    .max(6)
    .default([]),
  description: z.string().max(240).default(''),
  evidence: z.string().default(''),
});

export const imageAnalysisSchema = z.object({
  image_summary: z.string(),
  detected_text: z.array(z.string()).default([]),
  places: z.array(extractedPlaceAiSchema).max(4).default([]),
  overall_mood: z.string().default('appealing and scenic'),
});
