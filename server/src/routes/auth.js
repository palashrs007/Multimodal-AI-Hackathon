import { Router } from 'express';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Creates a verified Supabase user via Service Role Admin API.
 * This sets email_confirm: true immediately, completely avoiding the
 * Supabase SMTP email rate limit (3 emails/hour on free tier).
 */
router.post('/auth/signup', async (req, res, next) => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const displayName = display_name?.trim() || email.split('@')[0];

    if (isDevPlaceholderSupabase) {
      const mockId = crypto.randomUUID();
      const mockUser = {
        id: mockId,
        email,
        user_metadata: { display_name: displayName },
      };
      devStore.profiles.set(mockId, {
        id: mockId,
        display_name: displayName,
        default_currency: 'INR',
      });
      return res.status(201).json({ success: true, data: { user: mockUser } });
    }

    // Use admin.createUser with email_confirm: true
    // Bypasses email dispatch & rate limits entirely
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (error) {
      // Check if user already exists
      if (
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists') ||
        error.message?.toLowerCase().includes('unique')
      ) {
        throw new ValidationError('An account with this email already exists. Please sign in instead.');
      }
      logger.error({ err: error.message }, 'Admin createUser failed');
      throw new ValidationError(error.message);
    }

    if (data?.user) {
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName,
          default_currency: 'INR',
          created_at: new Date().toISOString(),
        });
      } catch (profErr) {
        logger.warn({ profErr: profErr.message }, 'Could not upsert profile record');
      }
    }

    logger.info({ userId: data.user.id, email }, 'User created and auto-confirmed via admin API');
    res.status(201).json({ success: true, data: { user: data.user } });
  } catch (err) {
    next(err);
  }
});

export default router;
