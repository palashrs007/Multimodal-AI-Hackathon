import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        code: errorCode,
        statusCode,
        details: err.details,
      },
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    },
    'Request error occurred'
  );

  const isProduction = env.NODE_ENV === 'production';
  let message = err.message;
  if (err.code === 'PGRST205' || err.message?.includes('schema cache')) {
    message = "Supabase database tables are not initialized yet. Please open your Supabase SQL Editor and run 'supabase/schema_combined.sql' to create the required tables.";
  } else if (statusCode >= 500 && isProduction) {
    message = 'An unexpected error occurred. Please try again later.';
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
      hint: err.code === 'PGRST205' ? 'Run supabase/schema_combined.sql in Supabase Dashboard SQL Editor' : err.hint,
      ...(err.details && { details: err.details }),
    },
  };

  res.status(statusCode).json(response);
}

export default errorHandler;
