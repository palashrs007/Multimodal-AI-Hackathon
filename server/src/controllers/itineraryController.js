import {
  generateItinerary,
  getFullItineraryByVersion,
  recalculateItineraryCosts,
} from '../services/itineraryService.js';
import { callGeminiJson } from '../services/gemini.js';
import { SYSTEM_INSTRUCTION } from '../prompts/system.js';
import { buildRegenerateDayPrompt, regenerateDayJsonSchema } from '../prompts/regenerateDay.js';
import { buildSwapActivityPrompt, swapActivityJsonSchema } from '../prompts/swapActivity.js';
import { daySchema, swapActivityResponseSchema } from '../schemas/itinerary.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { classifyDestination } from '../services/destinationService.js';

export async function createItineraryVersion(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const itinerary = await generateItinerary({ tripId, userId });
    res.status(201).json({ success: true, data: itinerary });
  } catch (err) {
    next(err);
  }
}

export async function listItineraryVersions(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    if (isDevPlaceholderSupabase) {
      const list = Array.from(devStore.itineraries.values())
        .filter((i) => i.trip_id === tripId && i.user_id === userId)
        .sort((a, b) => b.version - a.version)
        .map((i) => ({
          id: i.id,
          version: i.version,
          title: i.title,
          destination: i.destination,
          total_estimated_cost: i.total_estimated_cost,
          currency: i.currency,
          budget_status: i.budget_status,
          created_at: i.created_at,
        }));
      return res.json({ success: true, data: list });
    }

    const { data, error } = await req.supabase
      .from('itineraries')
      .select('id, version, title, destination, total_estimated_cost, currency, budget_status, created_at')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .order('version', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
}

export async function getItineraryVersion(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;
    const version = req.params.version ? Number(req.params.version) : null;

    const itinerary = await getFullItineraryByVersion({ tripId, version, userId });
    if (!itinerary) throw new NotFoundError('Itinerary not found');

    res.json({ success: true, data: itinerary });
  } catch (err) {
    next(err);
  }
}

