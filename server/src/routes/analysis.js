import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiEndpointLimiter, checkDailyAiQuota } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  runAnalysis,
  updatePlace,
  addPlace,
  deletePlace,
} from '../controllers/analysisController.js';
import { placeUpdateSchema, placeCreateSchema } from '../schemas/trip.js';
import { uuidParamSchema, placeIdParamSchema } from '../schemas/common.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/trips/:id/analyze',
  aiEndpointLimiter,
  checkDailyAiQuota,
  validate({ params: uuidParamSchema }),
  runAnalysis
);

router.patch(
  '/trips/:tripId/places/:placeId',
  validate({ params: placeIdParamSchema, body: placeUpdateSchema }),
  updatePlace
);

router.post(
  '/trips/:id/places',
  validate({ params: uuidParamSchema, body: placeCreateSchema }),
  addPlace
);

router.delete(
  '/trips/:tripId/places/:placeId',
  validate({ params: placeIdParamSchema }),
  deletePlace
);

export default router;
