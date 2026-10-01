import sharp from 'sharp';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Sanitizes image buffer using sharp:
 * 1. Auto-rotates using EXIF orientation tag
 * 2. Resizes to max 1280px on the longest side (preserving aspect ratio)
 * 3. Strips all EXIF / GPS metadata for privacy
 * 4. Re-encodes cleanly as JPEG (or WebP)
 */
export async function sanitizeImage(buffer) {
  let pipeline = sharp(buffer).rotate(); // auto-rotates and resets orientation, strips EXIF
  const metadata = await pipeline.metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const longestSide = Math.max(width, height);

  // Keep screenshots legible for OCR: resize to max 1600px on longest side, do not downscale below 1000px if original is larger
  if (longestSide > 1600) {
    pipeline = pipeline.resize({
      width: width >= height ? 1600 : undefined,
      height: height > width ? 1600 : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const sanitizedBuffer = await pipeline
    .jpeg({
      quality: 88,
    })
    .toBuffer();

  const base64 = sanitizedBuffer.toString('base64');

  return {
    buffer: sanitizedBuffer,
    mimeType: 'image/jpeg',
    sizeBytes: sanitizedBuffer.length,
    base64,
  };
}

/**
 * Uploads a file to Supabase Storage (trip-uploads bucket)
 * Path: {userId}/{tripId}/images/{fileId}.jpg or {userId}/{tripId}/voice/{fileId}.webm
 */
export async function uploadToStorage({ userId, tripId, fileId, buffer, mimeType, isVoice = false }) {
  const extension = isVoice ? 'webm' : 'jpg';
  const folder = isVoice ? 'voice' : 'images';
  const storagePath = `${userId}/${tripId}/${folder}/${fileId}.${extension}`;

  if (isDevPlaceholderSupabase) {
    devStore.storageFiles.set(storagePath, {
      buffer,
      mimeType,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    });
    return storagePath;
  }

  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    logger.error({ error, storagePath }, 'Storage upload failed');
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }

  return storagePath;
}

/**
 * Generates a short-lived signed URL for a file in Supabase Storage.
 */
export async function createSignedUrl(storagePath, expiresIn = env.SIGNED_URL_TTL_SECONDS) {
  if (!storagePath) return null;

  if (isDevPlaceholderSupabase) {
    // Return a local data URL or local endpoint URL for dev mode preview
    const file = devStore.storageFiles.get(storagePath);
    if (file) {
      return `data:${file.mimeType};base64,${file.buffer.toString('base64')}`;
    }
    return `https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80`;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      logger.warn({ error, storagePath }, 'Failed to create signed URL');
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    logger.error({ err: err.message, storagePath }, 'Error generating signed URL');
    return null;
  }
}
