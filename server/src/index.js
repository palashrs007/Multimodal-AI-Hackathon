import app from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

import { checkGeminiModelsHealth, MODEL_ROLES } from './services/gemini.js';

const server = app.listen(env.PORT, async () => {
  logger.info(`✨ WanderShot Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`🔗 API Base: http://localhost:${env.PORT}/api`);
  logger.info(`🤖 Primary Model: ${MODEL_ROLES.PRIMARY}`);
  logger.info(`🤖 Escalation Model: ${MODEL_ROLES.ESCALATION}`);
  logger.info(`🤖 Fallback Model: ${MODEL_ROLES.FALLBACK}`);

  try {
    await checkGeminiModelsHealth();
  } catch (err) {
    logger.warn({ err: err.message }, 'Gemini model health check reported issues on startup (continuing server operation)');
  }
});

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
