import { logger } from '../lib/logger.js';

// Common country dataset for fast, deterministic, offline resolution
const COUNTRIES_MAP = new Map([
  ['japan', { canonical_name: 'Japan', country: 'Japan', currency_code: 'JPY', type: 'country' }],
  ['france', { canonical_name: 'France', country: 'France', currency_code: 'EUR', type: 'country' }],
  ['indonesia', { canonical_name: 'Indonesia', country: 'Indonesia', currency_code: 'IDR', type: 'country' }],
  ['italy', { canonical_name: 'Italy', country: 'Italy', currency_code: 'EUR', type: 'country' }],
  ['thailand', { canonical_name: 'Thailand', country: 'Thailand', currency_code: 'THB', type: 'country' }],
  ['switzerland', { canonical_name: 'Switzerland', country: 'Switzerland', currency_code: 'CHF', type: 'country' }],
  ['united arab emirates', { canonical_name: 'United Arab Emirates', country: 'United Arab Emirates', currency_code: 'AED', type: 'country' }],
  ['uae', { canonical_name: 'United Arab Emirates', country: 'United Arab Emirates', currency_code: 'AED', type: 'country' }],
  ['india', { canonical_name: 'India', country: 'India', currency_code: 'INR', type: 'country' }],
  ['spain', { canonical_name: 'Spain', country: 'Spain', currency_code: 'EUR', type: 'country' }],
  ['germany', { canonical_name: 'Germany', country: 'Germany', currency_code: 'EUR', type: 'country' }],
  ['united states', { canonical_name: 'United States', country: 'United States', currency_code: 'USD', type: 'country' }],
  ['usa', { canonical_name: 'United States', country: 'United States', currency_code: 'USD', type: 'country' }],
  ['united kingdom', { canonical_name: 'United Kingdom', country: 'United Kingdom', currency_code: 'GBP', type: 'country' }],
  ['uk', { canonical_name: 'United Kingdom', country: 'United Kingdom', currency_code: 'GBP', type: 'country' }],
  ['vietnam', { canonical_name: 'Vietnam', country: 'Vietnam', currency_code: 'VND', type: 'country' }],
  ['singapore', { canonical_name: 'Singapore', country: 'Singapore', currency_code: 'SGD', type: 'country' }],
  ['malaysia', { canonical_name: 'Malaysia', country: 'Malaysia', currency_code: 'MYR', type: 'country' }],
  ['australia', { canonical_name: 'Australia', country: 'Australia', currency_code: 'AUD', type: 'country' }],
  ['new zealand', { canonical_name: 'New Zealand', country: 'New Zealand', currency_code: 'NZD', type: 'country' }],
  ['greece', { canonical_name: 'Greece', country: 'Greece', currency_code: 'EUR', type: 'country' }],
  ['turkey', { canonical_name: 'Turkey', country: 'Turkey', currency_code: 'TRY', type: 'country' }],
  ['portugal', { canonical_name: 'Portugal', country: 'Portugal', currency_code: 'EUR', type: 'country' }],
  ['mexico', { canonical_name: 'Mexico', country: 'Mexico', currency_code: 'MXN', type: 'country' }],
  ['canada', { canonical_name: 'Canada', country: 'Canada', currency_code: 'CAD', type: 'country' }],
  ['south korea', { canonical_name: 'South Korea', country: 'South Korea', currency_code: 'KRW', type: 'country' }],
  ['korea', { canonical_name: 'South Korea', country: 'South Korea', currency_code: 'KRW', type: 'country' }],
  ['egypt', { canonical_name: 'Egypt', country: 'Egypt', currency_code: 'EGP', type: 'country' }],
  ['south africa', { canonical_name: 'South Africa', country: 'South Africa', currency_code: 'ZAR', type: 'country' }],
  ['brazil', { canonical_name: 'Brazil', country: 'Brazil', currency_code: 'BRL', type: 'country' }],
]);

