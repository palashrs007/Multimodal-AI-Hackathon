import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  SUPABASE_STORAGE_BUCKET: z.string().default('trip-uploads'),
  GEMINI_API_KEY: z.string().default('placeholder-gemini-key'),
  GEMINI_MODEL_PRIMARY: z.string().default('gemini-3.8-flash'),
  GEMINI_MODEL_ESCALATION: z.string().default('gemini-3.1-pro-preview'),
  GEMINI_MODEL_FALLBACK: z.string().default('gemini-3.1-flash-lite'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_GROUNDING: z.union([z.boolean(), z.enum(['true', 'false']).transform(v => v === 'true')]).default(false),
  GEMINI_MOCK: z.union([z.boolean(), z.enum(['true', 'false']).transform(v => v === 'true')]).default(false),
  MAX_IMAGES_PER_TRIP: z.coerce.number().default(10),
  MAX_IMAGE_MB: z.coerce.number().default(5),
  MAX_AUDIO_MB: z.coerce.number().default(8),
  DAILY_AI_CALL_LIMIT: z.coerce.number().default(30),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(3600),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.GEMINI_MOCK) {
  console.error('❌ FATAL: Cannot run with GEMINI_MOCK=true in production environment.');
  process.exit(1);
}

export const env = parsed.data;
export default env;
