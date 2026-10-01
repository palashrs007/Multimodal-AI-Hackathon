import { z } from 'zod';

export const PLACE_CATEGORIES = [
  'food_cafe',
  'nature_outdoors',
  'beach',
  'culture_heritage',
  'religious_spiritual',
  'museum_art',
  'nightlife',
  'shopping_market',
  'adventure_sports',
  'wellness_spa',
  'viewpoint_photo_spot',
  'stay_accommodation',
  'local_experience',
  'transport_hub',
  'other',
];

export const TRAVEL_PACES = ['relaxed', 'balanced', 'packed'];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'THB', 'JPY', 'AUD'];

export const SOURCE_PLATFORMS = ['instagram', 'pinterest', 'other', 'unknown'];

export const placeCategoryEnum = z.enum(PLACE_CATEGORIES);
export const travelPaceEnum = z.enum(TRAVEL_PACES);
export const budgetCurrencyEnum = z.enum(CURRENCIES);
export const sourcePlatformEnum = z.enum(SOURCE_PLATFORMS);
export const tripStatusEnum = z.enum(['draft', 'analyzing', 'review', 'generating', 'ready', 'error']);

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid(),
}).strict();

export const placeIdParamSchema = z.object({
  tripId: z.string().uuid(),
  placeId: z.string().uuid(),
}).strict();

export const itineraryDayParamSchema = z.object({
  itineraryId: z.string().uuid(),
  dayId: z.string().uuid(),
}).strict();

export const itineraryActivityParamSchema = z.object({
  itineraryId: z.string().uuid(),
  activityId: z.string().uuid(),
}).strict();

export const shareTokenParamSchema = z.object({
  token: z.string().min(16).max(64),
}).strict();

export const timeStringRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
