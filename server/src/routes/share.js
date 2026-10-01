import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { shareLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  createShareLink,
  removeShareLink,
  getSharedPlan,
} from '../controllers/shareController.js';
import { uuidParamSchema, shareTokenParamSchema } from '../schemas/common.js';

const router = Router();

// Public shared itinerary route (rate limited, no auth required)
router.get(
  '/share/:token',
  shareLimiter,
  validate({ params: shareTokenParamSchema }),
  getSharedPlan
);

// Protected share management routes
router.post(
  '/trips/:id/share',
  requireAuth,
  validate({ params: uuidParamSchema }),
  createShareLink
);

router.delete(
  '/trips/:id/share',
  requireAuth,
  validate({ params: uuidParamSchema }),
  removeShareLink
);

export default router;
