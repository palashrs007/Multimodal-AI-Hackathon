import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const isDevPlaceholderSupabase =
  !env.SUPABASE_URL ||
  env.SUPABASE_URL.includes('placeholder') ||
  !env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

// Service role client: Used only for public shares & storage admin tasks
export const supabaseAdmin = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Per-request authenticated Supabase client using caller's JWT
export function createScopedClient(token) {
  return createClient(
    env.SUPABASE_URL || 'https://placeholder.supabase.co',
    env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// In-Memory Dev Store for mock / local demo when real Supabase is not yet connected
class InMemoryDevStore {
  constructor() {
    this.profiles = new Map();
    this.trips = new Map();
    this.trip_images = new Map();
    this.extracted_places = new Map();
    this.itineraries = new Map();
    this.itinerary_days = new Map();
    this.itinerary_activities = new Map();
    this.ai_request_logs = [];
    this.storageFiles = new Map(); // path -> buffer
  }
}

export const devStore = new InMemoryDevStore();
