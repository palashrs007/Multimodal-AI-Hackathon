import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { QuotaExceededError } from '../lib/errors.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';

// General API rate limiter (100 req / 15 min / IP)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again in 15 minutes.',
    },
  },
});

// Public share rate limiter (60 req / 15 min / IP)
export const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SHARE_RATE_LIMIT_EXCEEDED',
      message: 'Too many requests for shared trips, please try again later.',
    },
  },
});

// AI endpoint rate limiter (10 req / 10 min / user in production; 60 in dev/test)
export const aiEndpointLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMITED',
      message: 'AI request limit reached (10 requests per 10 minutes). Please wait a few minutes.',
    },
  },
});

// Daily user AI quota checker (e.g. 30 requests per day)
export async function checkDailyAiQuota(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return next();

    const limit = env.DAILY_AI_CALL_LIMIT;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (isDevPlaceholderSupabase) {
      const userLogsToday = devStore.ai_request_logs.filter(
        (log) => log.user_id === userId && log.created_at >= oneDayAgo
      );
      if (userLogsToday.length >= limit) {
        throw new QuotaExceededError(`Daily AI limit of ${limit} calls reached. Resets in 24 hours.`);
      }
      return next();
    }

    const { count, error } = await supabaseAdmin
      .from('ai_request_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo);

    if (error) {
      // Don't block user if log check fails, but proceed
      return next();
    }

    if ((count || 0) >= limit) {
      throw new QuotaExceededError(`Daily AI limit of ${limit} calls reached. Resets in 24 hours.`);
    }

    next();
  } catch (err) {
    next(err);
  }
}
