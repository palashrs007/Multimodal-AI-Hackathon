import { classifyDestination } from '../services/destinationService.js';

export function buildItineraryPrompt({
  durationDays,
  budgetAmount,
  budgetCurrency = 'INR',
  travelers = 1,
  pace = 'balanced',
  startDate = 'unspecified',
  destination = '',
  destinationSource = 'user',
  destinationType = null,
  destinationCountry = null,
  originCity = '',
  noteText = '',
  placesMentioned = [],
  interests = [],
  mustInclude = [],
  mustAvoid = [],
  dietaryOrAccessNotes = '',
  destinationHint = '',
  places = [],
  aggregatedStyleTags = [],
  overallMood = '',
}) {
  const confirmedDest = destination || destinationHint || 'Custom Destination';
  const destInfo = classifyDestination(confirmedDest);
  const effectiveType = destinationType || destInfo.type;
  const effectiveCountry = destinationCountry || destInfo.country;

  const placesFormatted = places.map((p) => ({
    id: p.id,
    name: p.name,
    is_identified: p.is_identified,
    category: p.category,
    city: p.city || null,
    country: p.country || null,
    style_tags: p.style_tags || [],
    description: p.description || '',
  }));

  const placesMentionedStr =
    placesMentioned && placesMentioned.length > 0
      ? placesMentioned.join(', ')
      : 'None explicitly specified';

  return `DESTINATION (HARD CONSTRAINT): ${confirmedDest}  [source: ${destinationSource}]
Destination type: ${effectiveType}
Destination country: ${effectiveCountry}
Every place, activity, cost estimate and maps_query MUST be located in or within a sensible day-trip distance of this destination. Do not output places from any other destination.

TASK: Create a realistic, day-by-day travel itinerary strictly for ${confirmedDest}.

${
  effectiveType === 'country'
    ? `COUNTRY-LEVEL ROUTE PLANNING INSTRUCTION:
Because the destination is a country (${confirmedDest}), select 2 to 4 iconic, well-connected cities/hubs appropriate for a ${durationDays}-day journey (e.g. for Japan: Tokyo and Kyoto/Osaka; for France: Paris and Lyon/Nice). Include reasonable inter-city transit time (e.g. high-speed train or domestic flight) and cost between hubs.`
    : `LOCAL EXPLORATION INSTRUCTION:
Because the destination is a ${effectiveType} (${confirmedDest}), keep all activities strictly within ${confirmedDest} and its immediate surrounding day-trip perimeter. Do not suggest other distant cities.`
}

TRIP PARAMETERS:
- Destination: ${confirmedDest} (Country: ${effectiveCountry})
- Duration: ${durationDays} days (you MUST return exactly ${durationDays} items in the days array, numbered 1 to ${durationDays})
- Total budget: ${budgetAmount} ${budgetCurrency} (for ${travelers} travelers)
- Estimated costs in activities: express in ${budgetCurrency} (if destination local currency is ${destInfo.currency_code}, convert approximately into the user's budget currency ${budgetCurrency}; all conversion rates are estimates)
- Pace: ${pace} (relaxed=2-3 activities/day, balanced=3-4, packed=5-6)
- Start date: ${startDate || 'unspecified'}
- Starting / Origin city: ${originCity || 'unspecified'}
- Interests: ${interests.length > 0 ? interests.join(', ') : 'general sightseeing, culture, local food'}
- Must include: ${mustInclude.length > 0 ? mustInclude.join(', ') : 'none'}
- Must avoid: ${mustAvoid.length > 0 ? mustAvoid.join(', ') : 'none'}
- Dietary/accessibility notes: ${dietaryOrAccessNotes || 'None'}
- User text notes: <user_note>${noteText || 'None'}</user_note>
- Places named in text: ${placesMentionedStr}

USER-SELECTED PLACES FROM SCREENSHOTS:
${
  placesFormatted.length > 0
    ? JSON.stringify(placesFormatted, null, 2)
    : `No screenshot places provided. Build itinerary entirely from user note, destination (${confirmedDest}), interests, and budget.`
}

STYLE & VIBE PROFILE:
- Desired vibe / mood: ${overallMood || 'authentic, memorable, and visually curated'}
- Tags: ${aggregatedStyleTags.length > 0 ? aggregatedStyleTags.join(', ') : 'scenic, authentic, cultural, local'}

STRICT RULES:
1. Every activity MUST have its "city" and "country" fields explicitly set to the city and country in ${confirmedDest}.
2. Every maps_query must be a concise navigation string formatted as: "<place name>, <city>, <country>".
3. Chronological sequencing: start_time and end_time in 24hr "HH:MM" format (e.g. 09:00 to 11:30), strictly non-overlapping.
4. If screenshot places belong to another city outside ${confirmedDest}, substitute with a matching equivalent in ${confirmedDest}.
5. Output valid JSON matching the schema.`;
}

