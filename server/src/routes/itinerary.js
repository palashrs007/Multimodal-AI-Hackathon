import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiEndpointLimiter, checkDailyAiQuota } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  createItineraryVersion,
  listItineraryVersions,
  getItineraryVersion,
  regenerateDay,
  swapActivity,
  updateActivity,
  reorderActivities,
  deleteActivity,
} from '../controllers/itineraryController.js';
import {
  regenerateDayRequestSchema,
  swapActivityRequestSchema,
  activityUpdateSchema,
  reorderSchema,
} from '../schemas/itinerary.js';
import {
  uuidParamSchema,
  itineraryDayParamSchema,
  itineraryActivityParamSchema,
} from '../schemas/common.js';
import { z } from 'zod';

const router = Router();

const tripVersionParamSchema = z.object({
  id: z.string().uuid(),
  version: z.coerce.number().int().min(1),
}).strict();

router.use(requireAuth);

// Generate new full itinerary version
router.post(
  '/trips/:id/itinerary/generate',
  aiEndpointLimiter,
  checkDailyAiQuota,
  validate({ params: uuidParamSchema }),
  createItineraryVersion
);

// List versions
router.get(
  '/trips/:id/itineraries',
  validate({ params: uuidParamSchema }),
  listItineraryVersions
);

// Get specific version
router.get(
  '/trips/:id/itineraries/:version',
  validate({ params: tripVersionParamSchema }),
  getItineraryVersion
);

// Regenerate single day (Prompt D)
router.post(
  '/itineraries/:itineraryId/days/:dayId/regenerate',
  aiEndpointLimiter,
  checkDailyAiQuota,
  validate({ params: itineraryDayParamSchema, body: regenerateDayRequestSchema }),
  regenerateDay
);

// Swap single activity (Prompt E)
router.post(
  '/itineraries/:itineraryId/activities/:activityId/swap',
  aiEndpointLimiter,
  checkDailyAiQuota,
  validate({ params: itineraryActivityParamSchema, body: swapActivityRequestSchema }),
  swapActivity
);

// Manual edit activity
router.patch(
  '/itineraries/:itineraryId/activities/:activityId',
  validate({ params: itineraryActivityParamSchema, body: activityUpdateSchema }),
  updateActivity
);

// Reorder activities within a day
router.post(
  '/itineraries/:itineraryId/days/:dayId/reorder',
  validate({ params: itineraryDayParamSchema, body: reorderSchema }),
  reorderActivities
);

// Delete activity
router.delete(
  '/itineraries/:itineraryId/activities/:activityId',
  validate({ params: itineraryActivityParamSchema }),
  deleteActivity
);

export default router;