// Common cities/regions
const PLACES_MAP = new Map([
  ['paris', { canonical_name: 'Paris', country: 'France', currency_code: 'EUR', type: 'city' }],
  ['tokyo', { canonical_name: 'Tokyo', country: 'Japan', currency_code: 'JPY', type: 'city' }],
  ['kyoto', { canonical_name: 'Kyoto', country: 'Japan', currency_code: 'JPY', type: 'city' }],
  ['osaka', { canonical_name: 'Osaka', country: 'Japan', currency_code: 'JPY', type: 'city' }],
  ['bali', { canonical_name: 'Bali', country: 'Indonesia', currency_code: 'IDR', type: 'region' }],
  ['ubud', { canonical_name: 'Ubud', country: 'Indonesia', currency_code: 'IDR', type: 'city' }],
  ['dubai', { canonical_name: 'Dubai', country: 'United Arab Emirates', currency_code: 'AED', type: 'city' }],
  ['rome', { canonical_name: 'Rome', country: 'Italy', currency_code: 'EUR', type: 'city' }],
  ['amalfi coast', { canonical_name: 'Amalfi Coast', country: 'Italy', currency_code: 'EUR', type: 'region' }],
  ['amalfi', { canonical_name: 'Amalfi', country: 'Italy', currency_code: 'EUR', type: 'city' }],
  ['london', { canonical_name: 'London', country: 'United Kingdom', currency_code: 'GBP', type: 'city' }],
  ['new york', { canonical_name: 'New York', country: 'United States', currency_code: 'USD', type: 'city' }],
  ['bangkok', { canonical_name: 'Bangkok', country: 'Thailand', currency_code: 'THB', type: 'city' }],
  ['phuket', { canonical_name: 'Phuket', country: 'Thailand', currency_code: 'THB', type: 'region' }],
  ['jaipur', { canonical_name: 'Jaipur', country: 'India', currency_code: 'INR', type: 'city' }],
  ['delhi', { canonical_name: 'Delhi', country: 'India', currency_code: 'INR', type: 'city' }],
  ['mumbai', { canonical_name: 'Mumbai', country: 'India', currency_code: 'INR', type: 'city' }],
  ['goa', { canonical_name: 'Goa', country: 'India', currency_code: 'INR', type: 'region' }],
  ['manali', { canonical_name: 'Manali', country: 'India', currency_code: 'INR', type: 'city' }],
  ['amsterdam', { canonical_name: 'Amsterdam', country: 'Netherlands', currency_code: 'EUR', type: 'city' }],
  ['barcelona', { canonical_name: 'Barcelona', country: 'Spain', currency_code: 'EUR', type: 'city' }],
  ['lisbon', { canonical_name: 'Lisbon', country: 'Portugal', currency_code: 'EUR', type: 'city' }],
  ['cape town', { canonical_name: 'Cape Town', country: 'South Africa', currency_code: 'ZAR', type: 'city' }],
  ['zurich', { canonical_name: 'Zurich', country: 'Switzerland', currency_code: 'CHF', type: 'city' }],
  ['geneva', { canonical_name: 'Geneva', country: 'Switzerland', currency_code: 'CHF', type: 'city' }],
]);

/**
 * Classifies a raw destination string into { type, canonical_name, country, currency_code }
 */
export function classifyDestination(rawDestination) {
  if (!rawDestination || typeof rawDestination !== 'string') {
    return {
      type: 'city',
      canonical_name: 'Custom Destination',
      country: 'Unknown',
      currency_code: 'USD',
    };
  }

  const cleaned = rawDestination.trim();
  const lower = cleaned.toLowerCase();

  // 1. Direct match in places map
  if (PLACES_MAP.has(lower)) {
    return { ...PLACES_MAP.get(lower) };
  }

  // 2. Direct match in country map
  if (COUNTRIES_MAP.has(lower)) {
    return { ...COUNTRIES_MAP.get(lower) };
  }

  // 3. Check comma separation: e.g. "Paris, France" or "Tokyo, Japan"
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map((p) => p.trim());
    const firstPart = parts[0].toLowerCase();
    const lastPart = parts[parts.length - 1].toLowerCase();

    const matchedCountry = COUNTRIES_MAP.get(lastPart);
    if (matchedCountry) {
      return {
        type: 'city',
        canonical_name: parts[0],
        country: matchedCountry.canonical_name,
        currency_code: matchedCountry.currency_code,
      };
    }

    if (PLACES_MAP.has(firstPart)) {
      const place = PLACES_MAP.get(firstPart);
      return { ...place, canonical_name: parts[0] };
    }
  }

  // 4. Substring search in countries
  for (const [key, val] of COUNTRIES_MAP.entries()) {
    if (lower === key || lower.includes(` ${key}`) || lower.startsWith(`${key} `)) {
      return { ...val };
    }
  }

  // 5. Substring search in places
  for (const [key, val] of PLACES_MAP.entries()) {
    if (lower.includes(key)) {
      return { ...val, canonical_name: cleaned };
    }
  }

  // Default: treat single word as likely city or country
  return {
    type: 'city',
    canonical_name: cleaned,
    country: cleaned,
    currency_code: 'USD',
  };
}

