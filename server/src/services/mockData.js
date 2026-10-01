import { classifyDestination } from './destinationService.js';

export function getMockImageAnalysis(index = 0, destination = '') {
  const destInfo = classifyDestination(destination || 'Scenic Spot');
  const city = destInfo.type === 'city' ? destInfo.canonical_name : destInfo.canonical_name;
  const country = destInfo.country;

  const samples = [
    {
      image_summary: `A breathtaking sunrise view overlooking iconic landmarks in ${destInfo.canonical_name}.`,
      detected_text: [`Welcome to ${destInfo.canonical_name}`, 'Historic Center', 'Scenic View'],
      places: [
        {
          name: `${destInfo.canonical_name} Heritage Landmark`,
          is_identified: true,
          category: 'culture_heritage',
          city: city,
          region: destInfo.canonical_name,
          country: country,
          approx_lat: 35.6762,
          approx_lng: 139.6503,
          confidence: 0.95,
          style_tags: ['heritage', 'architecture', 'scenic', 'authentic'],
          description: `A celebrated cultural landmark in ${destInfo.canonical_name} known for its historic architecture and vistas.`,
          evidence: `Distinctive architectural features and signage consistent with ${destInfo.canonical_name}.`,
        },
      ],
      overall_mood: 'scenic, authentic, and inspiring',
    },
    {
      image_summary: `A cozy artisan café and brunch spot in the vibrant quarter of ${destInfo.canonical_name}.`,
      detected_text: ['Artisan Coffee & Bakery', destInfo.canonical_name],
      places: [
        {
          name: `${destInfo.canonical_name} Artisan Bistro`,
          is_identified: true,
          category: 'food_cafe',
          city: city,
          region: destInfo.canonical_name,
          country: country,
          approx_lat: 35.6895,
          approx_lng: 139.6917,
          confidence: 0.92,
          style_tags: ['aesthetic-cafe', 'cozy', 'minimalist', 'local-eats'],
          description: `Popular neighborhood cafe in ${destInfo.canonical_name} serving seasonal drinks and local pastries.`,
          evidence: `Storefront signage and neighborhood aesthetic matching ${destInfo.canonical_name}.`,
        },
      ],
      overall_mood: 'relaxed, cozy, and aesthetic',
    },
  ];

  return samples[index % samples.length];
}

export function getMockConstraintParsing(noteText = '', structured = {}) {
  let destinationMentioned = structured.destination || structured.destination_hint || null;

  if (!destinationMentioned && noteText) {
    const lower = noteText.toLowerCase();
    const common = [
      'japan', 'paris', 'bali', 'dubai', 'switzerland', 'thailand', 'italy',
      'tokyo', 'kyoto', 'amalfi', 'rome', 'london', 'new york', 'jaipur',
      'manali', 'goa', 'lisbon', 'cape town', 'singapore', 'vietnam'
    ];
    for (const place of common) {
      if (lower.includes(place)) {
        destinationMentioned = place.charAt(0).toUpperCase() + place.slice(1);
        break;
      }
    }
  }

  const destInfo = classifyDestination(destinationMentioned || structured.destination || 'Selected Destination');

  return {
    transcript: null,
    budget_amount: structured.budget_amount || 50000,
    budget_currency: structured.budget_currency || 'INR',
    budget_scope: 'total',
    duration_days: structured.duration_days || 4,
    travelers: structured.travelers || 1,
    pace: structured.pace || 'balanced',
    destination_mentioned: destinationMentioned,
    origin_city: structured.origin_city || null,
    places_mentioned: [],
    interests: ['culture_heritage', 'food_cafe', 'viewpoint_photo_spot'],
    must_include: [`Top highlights of ${destInfo.canonical_name}`],
    must_avoid: ['overcrowded tourist traps'],
    dietary_notes: 'Local culinary specialties and fresh street fare',
    accessibility_notes: null,
    stay_preference: `Centrally located boutique hotel in ${destInfo.canonical_name}`,
    transport_preference: 'Walkable districts and convenient public transit',
    ambiguities: [],
    destination_info: destInfo,
  };
}

