import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProfile, updateProfile, deleteUserData } from '../controllers/meController.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { budgetCurrencyEnum } from '../schemas/common.js';

const router = Router();

const updateProfileSchema = z
  .object({
    display_name: z.string().max(80).optional(),
    default_currency: budgetCurrencyEnum.optional(),
  })
  .strict();

router.use(requireAuth);

router.get('/me', getProfile);
router.patch('/me', validate({ body: updateProfileSchema }), updateProfile);
router.delete('/me/data', deleteUserData);

export default router;