export const itineraryJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    destination: { type: 'string' },
    destination_country: { type: 'string', description: 'Country of the destination' },
    summary: { type: 'string', description: 'max 400 chars summary of the trip' },
    currency: { type: 'string' },
    total_estimated_cost: { type: 'number' },
    budget_status: {
      type: 'string',
      enum: ['within_budget', 'near_limit', 'over_budget'],
    },
    budget_breakdown: {
      type: 'object',
      properties: {
        accommodation: { type: 'number' },
        food: { type: 'number' },
        activities: { type: 'number' },
        local_transport: { type: 'number' },
        other: { type: 'number' },
      },
      required: ['accommodation', 'food', 'activities', 'local_transport', 'other'],
    },
    warnings: { type: 'array', items: { type: 'string' } },
    general_tips: { type: 'array', items: { type: 'string' } },
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day_number: { type: 'integer' },
          title: { type: 'string' },
          theme: { type: 'string' },
          daily_estimated_cost: { type: 'number' },
          notes: { type: 'string', nullable: true },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                start_time: { type: 'string', description: 'HH:MM in 24hr format' },
                end_time: { type: 'string', description: 'HH:MM in 24hr format' },
                title: { type: 'string' },
                place_name: { type: 'string' },
                city: { type: 'string', description: 'City where this activity is located' },
                country: { type: 'string', description: 'Country where this activity is located' },
                category: {
                  type: 'string',
                  enum: [
                    'food_cafe',
                    'nature_outdoors',
                    'beach',
                    'culture_heritage',
                    'religious_spiritual',
                    'museum_art',
                    'nightlife',
                    'shopping_market',
                    'adventure_sports',
                    'wellness_spa',
                    'viewpoint_photo_spot',
                    'stay_accommodation',
                    'local_experience',
                    'transport_hub',
                    'other',
                  ],
                },
                description: { type: 'string', description: 'Max 280 chars' },
                estimated_cost: { type: 'number' },
                travel_minutes_from_previous: { type: 'number' },
                maps_query: { type: 'string' },
                tips: { type: 'string', nullable: true },
                booking_recommended: { type: 'boolean' },
                source_place_id: { type: 'string', nullable: true },
                is_ai_suggested: { type: 'boolean' },
              },
              required: [
                'start_time',
                'end_time',
                'title',
                'place_name',
                'city',
                'country',
                'category',
                'description',
                'estimated_cost',
                'travel_minutes_from_previous',
                'maps_query',
                'booking_recommended',
                'is_ai_suggested',
              ],
            },
          },
        },
        required: ['day_number', 'title', 'daily_estimated_cost', 'activities'],
      },
    },
  },
  required: [
    'title',
    'destination',
    'destination_country',
    'summary',
    'currency',
    'total_estimated_cost',
    'budget_status',
    'budget_breakdown',
    'warnings',
    'general_tips',
    'days',
  ],
};
