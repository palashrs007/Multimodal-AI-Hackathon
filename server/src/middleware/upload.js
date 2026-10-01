import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { ValidationError } from '../lib/errors.js';
import { env } from '../config/env.js';

const storage = multer.memoryStorage();

const uploadRaw = multer({
  storage,
  limits: {
    fileSize: Math.max(env.MAX_IMAGE_MB, env.MAX_AUDIO_MB) * 1024 * 1024,
    files: env.MAX_IMAGES_PER_TRIP + 1, // Images + optional voice note
  },
});

export const tripUploadMiddleware = uploadRaw.fields([
  { name: 'images', maxCount: env.MAX_IMAGES_PER_TRIP },
  { name: 'voice_note', maxCount: 1 },
]);

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_AUDIO_MIMES = new Set([
  'audio/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/ogg',
  'audio/x-m4a',
  'video/webm', // MediaRecorder in Chrome frequently generates video/webm audio blobs
  'video/mp4',
]);

export async function validateUploadedFiles(req, res, next) {
  try {
    const images = req.files?.images || [];
    const voiceNoteFiles = req.files?.voice_note || [];

    // Check images count (optional: 0-10)
    if (images.length > env.MAX_IMAGES_PER_TRIP) {
      throw new ValidationError(`Maximum ${env.MAX_IMAGES_PER_TRIP} images allowed per trip.`);
    }

    const validatedImages = [];
    const maxImageBytes = env.MAX_IMAGE_MB * 1024 * 1024;

    for (const file of images) {
      if (file.size > maxImageBytes) {
        throw new ValidationError(`Image "${file.originalname}" exceeds maximum size of ${env.MAX_IMAGE_MB}MB.`);
      }

      // Magic byte sniff
      const detected = await fileTypeFromBuffer(file.buffer);
      const mime = detected ? detected.mime : file.mimetype;

      if (!ALLOWED_IMAGE_MIMES.has(mime)) {
        throw new ValidationError(
          `Image "${file.originalname}" has invalid format (${mime}). Allowed formats: JPEG, PNG, WebP.`
        );
      }

      file.validatedMime = mime;
      validatedImages.push(file);
    }

    req.validatedImages = validatedImages;

    // Validate voice note if present
    if (voiceNoteFiles.length > 0) {
      const voiceFile = voiceNoteFiles[0];
      const maxAudioBytes = env.MAX_AUDIO_MB * 1024 * 1024;

      if (voiceFile.size > maxAudioBytes) {
        throw new ValidationError(`Voice note exceeds maximum size of ${env.MAX_AUDIO_MB}MB.`);
      }

      const detected = await fileTypeFromBuffer(voiceFile.buffer);
      const mime = detected ? detected.mime : voiceFile.mimetype;

      if (!ALLOWED_AUDIO_MIMES.has(mime) && !ALLOWED_AUDIO_MIMES.has(voiceFile.mimetype)) {
        throw new ValidationError(
          `Voice note has unsupported audio format (${mime || voiceFile.mimetype}). Supported formats: WebM, MP3, WAV, M4A, OGG.`
        );
      }

      voiceFile.validatedMime = mime || voiceFile.mimetype;
      req.validatedVoiceNote = voiceFile;
    }

    next();
  } catch (err) {
    next(err);
  }
}
