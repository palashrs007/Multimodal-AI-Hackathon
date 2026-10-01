import { callGeminiJson, MODEL_ROLES } from './gemini.js';
import { SYSTEM_INSTRUCTION } from '../prompts/system.js';
import { buildItineraryPrompt, itineraryJsonSchema } from '../prompts/itinerary.js';
import { buildRegenerateDayPrompt, regenerateDayJsonSchema } from '../prompts/regenerateDay.js';
import { buildSwapActivityPrompt, swapActivityJsonSchema } from '../prompts/swapActivity.js';
import { itinerarySchema, daySchema, swapActivityResponseSchema } from '../schemas/itinerary.js';
import { postProcessItinerary, calculateBudgetStatus } from './budgetService.js';
import { getMockItinerary } from './mockData.js';
import { classifyDestination, validateItineraryDestination } from './destinationService.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { NotFoundError, ForbiddenError, AIServiceError } from '../lib/errors.js';

export async function generateItinerary({ tripId, userId }) {
  logger.info({ tripId, userId }, 'Generating new itinerary version');

  // 1. Fetch trip and extracted places freshly
  let trip;
  let places = [];
  let existingVersions = [];

  if (isDevPlaceholderSupabase) {
    trip = devStore.trips.get(tripId);
    if (!trip || trip.user_id !== userId) throw new NotFoundError('Trip not found');
    places = Array.from(devStore.extracted_places.values()).filter(
      (p) => p.trip_id === tripId && p.included
    );
    existingVersions = Array.from(devStore.itineraries.values()).filter(
      (i) => i.trip_id === tripId
    );
  } else {
    const { data: tripData, error: tripErr } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();
    if (tripErr || !tripData) throw new NotFoundError('Trip not found');
    trip = tripData;

    const { data: placesData, error: placesErr } = await supabaseAdmin
      .from('extracted_places')
      .select('*')
      .eq('trip_id', tripId)
      .eq('included', true);
    if (placesErr) throw new Error(placesErr.message);
    places = placesData || [];

    const { data: vData } = await supabaseAdmin
      .from('itineraries')
      .select('version')
      .eq('trip_id', tripId)
      .order('version', { ascending: false });
    existingVersions = vData || [];
  }

  // Determine new version number (1, 2, 3...)
  const nextVersion = existingVersions.length > 0
    ? Math.max(...existingVersions.map((v) => v.version || 1)) + 1
    : 1;

  // Model routing: PRIMARY by default; switch to ESCALATION when > 6 places or > 7 days
  const itinRole = places.length > 6 || (trip.duration_days && trip.duration_days > 7)
    ? 'ESCALATION'
    : 'PRIMARY';

  // Aggregate style tags from places
  const allTags = new Set();
  places.forEach((p) => {
    (p.style_tags || []).forEach((t) => allTags.add(t));
  });

  const destInfo = classifyDestination(trip.destination || trip.destination_hint || '');

  const promptText = buildItineraryPrompt({
    durationDays: trip.duration_days,
    budgetAmount: trip.budget_amount,
    budgetCurrency: trip.budget_currency,
    travelers: trip.travelers,
    pace: trip.pace,
    startDate: trip.start_date,
    destination: trip.destination || trip.destination_hint || '',
    destinationSource: trip.destination_source || 'user',
    destinationType: destInfo.type,
    destinationCountry: destInfo.country,
    originCity: trip.origin_city || trip.parsed_constraints?.origin_city || '',
    noteText: trip.note_text || '',
    placesMentioned: trip.parsed_constraints?.places_mentioned || [],
    interests: trip.interests || [],
    mustInclude: trip.parsed_constraints?.must_include || [],
    mustAvoid: trip.parsed_constraints?.must_avoid || [],
    dietaryOrAccessNotes: trip.dietary_or_access_notes || '',
    destinationHint: trip.destination_hint || trip.destination || '',
    places,
    aggregatedStyleTags: Array.from(allTags),
    overallMood: 'authentic, memorable, and visually curated',
  });

  const rawAiResult = await callGeminiJson({
    systemInstruction: SYSTEM_INSTRUCTION,
    parts: [{ text: promptText }],
    schema: itineraryJsonSchema,
    zodSchema: itinerarySchema,
    temperature: 0.7,
    kind: 'itinerary_generation',
    role: itinRole,
    userId,
    tripId,
    mockFallback: () => getMockItinerary(trip, places),
  });

  // Server-side geo-validation with 1 repair retry
  let validatedAiResult = rawAiResult;
  let validation = validateItineraryDestination(validatedAiResult, destInfo);
  let retryAttempted = false;

  if (!validation.isValid) {
    logger.warn(
      {
        tripId,
        destination: destInfo.canonical_name,
        violatingCount: validation.violatingActivities.length,
        violations: validation.violatingActivities,
      },
      'Generated itinerary failed geo-validation. Triggering one automatic repair retry'
    );

    retryAttempted = true;
    const repairPrompt = `URGENT GEO-CORRECTION REQUIRED:
The previous itinerary draft contained activities outside the mandatory destination '${destInfo.canonical_name}' (${destInfo.country}).
Violating activities detected:
${JSON.stringify(validation.violatingActivities, null, 2)}

INSTRUCTION:
Regenerate and replace the complete itinerary. You MUST replace all violating activities with authentic, verified attractions located strictly within ${destInfo.canonical_name} (${destInfo.country}).
Every single activity MUST have its "city" and "country" fields set to the corresponding location within ${destInfo.canonical_name}.

Original trip requirements:
${promptText}`;

    try {
      const repairAiResult = await callGeminiJson({
        systemInstruction: SYSTEM_INSTRUCTION,
        parts: [{ text: repairPrompt }],
        schema: itineraryJsonSchema,
        zodSchema: itinerarySchema,
        temperature: 0.4,
        kind: 'itinerary_repair',
        role: 'ESCALATION',
        userId,
        tripId,
        mockFallback: () => getMockItinerary(trip, places),
      });

      const repairValidation = validateItineraryDestination(repairAiResult, destInfo);
      if (repairValidation.isValid) {
        logger.info(
          { tripId, destination: destInfo.canonical_name },
          'Repair retry succeeded. Itinerary is now geo-valid.'
        );
        validatedAiResult = repairAiResult;
        validation = repairValidation;
      } else {
        logger.error(
          {
            tripId,
            destination: destInfo.canonical_name,
            violations: repairValidation.violatingActivities,
          },
          'Repair retry failed geo-validation. Returning AI_DESTINATION_MISMATCH'
        );
        throw new AIServiceError(
          'AI_DESTINATION_MISMATCH',
          `Generated itinerary places do not match destination '${destInfo.canonical_name}' (${destInfo.country}) after automatic repair.`,
          repairValidation.violatingActivities
        );
      }
    } catch (err) {
      if (err.code === 'AI_DESTINATION_MISMATCH') {
        throw err;
      }
      logger.error({ err }, 'Error during itinerary repair retry');
      throw new AIServiceError(
        'AI_DESTINATION_MISMATCH',
        `Generated itinerary places do not match destination '${destInfo.canonical_name}'.`,
        validation.violatingActivities
      );
    }
  }

  // Safe pino debug log (no notes, keys, or image bytes)
  logger.debug(
    {
      tripId,
      destination: trip.destination || trip.destination_hint,
      destination_source: trip.destination_source || 'user',
      destination_type: destInfo.type,
      model_used: MODEL_ROLES[itinRole] || MODEL_ROLES.PRIMARY,
      activities_rejected_by_geo_validation: validation.violatingActivities.length,
      retry_attempted: retryAttempted,
    },
    'Itinerary generation completed geo-validation'
  );

  // Post-process: recalculate math, sanity check times, link source IDs
  const finalItinerary = postProcessItinerary(validatedAiResult, trip, places);

  // If zero extracted places were provided, enforce that all activities are AI suggested
  if (places.length === 0) {
    for (const d of finalItinerary.days) {
      for (const a of d.activities) {
        a.is_ai_suggested = true;
      }
    }
  }

  // Persist into database
  const itineraryId = crypto.randomUUID();
  const itineraryRecord = {
    id: itineraryId,
    trip_id: tripId,
    user_id: userId,
    version: nextVersion,
    title: finalItinerary.title,
    summary: finalItinerary.summary,
    destination: trip.destination || finalItinerary.destination || trip.destination_hint,
    currency: finalItinerary.currency,
    total_estimated_cost: finalItinerary.total_estimated_cost,
    budget_status: finalItinerary.budget_status,
    warnings: finalItinerary.warnings || [],
    model_name: MODEL_ROLES[itinRole] || MODEL_ROLES.PRIMARY,
    raw_ai_response: validatedAiResult,
    created_at: new Date().toISOString(),
  };

  const daysToInsert = [];
  const activitiesToInsert = [];

  for (const day of finalItinerary.days) {
    const dayId = crypto.randomUUID();
    daysToInsert.push({
      id: dayId,
      itinerary_id: itineraryId,
      user_id: userId,
      day_number: day.day_number,
      title: day.title,
      theme: day.theme || '',
      daily_estimated_cost: day.daily_estimated_cost || 0,
      notes: day.notes || null,
    });

    (day.activities || []).forEach((act, actIdx) => {
      activitiesToInsert.push({
        id: crypto.randomUUID(),
        day_id: dayId,
        user_id: userId,
        sort_order: actIdx + 1,
        start_time: act.start_time,
        end_time: act.end_time,
        title: act.title,
        place_name: act.place_name,
        category: act.category || 'other',
        description: act.description || '',
        estimated_cost: act.estimated_cost || 0,
        travel_minutes_from_previous: act.travel_minutes_from_previous || 0,
        maps_query: act.maps_query || `${act.place_name}, ${act.city || ''} ${act.country || finalItinerary.destination}`.trim(),
        tips: act.tips || null,
        booking_recommended: Boolean(act.booking_recommended),
        source_image_id: act.source_image_id || null,
        extracted_place_id: act.extracted_place_id || null,
        is_ai_suggested: Boolean(act.is_ai_suggested),
        city: act.city || null,
        country: act.country || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  if (isDevPlaceholderSupabase) {
    devStore.itineraries.set(itineraryId, itineraryRecord);
    for (const d of daysToInsert) devStore.itinerary_days.set(d.id, d);
    for (const a of activitiesToInsert) devStore.itinerary_activities.set(a.id, a);
    trip.status = 'ready';
  } else {
    await supabaseAdmin.from('itineraries').insert(itineraryRecord);
    await supabaseAdmin.from('itinerary_days').insert(daysToInsert);
    if (activitiesToInsert.length > 0) {
      // In Supabase, omit city and country from insert if table doesn't have columns yet
      const safeSupabaseActivities = activitiesToInsert.map(({ city, country, ...rest }) => rest);
      await supabaseAdmin.from('itinerary_activities').insert(safeSupabaseActivities);
    }
    await supabaseAdmin.from('trips').update({ status: 'ready' }).eq('id', tripId);
  }

  return await getFullItineraryByVersion({ tripId, version: nextVersion, userId });
}

export async function getFullItineraryByVersion({ tripId, version, userId, isShared = false }) {
  if (isDevPlaceholderSupabase) {
    const list = Array.from(devStore.itineraries.values()).filter((i) => i.trip_id === tripId);
    if (list.length === 0) return null;
    let itinerary = null;
    if (version) {
      itinerary = list.find((i) => i.version === Number(version));
    }
    if (!itinerary) {
      itinerary = list.sort((a, b) => b.version - a.version)[0];
    }
    if (!itinerary) return null;

    const days = Array.from(devStore.itinerary_days.values())
      .filter((d) => d.itinerary_id === itinerary.id)
      .sort((a, b) => a.day_number - b.day_number);

    for (const day of days) {
      day.activities = Array.from(devStore.itinerary_activities.values())
        .filter((a) => a.day_id === day.id)
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    return {
      ...itinerary,
      days,
    };
  }

  // Real Supabase query
  let query = supabaseAdmin
    .from('itineraries')
    .select(`
      *,
      days:itinerary_days (
        *,
        activities:itinerary_activities (*)
      )
    `)
    .eq('trip_id', tripId);

  if (!isShared) {
    query = query.eq('user_id', userId);
  }

  if (version) {
    query = query.eq('version', Number(version));
  } else {
    query = query.order('version', { ascending: false }).limit(1);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;

  const itinerary = data[0];
  // Sort days and activities and enrich location fields
  if (itinerary.days) {
    itinerary.days.sort((a, b) => a.day_number - b.day_number);
    itinerary.days.forEach((day, dIdx) => {
      if (day.activities) {
        day.activities.sort((a, b) => a.sort_order - b.sort_order);
        const rawDay = itinerary.raw_ai_response?.days?.[dIdx];
        day.activities.forEach((act, aIdx) => {
          const rawAct = rawDay?.activities?.[aIdx];
          if (!act.city && rawAct?.city) act.city = rawAct.city;
          if (!act.country && rawAct?.country) act.country = rawAct.country;
        });
      }
    });
  }

  return itinerary;
}

export async function recalculateItineraryCosts(itineraryId) {
  if (isDevPlaceholderSupabase) {
    const itinerary = devStore.itineraries.get(itineraryId);
    if (!itinerary) return;
    const trip = devStore.trips.get(itinerary.trip_id);

    const days = Array.from(devStore.itinerary_days.values()).filter(
      (d) => d.itinerary_id === itineraryId
    );

    let totalCost = 0;
    for (const day of days) {
      const acts = Array.from(devStore.itinerary_activities.values()).filter(
        (a) => a.day_id === day.id
      );
      const dayCost = acts.reduce((acc, a) => acc + (Number(a.estimated_cost) || 0), 0);
      day.daily_estimated_cost = dayCost;
      totalCost += dayCost;
    }

    const budgetAmount = trip ? Number(trip.budget_amount) : 0;
    itinerary.total_estimated_cost = totalCost;
    itinerary.budget_status = calculateBudgetStatus(totalCost, budgetAmount);
    return;
  }

  // Supabase recalculation
  const { data: days } = await supabaseAdmin
    .from('itinerary_days')
    .select('id, daily_estimated_cost')
    .eq('itinerary_id', itineraryId);

  if (!days) return;

  let grandTotal = 0;
  for (const day of days) {
    const { data: acts } = await supabaseAdmin
      .from('itinerary_activities')
      .select('estimated_cost')
      .eq('day_id', day.id);

    const dayCost = (acts || []).reduce((acc, a) => acc + (Number(a.estimated_cost) || 0), 0);
    grandTotal += dayCost;

    await supabaseAdmin
      .from('itinerary_days')
      .update({ daily_estimated_cost: dayCost })
      .eq('id', day.id);
  }

  const { data: itin } = await supabaseAdmin
    .from('itineraries')
    .select('trip_id')
    .eq('id', itineraryId)
    .single();

  if (itin) {
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('budget_amount')
      .eq('id', itin.trip_id)
      .single();

    const budgetStatus = calculateBudgetStatus(grandTotal, trip ? Number(trip.budget_amount) : 0);
    await supabaseAdmin
      .from('itineraries')
      .update({
        total_estimated_cost: grandTotal,
        budget_status: budgetStatus,
      })
      .eq('id', itineraryId);
  }
}