export function getMockItinerary(tripData, places = []) {
  const destination = tripData.destination || tripData.destination_hint || 'Selected Destination';
  const destInfo = classifyDestination(destination);
  const currency = tripData.budget_currency || 'INR';
  const duration = Number(tripData.duration_days) || 3;
  const budget = Number(tripData.budget_amount) || 50000;

  // Build destination-specific sample places if none provided
  const city = destInfo.type === 'city' ? destInfo.canonical_name : `${destInfo.canonical_name} Central`;
  const country = destInfo.country;

  let samplePlaces = places.length > 0 ? places : [];

  if (samplePlaces.length === 0) {
    if (destInfo.canonical_name.toLowerCase().includes('japan') || destInfo.country.toLowerCase().includes('japan')) {
      samplePlaces = [
        { id: 'mock-p1', name: 'Senso-ji Temple & Asakusa District', category: 'culture_heritage', city: 'Tokyo', country: 'Japan' },
        { id: 'mock-p2', name: 'Shinjuku Gyoen National Garden', category: 'nature_outdoors', city: 'Tokyo', country: 'Japan' },
        { id: 'mock-p3', name: 'Fushimi Inari-taisha Shrine', category: 'viewpoint_photo_spot', city: 'Kyoto', country: 'Japan' },
        { id: 'mock-p4', name: 'Arashiyama Bamboo Grove', category: 'nature_outdoors', city: 'Kyoto', country: 'Japan' },
      ];
    } else if (destInfo.canonical_name.toLowerCase().includes('paris') || destInfo.country.toLowerCase().includes('france')) {
      samplePlaces = [
        { id: 'mock-p1', name: 'Louvre Museum & Tuileries Garden', category: 'museum_art', city: 'Paris', country: 'France' },
        { id: 'mock-p2', name: 'Montmartre & Sacré-Cœur Basilica', category: 'culture_heritage', city: 'Paris', country: 'France' },
        { id: 'mock-p3', name: 'Le Marais Historic District & Cafes', category: 'food_cafe', city: 'Paris', country: 'France' },
        { id: 'mock-p4', name: 'Eiffel Tower Sunset at Trocadéro', category: 'viewpoint_photo_spot', city: 'Paris', country: 'France' },
      ];
    } else if (destInfo.canonical_name.toLowerCase().includes('bali') || destInfo.country.toLowerCase().includes('indonesia')) {
      samplePlaces = [
        { id: 'mock-p1', name: 'Ubud Sacred Monkey Forest & Campuhan Ridge', category: 'nature_outdoors', city: 'Ubud', country: 'Indonesia' },
        { id: 'mock-p2', name: 'Tegalalang Scenic Rice Terraces', category: 'viewpoint_photo_spot', city: 'Ubud', country: 'Indonesia' },
        { id: 'mock-p3', name: 'Uluwatu Sunset Sea Temple', category: 'culture_heritage', city: 'Uluwatu', country: 'Indonesia' },
        { id: 'mock-p4', name: 'Canggu Beachfront Sunset Lounge', category: 'beach', city: 'Canggu', country: 'Indonesia' },
      ];
    } else {
      samplePlaces = [
        { id: 'mock-p1', name: `${destInfo.canonical_name} Historic Old Town`, category: 'culture_heritage', city, country },
        { id: 'mock-p2', name: `${destInfo.canonical_name} Artisan Food Market`, category: 'food_cafe', city, country },
        { id: 'mock-p3', name: `${destInfo.canonical_name} Panoramic Viewpoint`, category: 'viewpoint_photo_spot', city, country },
        { id: 'mock-p4', name: `${destInfo.canonical_name} Waterfront Promenade`, category: 'nature_outdoors', city, country },
      ];
    }
  }

  const days = [];
  let totalCost = 0;

  for (let d = 1; d <= duration; d++) {
    const isFirst = d === 1;
    const isLast = d === duration;
    const p1 = samplePlaces[(d - 1) % samplePlaces.length];
    const p2 = samplePlaces[d % samplePlaces.length];

    const dayActivities = [
      {
        start_time: '09:00',
        end_time: '11:30',
        title: `Morning Discovery at ${p1.name}`,
        place_name: p1.name,
        category: p1.category || 'culture_heritage',
        city: p1.city || city,
        country: p1.country || country,
        description: `Explore the vibrant grounds and architecture of ${p1.name} during the peaceful morning hours.`,
        estimated_cost: Math.round(budget * 0.04),
        travel_minutes_from_previous: 0,
        maps_query: `${p1.name}, ${p1.city || city}, ${country}`,
        tips: 'Start early to enjoy the best natural light and avoid crowds.',
        booking_recommended: false,
        source_place_id: p1.id,
        is_ai_suggested: places.length === 0,
      },
      {
        start_time: '12:00',
        end_time: '14:00',
        title: `Local Flavors & Culinary Lunch in ${p1.city || city}`,
        place_name: `Traditional Culinary Quarter, ${p1.city || city}`,
        category: 'food_cafe',
        city: p1.city || city,
        country: p1.country || country,
        description: `Taste celebrated local dishes and seasonal specialties in the heart of ${p1.city || city}.`,
        estimated_cost: Math.round(budget * 0.03),
        travel_minutes_from_previous: 15,
        maps_query: `Culinary Market, ${p1.city || city}, ${country}`,
        tips: 'Ask for the chef special of the day.',
        booking_recommended: false,
        source_place_id: null,
        is_ai_suggested: true,
      },
      {
        start_time: '15:30',
        end_time: '18:00',
        title: `Afternoon Vista at ${p2.name}`,
        place_name: p2.name,
        category: p2.category || 'viewpoint_photo_spot',
        city: p2.city || city,
        country: p2.country || country,
        description: `Soak in breathtaking scenery and surrounding sights around ${p2.name}.`,
        estimated_cost: Math.round(budget * 0.04),
        travel_minutes_from_previous: 20,
        maps_query: `${p2.name}, ${p2.city || city}, ${country}`,
        tips: 'Bring a camera for scenic golden hour vistas.',
        booking_recommended: false,
        source_place_id: p2.id,
        is_ai_suggested: places.length === 0,
      },
      {
        start_time: '19:30',
        end_time: '21:30',
        title: `Evening Atmospheric Dining in ${destInfo.canonical_name}`,
        place_name: `Heritage Dining Pavilion, ${p2.city || city}`,
        category: 'food_cafe',
        city: p2.city || city,
        country: p2.country || country,
        description: `Unwind with dinner highlighting authentic local ingredients and regional flavors.`,
        estimated_cost: Math.round(budget * 0.05),
        travel_minutes_from_previous: 20,
        maps_query: `Atmospheric Dining, ${p2.city || city}, ${country}`,
        tips: 'Outdoor seating offers wonderful evening ambiance.',
        booking_recommended: true,
        source_place_id: null,
        is_ai_suggested: true,
      },
    ];

    const dayCost = dayActivities.reduce((acc, act) => acc + act.estimated_cost, 0);
    totalCost += dayCost;

    days.push({
      day_number: d,
      title: isFirst
        ? `Welcome to ${destInfo.canonical_name}: Iconic Sights & Flavor`
        : isLast
        ? `Farewell to ${destInfo.canonical_name}: Scenic Horizons`
        : `Highlights & Cultural Treasures of ${destInfo.canonical_name} - Day ${d}`,
      theme: isFirst ? 'Iconic Landmarks & Vistas' : 'Cultural Immersion & Hidden Spots',
      daily_estimated_cost: dayCost,
      notes: `Comfortable walking shoes recommended for exploring ${destInfo.canonical_name}.`,
      activities: dayActivities,
    });
  }

  const accommodation = Math.round(budget * 0.35);
  const food = Math.round(budget * 0.25);
  const activities = totalCost;
  const local_transport = Math.round(budget * 0.12);
  const other = Math.round(budget * 0.05);
  const grandTotal = accommodation + food + activities + local_transport + other;

  return {
    title: `${duration}-Day Curated Journey in ${destInfo.canonical_name}`,
    destination: destInfo.canonical_name,
    destination_country: destInfo.country,
    summary: `A carefully paced ${duration}-day immersive travel plan tailored directly for ${destInfo.canonical_name}, balancing cultural landmarks, panoramic viewpoints, and authentic local dining within your budget.`,
    currency,
    total_estimated_cost: grandTotal,
    budget_status: grandTotal <= budget ? 'within_budget' : grandTotal <= budget * 1.05 ? 'near_limit' : 'over_budget',
    budget_breakdown: {
      accommodation,
      food,
      activities,
      local_transport,
      other,
    },
    warnings: [],
    general_tips: [
      `Check local opening hours and booking rules for popular attractions across ${destInfo.canonical_name}.`,
      `Keep small denominations of local currency (${destInfo.currency_code}) for neighborhood markets.`,
      `Use public transit or registered taxis for smooth inter-district travel.`,
    ],
    days,
  };
}