/**
 * Validates whether generated itinerary activities strictly match the expected destination.
 */
export function validateItineraryDestination(itinerary, destinationInfo) {
  if (!itinerary || !Array.isArray(itinerary.days)) {
    return { isValid: false, violatingActivities: ['Malformed itinerary structure'] };
  }

  const expectedCountry = destinationInfo.country.toLowerCase();
  const expectedCityOrRegion = destinationInfo.canonical_name.toLowerCase();
  const isCountryType = destinationInfo.type === 'country';

  const violatingActivities = [];

  for (const day of itinerary.days) {
    for (const act of day.activities || []) {
      const actCountry = (act.country || '').trim().toLowerCase();
      const actCity = (act.city || '').trim().toLowerCase();
      const actMaps = (act.maps_query || '').trim().toLowerCase();
      const actPlace = (act.place_name || '').trim().toLowerCase();

      // Check for hard anti-pattern: If destination is NOT India/Jaipur, but activity contains Jaipur / Rajasthan / India
      if (expectedCountry !== 'india' && expectedCityOrRegion !== 'jaipur') {
        const isJaipurLeak =
          actCity.includes('jaipur') ||
          actCountry.includes('india') ||
          actMaps.includes('jaipur') ||
          actMaps.includes('india') ||
          actPlace.includes('hawa mahal') ||
          actPlace.includes('nahargarh') ||
          actPlace.includes('johari') ||
          actPlace.includes('tattoo cafe');

        if (isJaipurLeak) {
          violatingActivities.push({
            day: day.day_number,
            title: act.title,
            place_name: act.place_name,
            city: act.city || 'Jaipur',
            country: act.country || 'India',
            reason: `Place is in Jaipur/India, but destination is ${destinationInfo.canonical_name} (${destinationInfo.country})`,
          });
          continue;
        }
      }

      // If country is specified, check country match
      if (actCountry && expectedCountry && expectedCountry !== 'unknown') {
        const matchesCountry =
          actCountry.includes(expectedCountry) ||
          expectedCountry.includes(actCountry);

        if (!matchesCountry) {
          violatingActivities.push({
            day: day.day_number,
            title: act.title,
            place_name: act.place_name,
            city: act.city,
            country: act.country,
            reason: `Activity country '${act.country}' does not match expected destination country '${destinationInfo.country}'`,
          });
          continue;
        }
      }

      // If destination is a city, check that the city or maps_query mentions the city or vicinity
      if (!isCountryType && expectedCityOrRegion && expectedCityOrRegion.length > 2) {
        if (actCity && !actCity.includes(expectedCityOrRegion) && !expectedCityOrRegion.includes(actCity)) {
          // If city strictly contradicts, also check if country at least matches
          if (actCountry && actCountry !== expectedCountry) {
            violatingActivities.push({
              day: day.day_number,
              title: act.title,
              place_name: act.place_name,
              city: act.city,
              country: act.country,
              reason: `Activity city '${act.city}' is outside destination '${destinationInfo.canonical_name}'`,
            });
          }
        }
      }
    }
  }

  return {
    isValid: violatingActivities.length === 0,
    violatingActivities,
  };
}
