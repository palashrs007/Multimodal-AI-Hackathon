/**
 * Calculates budget status based on total estimated cost vs user budget:
 * - within_budget: <= 90%
 * - near_limit: > 90% and <= 100%
 * - over_budget: > 100%
 */
export function calculateBudgetStatus(totalCost, budgetAmount) {
  if (!budgetAmount || budgetAmount <= 0) return 'within_budget';
  const ratio = totalCost / budgetAmount;
  if (ratio <= 0.90) return 'within_budget';
  if (ratio <= 1.00) return 'near_limit';
  return 'over_budget';
}

/**
 * Post-processes itinerary data to recalculate math, enforce sanity, and map place relationships.
 */
export function postProcessItinerary(itineraryData, trip, extractedPlaces = []) {
  const budgetAmount = Number(trip.budget_amount) || 0;
  const currency = trip.budget_currency || itineraryData.currency || 'INR';
  const placeMap = new Map(extractedPlaces.map((p) => [p.id, p]));

  let sumActivityCost = 0;
  const processedDays = (itineraryData.days || []).map((day, dIdx) => {
    let dayCost = 0;
    let prevEndTime = '08:00';

    const processedActivities = (day.activities || []).map((act, actIdx) => {
      // Validate cost
      const actCost = Math.max(0, Number(act.estimated_cost) || 0);
      dayCost += actCost;

      // Sanitize times: Ensure activities are within 06:00 and 23:59 and sequential
      let startTime = act.start_time;
      let endTime = act.end_time;

      if (!startTime || !endTime || endTime <= startTime || startTime < prevEndTime) {
        // Compute reasonable progressive slots if model produced overlapping times
        const startHour = 9 + Math.floor(actIdx * 2.5);
        const endHour = startHour + 2;
        startTime = `${String(Math.min(21, startHour)).padStart(2, '0')}:00`;
        endTime = `${String(Math.min(23, endHour)).padStart(2, '0')}:00`;
      }
      prevEndTime = endTime;

      // Link to extracted place and source image
      let extractedPlaceId = null;
      let sourceImageId = null;

      if (act.source_place_id && placeMap.has(act.source_place_id)) {
        const place = placeMap.get(act.source_place_id);
        extractedPlaceId = place.id;
        sourceImageId = place.image_id || null;
      }

      return {
        ...act,
        start_time: startTime,
        end_time: endTime,
        estimated_cost: actCost,
        extracted_place_id: extractedPlaceId,
        source_image_id: sourceImageId,
      };
    });

    sumActivityCost += dayCost;

    return {
      ...day,
      day_number: day.day_number || dIdx + 1,
      daily_estimated_cost: dayCost,
      activities: processedActivities,
    };
  });

  // Calculate accommodation and other estimated components if provided or estimate standard breakdown
  const existingBreakdown = itineraryData.budget_breakdown || {};
  const accommodation = Number(existingBreakdown.accommodation) || Math.round(budgetAmount * 0.35);
  const food = Number(existingBreakdown.food) || Math.round(budgetAmount * 0.25);
  const local_transport = Number(existingBreakdown.local_transport) || Math.round(budgetAmount * 0.12);
  const other = Number(existingBreakdown.other) || Math.round(budgetAmount * 0.05);

  const totalCost = sumActivityCost + accommodation + local_transport;
  const budgetStatus = calculateBudgetStatus(totalCost, budgetAmount);

  // Warnings check
  const warnings = [...(itineraryData.warnings || [])];
  if (budgetStatus === 'over_budget') {
    const diff = totalCost - budgetAmount;
    warnings.push(
      `This plan is currently ~${diff} ${currency} over your requested budget. Recommended: swap premium dining for local cafes or opt for boutique guesthouses.`
    );
  } else if (budgetStatus === 'near_limit') {
    warnings.push(
      `This plan utilizes nearly 100% of your allocated budget. Consider keeping emergency local currency on hand.`
    );
  }

  return {
    ...itineraryData,
    currency,
    total_estimated_cost: totalCost,
    budget_status: budgetStatus,
    budget_breakdown: {
      accommodation,
      food,
      activities: sumActivityCost,
      local_transport,
      other,
    },
    warnings,
    days: processedDays,
  };
}