export async function regenerateDay(req, res, next) {
  try {
    const userId = req.user.id;
    const { itineraryId, dayId } = req.params;
    const instruction = req.body?.instruction || '';

    // Fetch existing day and activities
    let day = null;
    let itinerary = null;
    let activities = [];

    if (isDevPlaceholderSupabase) {
      day = devStore.itinerary_days.get(dayId);
      itinerary = devStore.itineraries.get(itineraryId);
      activities = Array.from(devStore.itinerary_activities.values()).filter((a) => a.day_id === dayId);
    } else {
      const { data: dData } = await req.supabase.from('itinerary_days').select('*').eq('id', dayId).single();
      const { data: iData } = await req.supabase.from('itineraries').select('*').eq('id', itineraryId).single();
      const { data: aData } = await req.supabase.from('itinerary_activities').select('*').eq('day_id', dayId);
      day = dData;
      itinerary = iData;
      activities = aData || [];
    }

    if (!day || !itinerary) throw new NotFoundError('Day or itinerary not found');

    const destInfo = classifyDestination(itinerary.destination);

    const promptText = buildRegenerateDayPrompt({
      dayNumber: day.day_number,
      remainingBudgetForDay: Math.round(Number(itinerary.total_estimated_cost) / 3),
      currency: itinerary.currency,
      currentDayJson: { ...day, activities },
      instruction,
      destination: itinerary.destination,
      destinationType: destInfo.type,
    });

    const mockDayFallback = () => ({
      day_number: day.day_number,
      title: `Refreshed Experience – Day ${day.day_number}`,
      theme: 'Alternative Highlights & Local Charm',
      daily_estimated_cost: day.daily_estimated_cost || 4000,
      notes: 'Updated based on your custom preferences.',
      activities: activities.map((act) => ({
        ...act,
        city: act.city || destInfo.canonical_name,
        country: act.country || destInfo.country,
        title: `Alternative: ${act.title}`,
        description: `Curated fresh alternative matching your instruction: ${instruction || 'scenic charm'}`,
      })),
    });

    const regeneratedDay = await callGeminiJson({
      systemInstruction: SYSTEM_INSTRUCTION,
      parts: [{ text: promptText }],
      schema: regenerateDayJsonSchema,
      zodSchema: daySchema,
      temperature: 0.7,
      kind: 'day_regeneration',
      userId,
      tripId: itinerary.trip_id,
      mockFallback: mockDayFallback,
    });

    // Replace day activities
    if (isDevPlaceholderSupabase) {
      // Remove old activities
      for (const [k, a] of devStore.itinerary_activities.entries()) {
        if (a.day_id === dayId) devStore.itinerary_activities.delete(k);
      }
      day.title = regeneratedDay.title;
      day.theme = regeneratedDay.theme;
      day.notes = regeneratedDay.notes || day.notes;

      // Add new activities
      (regeneratedDay.activities || []).forEach((act, idx) => {
        const actId = crypto.randomUUID();
        devStore.itinerary_activities.set(actId, {
          id: actId,
          day_id: dayId,
          user_id: userId,
          sort_order: idx + 1,
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
          source_image_id: null,
          extracted_place_id: null,
          is_ai_suggested: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    } else {
      await req.supabase.from('itinerary_activities').delete().eq('day_id', dayId);
      await req.supabase.from('itinerary_days').update({
        title: regeneratedDay.title,
        theme: regeneratedDay.theme,
        notes: regeneratedDay.notes || day.notes,
      }).eq('id', dayId);

      const rows = (regeneratedDay.activities || []).map((act, idx) => ({
        id: crypto.randomUUID(),
        day_id: dayId,
        user_id: userId,
        sort_order: idx + 1,
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
        is_ai_suggested: true,
      }));
      await req.supabase.from('itinerary_activities').insert(rows);
    }

    await recalculateItineraryCosts(itineraryId);
    const updated = await getFullItineraryByVersion({ tripId: itinerary.trip_id, version: itinerary.version, userId });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function swapActivity(req, res, next) {
  try {
    const userId = req.user.id;
    const { itineraryId, activityId } = req.params;
    const instruction = req.body?.instruction || '';

    let activity = null;
    let itinerary = null;

    if (isDevPlaceholderSupabase) {
      activity = devStore.itinerary_activities.get(activityId);
      itinerary = devStore.itineraries.get(itineraryId);
    } else {
      const { data: aData } = await req.supabase.from('itinerary_activities').select('*').eq('id', activityId).single();
      const { data: iData } = await req.supabase.from('itineraries').select('*').eq('id', itineraryId).single();
      activity = aData;
      itinerary = iData;
    }

    if (!activity || !itinerary) throw new NotFoundError('Activity or itinerary not found');

    const destInfo = classifyDestination(itinerary.destination);

    const promptText = buildSwapActivityPrompt({
      dayContext: { timeSlot: `${activity.start_time} - ${activity.end_time}` },
      activityJson: activity,
      maxCost: Number(activity.estimated_cost) * 1.5 || 2000,
      currency: itinerary.currency,
      instruction,
      destination: itinerary.destination,
      destinationType: destInfo.type,
    });

    const mockSwapFallback = () => ({
      activity: {
        start_time: activity.start_time,
        end_time: activity.end_time,
        title: `Alternative Experience: ${activity.place_name}`,
        place_name: `${activity.place_name} Artisanal Walk`,
        city: activity.city || destInfo.canonical_name,
        country: activity.country || destInfo.country,
        category: activity.category,
        description: `Delightful alternative activity handpicked for your route: ${instruction || 'distinct local flavor'}`,
        estimated_cost: activity.estimated_cost,
        travel_minutes_from_previous: activity.travel_minutes_from_previous,
        maps_query: `${activity.place_name}, ${activity.city || destInfo.canonical_name}, ${activity.country || destInfo.country}`,
        tips: 'Ideal quieter spot during midday hours.',
        booking_recommended: false,
        source_place_id: null,
        is_ai_suggested: true,
      },
    });

    const swapResult = await callGeminiJson({
      systemInstruction: SYSTEM_INSTRUCTION,
      parts: [{ text: promptText }],
      schema: swapActivityJsonSchema,
      zodSchema: swapActivityResponseSchema,
      temperature: 0.7,
      kind: 'activity_swap',
      userId,
      tripId: itinerary.trip_id,
      mockFallback: mockSwapFallback,
    });

    const newAct = swapResult.activity;
    const updates = {
      title: newAct.title,
      place_name: newAct.place_name,
      category: newAct.category,
      description: newAct.description,
      estimated_cost: newAct.estimated_cost,
      maps_query: newAct.maps_query,
      tips: newAct.tips,
      booking_recommended: newAct.booking_recommended,
      is_ai_suggested: true,
      updated_at: new Date().toISOString(),
    };

    if (isDevPlaceholderSupabase) {
      Object.assign(activity, updates);
    } else {
      await req.supabase.from('itinerary_activities').update(updates).eq('id', activityId);
    }

    await recalculateItineraryCosts(itineraryId);
    const updated = await getFullItineraryByVersion({ tripId: itinerary.trip_id, version: itinerary.version, userId });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateActivity(req, res, next) {
  try {
    const userId = req.user.id;
    const { itineraryId, activityId } = req.params;
    const updates = req.body;

    if (isDevPlaceholderSupabase) {
      const act = devStore.itinerary_activities.get(activityId);
      if (!act || act.user_id !== userId) throw new NotFoundError('Activity not found');
      Object.assign(act, updates, { updated_at: new Date().toISOString() });
    } else {
      const { error } = await req.supabase
        .from('itinerary_activities')
        .update(updates)
        .eq('id', activityId)
        .eq('user_id', userId);
      if (error) throw error;
    }

    await recalculateItineraryCosts(itineraryId);
    const itin = isDevPlaceholderSupabase ? devStore.itineraries.get(itineraryId) : null;
    const tripId = itin ? itin.trip_id : (await req.supabase.from('itineraries').select('trip_id').eq('id', itineraryId).single()).data?.trip_id;

    const fullItinerary = await getFullItineraryByVersion({ tripId, userId });
    res.json({ success: true, data: fullItinerary });
  } catch (err) {
    next(err);
  }
}

export async function reorderActivities(req, res, next) {
  try {
    const userId = req.user.id;
    const { itineraryId, dayId } = req.params;
    const { orderedActivityIds } = req.body;

    if (!Array.isArray(orderedActivityIds)) {
      throw new ValidationError('orderedActivityIds must be an array of activity IDs');
    }

    if (isDevPlaceholderSupabase) {
      orderedActivityIds.forEach((id, idx) => {
        const act = devStore.itinerary_activities.get(id);
        if (act) act.sort_order = idx + 1;
      });
    } else {
      for (let i = 0; i < orderedActivityIds.length; i++) {
        await req.supabase
          .from('itinerary_activities')
          .update({ sort_order: i + 1 })
          .eq('id', orderedActivityIds[i])
          .eq('day_id', dayId)
          .eq('user_id', userId);
      }
    }

    const itin = isDevPlaceholderSupabase ? devStore.itineraries.get(itineraryId) : null;
    const tripId = itin ? itin.trip_id : (await req.supabase.from('itineraries').select('trip_id').eq('id', itineraryId).single()).data?.trip_id;

    const fullItinerary = await getFullItineraryByVersion({ tripId, userId });
    res.json({ success: true, data: fullItinerary });
  } catch (err) {
    next(err);
  }
}

export async function deleteActivity(req, res, next) {
  try {
    const userId = req.user.id;
    const { itineraryId, activityId } = req.params;

    if (isDevPlaceholderSupabase) {
      const act = devStore.itinerary_activities.get(activityId);
      if (!act || act.user_id !== userId) throw new NotFoundError('Activity not found');
      devStore.itinerary_activities.delete(activityId);
    } else {
      const { error } = await req.supabase
        .from('itinerary_activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', userId);
      if (error) throw error;
    }

    await recalculateItineraryCosts(itineraryId);
    const itin = isDevPlaceholderSupabase ? devStore.itineraries.get(itineraryId) : null;
    const tripId = itin ? itin.trip_id : (await req.supabase.from('itineraries').select('trip_id').eq('id', itineraryId).single()).data?.trip_id;

    const fullItinerary = await getFullItineraryByVersion({ tripId, userId });
    res.json({ success: true, data: fullItinerary });
  } catch (err) {
    next(err);
  }
}
