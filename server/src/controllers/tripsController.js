import { sanitizeImage, uploadToStorage, createSignedUrl } from '../services/imageProcessing.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export async function createTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const body = req.body;
    const images = req.validatedImages || [];
    const voiceNote = req.validatedVoiceNote || null;

    const tripId = crypto.randomUUID();
    const now = new Date().toISOString();

    const title = body.title?.trim() || `Trip – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const durationDays = Number(body.duration_days) || 3;
    const budgetAmount = Number(body.budget_amount) || 25000;
    const budgetCurrency = body.budget_currency || 'INR';
    const travelers = Number(body.travelers) || 1;
    const pace = body.pace || 'balanced';

    const rawDest = body.destination?.trim() || body.destination_hint?.trim() || null;
    const destination = rawDest;
    const destinationSource = rawDest ? 'user' : null;
    const originCity = body.origin_city?.trim() || null;

    // Parse interests if passed as JSON string in multipart form
    let interests = [];
    if (body.interests) {
      if (Array.isArray(body.interests)) {
        interests = body.interests;
      } else {
        try {
          const parsed = JSON.parse(body.interests);
          if (Array.isArray(parsed)) interests = parsed;
        } catch {
          interests = [body.interests];
        }
      }
    }

    // 1. Process and upload voice note if present
    let voiceNotePath = null;
    if (voiceNote) {
      const voiceId = crypto.randomUUID();
      voiceNotePath = await uploadToStorage({
        userId,
        tripId,
        fileId: voiceId,
        buffer: voiceNote.buffer,
        mimeType: voiceNote.validatedMime,
        isVoice: true,
      });
    }

    // 2. Sanitize and upload images with Sharp (if any)
    const tripImagesData = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imageId = crypto.randomUUID();

      // Sharp auto-rotate, resize <= 1600px, strip EXIF
      const sanitized = await sanitizeImage(img.buffer);

      const storagePath = await uploadToStorage({
        userId,
        tripId,
        fileId: imageId,
        buffer: sanitized.buffer,
        mimeType: sanitized.mimeType,
        isVoice: false,
      });

      tripImagesData.push({
        id: imageId,
        trip_id: tripId,
        user_id: userId,
        position: i,
        storage_path: storagePath,
        original_filename: img.originalname,
        mime_type: sanitized.mimeType,
        size_bytes: sanitized.sizeBytes,
        source_platform: body.source_platform || 'unknown',
        analysis_status: 'pending',
        analysis: null,
        created_at: now,
      });
    }

    const tripRecord = {
      id: tripId,
      user_id: userId,
      title,
      destination,
      destination_source: destinationSource,
      origin_city: originCity,
      destination_hint: destination,
      duration_days: durationDays,
      budget_amount: budgetAmount,
      budget_currency: budgetCurrency,
      travelers,
      pace,
      start_date: body.start_date || null,
      note_text: body.note_text?.trim() || null,
      voice_note_path: voiceNotePath,
      voice_transcript: null,
      interests,
      dietary_or_access_notes: body.dietary_or_access_notes?.trim() || null,
      parsed_constraints: null,
      status: 'analyzing',
      error_message: null,
      is_shared: false,
      share_token: null,
      created_at: now,
      updated_at: now,
    };

    if (isDevPlaceholderSupabase) {
      devStore.trips.set(tripId, tripRecord);
      for (const img of tripImagesData) {
        devStore.trip_images.set(img.id, img);
      }
    } else {
      const { error: tripError } = await req.supabase.from('trips').insert(tripRecord);
      if (tripError) throw tripError;

      if (tripImagesData.length > 0) {
        const { error: imgError } = await req.supabase.from('trip_images').insert(tripImagesData);
        if (imgError) throw imgError;
      }
    }

    logger.info({ tripId, imagesCount: tripImagesData.length }, 'Trip successfully created and queued for analysis');
    res.status(201).json({ success: true, data: { tripId, status: 'analyzing' } });
  } catch (err) {
    next(err);
  }
}

export async function listTrips(req, res, next) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const offset = (page - 1) * limit;

    if (isDevPlaceholderSupabase) {
      const userTrips = Array.from(devStore.trips.values())
        .filter((t) => t.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const paginated = userTrips.slice(offset, offset + limit);

      const itemsWithCover = await Promise.all(
        paginated.map(async (trip) => {
          const images = Array.from(devStore.trip_images.values())
            .filter((img) => img.trip_id === trip.id)
            .sort((a, b) => a.position - b.position);

          const coverUrl = images.length > 0 ? await createSignedUrl(images[0].storage_path) : null;
          return {
            ...trip,
            cover_image_url: coverUrl,
            images_count: images.length,
          };
        })
      );

      return res.json({
        success: true,
        data: {
          items: itemsWithCover,
          total: userTrips.length,
          page,
          limit,
        },
      });
    }

    // Real Supabase
    const { data: trips, count, error } = await req.supabase
      .from('trips')
      .select('*, trip_images(id, position, storage_path)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const items = await Promise.all(
      (trips || []).map(async (trip) => {
        const sortedImages = (trip.trip_images || []).sort((a, b) => a.position - b.position);
        const coverUrl = sortedImages.length > 0 ? await createSignedUrl(sortedImages[0].storage_path) : null;
        return {
          ...trip,
          cover_image_url: coverUrl,
          images_count: sortedImages.length,
        };
      })
    );

    res.json({
      success: true,
      data: {
        items,
        total: count || 0,
        page,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTripById(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    if (isDevPlaceholderSupabase) {
      const trip = devStore.trips.get(tripId);
      if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');

      const images = Array.from(devStore.trip_images.values())
        .filter((img) => img.trip_id === tripId)
        .sort((a, b) => a.position - b.position);

      const imagesWithUrls = await Promise.all(
        images.map(async (img) => ({
          ...img,
          signed_url: await createSignedUrl(img.storage_path),
        }))
      );

      const places = Array.from(devStore.extracted_places.values()).filter(
        (p) => p.trip_id === tripId
      );

      const itineraries = Array.from(devStore.itineraries.values())
        .filter((i) => i.trip_id === tripId)
        .sort((a, b) => b.version - a.version);

      return res.json({
        success: true,
        data: {
          ...trip,
          images: imagesWithUrls,
          extracted_places: places,
          latest_itinerary: itineraries[0] || null,
        },
      });
    }

    const { data: trip, error: tripErr } = await req.supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();

    if (tripErr || !trip) throw new NotFoundError('Trip not found');

    const { data: images } = await req.supabase
      .from('trip_images')
      .select('*')
      .eq('trip_id', tripId)
      .order('position', { ascending: true });

    const imagesWithUrls = await Promise.all(
      (images || []).map(async (img) => ({
        ...img,
        signed_url: await createSignedUrl(img.storage_path),
      }))
    );

    const { data: places } = await req.supabase
      .from('extracted_places')
      .select('*')
      .eq('trip_id', tripId);

    const { data: itineraries } = await req.supabase
      .from('itineraries')
      .select('*')
      .eq('trip_id', tripId)
      .order('version', { ascending: false })
      .limit(1);

    res.json({
      success: true,
      data: {
        ...trip,
        images: imagesWithUrls,
        extracted_places: places || [],
        latest_itinerary: itineraries?.[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;
    const updates = req.body;

    if (isDevPlaceholderSupabase) {
      const trip = devStore.trips.get(tripId);
      if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');
      Object.assign(trip, updates, { updated_at: new Date().toISOString() });
      return res.json({ success: true, data: trip });
    }

    const { data, error } = await req.supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function duplicateTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    if (isDevPlaceholderSupabase) {
      const orig = devStore.trips.get(tripId);
      if (!orig || orig.user_id !== userId) throw new NotFoundError('Original trip not found');

      const newTripId = crypto.randomUUID();
      const duplicatedTrip = {
        ...orig,
        id: newTripId,
        title: `${orig.title} (Copy)`,
        status: 'draft',
        is_shared: false,
        share_token: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      devStore.trips.set(newTripId, duplicatedTrip);

      // Copy images
      const images = Array.from(devStore.trip_images.values()).filter((img) => img.trip_id === tripId);
      for (const img of images) {
        const newImgId = crypto.randomUUID();
        devStore.trip_images.set(newImgId, {
          ...img,
          id: newImgId,
          trip_id: newTripId,
        });
      }

      // Copy places
      const places = Array.from(devStore.extracted_places.values()).filter((p) => p.trip_id === tripId);
      for (const p of places) {
        const newPlaceId = crypto.randomUUID();
        devStore.extracted_places.set(newPlaceId, {
          ...p,
          id: newPlaceId,
          trip_id: newTripId,
        });
      }

      return res.status(201).json({ success: true, data: { tripId: newTripId } });
    }

    const { data: orig, error: origErr } = await req.supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();

    if (origErr || !orig) throw new NotFoundError('Original trip not found');

    const newTripId = crypto.randomUUID();
    const { error: dupErr } = await req.supabase.from('trips').insert({
      ...orig,
      id: newTripId,
      title: `${orig.title} (Copy)`,
      status: 'draft',
      is_shared: false,
      share_token: null,
    });
    if (dupErr) throw dupErr;

    // Copy trip images
    const { data: images } = await req.supabase.from('trip_images').select('*').eq('trip_id', tripId);
    if (images && images.length > 0) {
      const duplicatedImages = images.map((img) => ({
        ...img,
        id: crypto.randomUUID(),
        trip_id: newTripId,
      }));
      await req.supabase.from('trip_images').insert(duplicatedImages);
    }

    // Copy places
    const { data: places } = await req.supabase.from('extracted_places').select('*').eq('trip_id', tripId);
    if (places && places.length > 0) {
      const duplicatedPlaces = places.map((p) => ({
        ...p,
        id: crypto.randomUUID(),
        trip_id: newTripId,
      }));
      await req.supabase.from('extracted_places').insert(duplicatedPlaces);
    }

    res.status(201).json({ success: true, data: { tripId: newTripId } });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    if (isDevPlaceholderSupabase) {
      const trip = devStore.trips.get(tripId);
      if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');
      devStore.trips.delete(tripId);

      // Delete trip images and files
      for (const [key, img] of devStore.trip_images.entries()) {
        if (img.trip_id === tripId) {
          devStore.storageFiles.delete(img.storage_path);
          devStore.trip_images.delete(key);
        }
      }
      return res.json({ success: true, message: 'Trip deleted successfully' });
    }

    // Fetch storage paths to delete from bucket
    const { data: images } = await req.supabase
      .from('trip_images')
      .select('storage_path')
      .eq('trip_id', tripId);

    const paths = (images || []).map((img) => img.storage_path);
    if (paths.length > 0) {
      await supabaseAdmin.storage.from('trip-uploads').remove(paths);
    }

    const { error } = await req.supabase.from('trips').delete().eq('id', tripId).eq('user_id', userId);
    if (error) throw error;

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateDestination(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;
    const { destination, rerun_matching } = req.body;

    const updates = {
      destination: destination.trim(),
      destination_source: 'user',
      destination_hint: destination.trim(),
      updated_at: new Date().toISOString(),
    };

    if (isDevPlaceholderSupabase) {
      const trip = devStore.trips.get(tripId);
      if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');
      Object.assign(trip, updates);
      return res.json({ success: true, data: trip });
    }

    const { data, error } = await req.supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
