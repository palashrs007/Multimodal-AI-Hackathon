import { analyzeTrip } from '../services/analysisService.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { NotFoundError } from '../lib/errors.js';

export async function runAnalysis(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const result = await analyzeTrip({ tripId, userId });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updatePlace(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId, placeId } = req.params;
    const updates = req.body;

    if (isDevPlaceholderSupabase) {
      const place = devStore.extracted_places.get(placeId);
      if (!place || place.trip_id !== tripId || place.user_id !== userId) {
        throw new NotFoundError('Extracted place not found');
      }
      Object.assign(place, updates, {
        user_edited: true,
        updated_at: new Date().toISOString(),
      });
      return res.json({ success: true, data: place });
    }

    const { data, error } = await req.supabase
      .from('extracted_places')
      .update({
        ...updates,
        user_edited: true,
      })
      .eq('id', placeId)
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Extracted place not found or unauthorized');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addPlace(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;
    const body = req.body;

    const placeRecord = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      user_id: userId,
      image_id: null,
      name: body.name,
      is_identified: true,
      category: body.category || 'other',
      city: body.city || null,
      region: body.region || null,
      country: body.country || null,
      confidence: 1.0,
      style_tags: body.style_tags || [],
      description: body.description || '',
      approx_lat: body.approx_lat || null,
      approx_lng: body.approx_lng || null,
      included: body.included ?? true,
      user_edited: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDevPlaceholderSupabase) {
      devStore.extracted_places.set(placeRecord.id, placeRecord);
      return res.status(201).json({ success: true, data: placeRecord });
    }

    const { data, error } = await req.supabase
      .from('extracted_places')
      .insert(placeRecord)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deletePlace(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId, placeId } = req.params;

    if (isDevPlaceholderSupabase) {
      const place = devStore.extracted_places.get(placeId);
      if (!place || place.trip_id !== tripId || place.user_id !== userId) {
        throw new NotFoundError('Place not found');
      }
      devStore.extracted_places.delete(placeId);
      return res.json({ success: true, message: 'Place deleted' });
    }

    const { error } = await req.supabase
      .from('extracted_places')
      .delete()
      .eq('id', placeId)
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, message: 'Place deleted' });
  } catch (err) {
    next(err);
  }
}
