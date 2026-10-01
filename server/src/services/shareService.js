import crypto from 'crypto';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { createSignedUrl } from './imageProcessing.js';
import { getFullItineraryByVersion } from './itineraryService.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';

export async function enableShareToken(tripId, userId) {
  const token = crypto.randomBytes(16).toString('hex'); // 32-char hex string

  if (isDevPlaceholderSupabase) {
    const trip = devStore.trips.get(tripId);
    if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');
    trip.is_shared = true;
    trip.share_token = token;
    return { is_shared: true, share_token: token };
  }

  const { data, error } = await supabaseAdmin
    .from('trips')
    .update({ is_shared: true, share_token: token })
    .eq('id', tripId)
    .eq('user_id', userId)
    .select('is_shared, share_token')
    .single();

  if (error || !data) throw new NotFoundError('Trip not found or unauthorized');
  return data;
}

export async function revokeShareToken(tripId, userId) {
  if (isDevPlaceholderSupabase) {
    const trip = devStore.trips.get(tripId);
    if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');
    trip.is_shared = false;
    trip.share_token = null;
    return { is_shared: false };
  }

  const { error } = await supabaseAdmin
    .from('trips')
    .update({ is_shared: false, share_token: null })
    .eq('id', tripId)
    .eq('user_id', userId);

  if (error) throw new NotFoundError('Failed to revoke share link');
  return { is_shared: false };
}

export async function getSharedItinerary(token) {
  let trip;

  if (isDevPlaceholderSupabase) {
    trip = Array.from(devStore.trips.values()).find(
      (t) => t.share_token === token && t.is_shared === true
    );
  } else {
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('id, title, destination_hint, duration_days, budget_amount, budget_currency, pace, start_date, is_shared, share_token')
      .eq('share_token', token)
      .eq('is_shared', true)
      .single();

    if (!error && data) trip = data;
  }

  if (!trip) {
    throw new NotFoundError('Shared itinerary not found or link has expired');
  }

  // Load latest itinerary
  const itinerary = await getFullItineraryByVersion({
    tripId: trip.id,
    userId: trip.user_id,
    isShared: true,
  });

  if (!itinerary) {
    throw new NotFoundError('No published itinerary found for this trip');
  }

  // Fetch images and generate short-lived signed URLs for thumbnails
  let images = [];
  if (isDevPlaceholderSupabase) {
    images = Array.from(devStore.trip_images.values()).filter((img) => img.trip_id === trip.id);
  } else {
    const { data: imgData } = await supabaseAdmin
      .from('trip_images')
      .select('id, position, storage_path, source_platform')
      .eq('trip_id', trip.id)
      .order('position', { ascending: true });
    images = imgData || [];
  }

  const imagesWithUrls = await Promise.all(
    images.map(async (img) => ({
      id: img.id,
      position: img.position,
      source_platform: img.source_platform,
      url: await createSignedUrl(img.storage_path, 3600),
    }))
  );

  // Return strictly sanitized read-only payload (NO user_id, NO email, NO voice transcripts)
  return {
    trip: {
      title: trip.title,
      destination: trip.destination_hint,
      duration_days: trip.duration_days,
      budget_amount: trip.budget_amount,
      budget_currency: trip.budget_currency,
      pace: trip.pace,
      start_date: trip.start_date,
    },
    itinerary: {
      id: itinerary.id,
      version: itinerary.version,
      title: itinerary.title,
      summary: itinerary.summary,
      destination: itinerary.destination,
      currency: itinerary.currency,
      total_estimated_cost: itinerary.total_estimated_cost,
      budget_status: itinerary.budget_status,
      budget_breakdown: itinerary.budget_breakdown,
      warnings: itinerary.warnings,
      general_tips: itinerary.general_tips,
      days: itinerary.days.map((day) => ({
        day_number: day.day_number,
        title: day.title,
        theme: day.theme,
        daily_estimated_cost: day.daily_estimated_cost,
        notes: day.notes,
        activities: day.activities.map((act) => ({
          id: act.id,
          sort_order: act.sort_order,
          start_time: act.start_time,
          end_time: act.end_time,
          title: act.title,
          place_name: act.place_name,
          category: act.category,
          description: act.description,
          estimated_cost: act.estimated_cost,
          travel_minutes_from_previous: act.travel_minutes_from_previous,
          maps_query: act.maps_query,
          tips: act.tips,
          booking_recommended: act.booking_recommended,
          source_image_id: act.source_image_id,
          is_ai_suggested: act.is_ai_suggested,
        })),
      })),
    },
    images: imagesWithUrls,
  };
}
