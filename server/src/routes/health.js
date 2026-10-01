import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

import { getAiModelsHealth } from '../services/gemini.js';

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      app: 'WanderShot API',
      timestamp: new Date().toISOString(),
      primaryModel: env.GEMINI_MODEL_PRIMARY,
      mockMode: env.GEMINI_MOCK,
      nodeEnv: env.NODE_ENV,
    },
  });
});

router.get('/health/ai', (req, res) => {
  const modelsHealth = getAiModelsHealth();
  res.json({
    success: true,
    data: modelsHealth,
  });
});

export default router;
