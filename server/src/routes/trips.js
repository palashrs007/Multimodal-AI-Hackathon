import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { tripUploadMiddleware, validateUploadedFiles } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  createTrip,
  listTrips,
  getTripById,
  updateTrip,
  duplicateTrip,
  deleteTrip,
  updateDestination,
} from '../controllers/tripsController.js';
import { tripCreateSchema, tripUpdateSchema, destinationUpdateSchema } from '../schemas/trip.js';
import { uuidParamSchema } from '../schemas/common.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/trips',
  tripUploadMiddleware,
  validateUploadedFiles,
  validate({ body: tripCreateSchema }),
  createTrip
);

router.get('/trips', listTrips);
router.get('/trips/:id', validate({ params: uuidParamSchema }), getTripById);
router.patch('/trips/:id', validate({ params: uuidParamSchema, body: tripUpdateSchema }), updateTrip);
router.patch('/trips/:id/destination', validate({ params: uuidParamSchema, body: destinationUpdateSchema }), updateDestination);
router.post('/trips/:id/duplicate', validate({ params: uuidParamSchema }), duplicateTrip);
router.delete('/trips/:id', validate({ params: uuidParamSchema }), deleteTrip);

export default router;
