import { supabaseAdmin, createScopedClient, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { UnauthorizedError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (isDevPlaceholderSupabase) {
      // In dev mode when real Supabase is not yet configured, allow dev token or demo user
      let userId = '00000000-0000-0000-0000-000000000001';
      let email = 'traveler@wandershot.ai';
      if (token && token.startsWith('demo-user-')) {
        userId = token.replace('demo-user-', '');
        email = `user-${userId.slice(0, 6)}@wandershot.ai`;
      }

      req.user = { id: userId, email };
      req.token = token;
      req.supabase = createScopedClient(token);

      // Ensure dev user profile exists in devStore
      if (!devStore.profiles.has(userId)) {
        devStore.profiles.set(userId, {
          id: userId,
          display_name: 'Wanderer',
          default_currency: 'INR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn({ error }, 'Failed to verify Supabase JWT');
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    req.user = user;
    req.token = token;
    req.supabase = createScopedClient(token);

    return next();
  } catch (err) {
    next(err);
  }
}
