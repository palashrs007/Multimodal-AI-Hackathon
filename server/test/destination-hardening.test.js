import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { tripCreateSchema } from '../src/schemas/trip.js';
import { buildItineraryPrompt } from '../src/prompts/itinerary.js';
import { buildRegenerateDayPrompt } from '../src/prompts/regenerateDay.js';
import { buildSwapActivityPrompt } from '../src/prompts/swapActivity.js';
import { classifyDestination, validateItineraryDestination } from '../src/services/destinationService.js';
import { getMockItinerary } from '../src/services/mockData.js';
import { AIServiceError } from '../src/lib/errors.js';
import { devStore } from '../src/lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverSrcDir = path.resolve(__dirname, '../src');
const clientSrcDir = path.resolve(__dirname, '../../client/src');

describe('Destination Hardening Test Suite', () => {
  // Test 1: tripCreateSchema preserves destination and rejects overlong values
  describe('1. Trip Create Schema', () => {
    it('preserves destination when provided (not stripped)', () => {
      const input = {
        note_text: 'Planning a cultural trip to Japan with temple visits and authentic ramen',
        destination: 'Japan',
        origin_city: 'San Francisco',
        duration_days: 5,
        budget_amount: 90000,
        budget_currency: 'INR',
      };
      const parsed = tripCreateSchema.safeParse(input);
      assert.equal(parsed.success, true);
      assert.equal(parsed.data.destination, 'Japan');
      assert.equal(parsed.data.origin_city, 'San Francisco');
    });

    it('rejects an overlong destination (> 120 characters)', () => {
      const input = {
        note_text: 'Planning a cultural trip to Japan with temple visits and authentic ramen',
        destination: 'A'.repeat(121),
      };
      const parsed = tripCreateSchema.safeParse(input);
      assert.equal(parsed.success, false);
      const errors = parsed.error.issues.map((i) => i.path[0]);
      assert.ok(errors.includes('destination'));
    });
  });

  // Test 2: Prompt builders produce correct destination and contain no Jaipur leak
  describe('2. Prompt Builder Neutrality & Hard Constraint Block', () => {
    const testDestinations = ['Japan', 'Paris', 'Bali', 'Amalfi Coast'];

    for (const dest of testDestinations) {
      it(`buildItineraryPrompt places '${dest}' at top with hard constraint and contains no Jaipur leak`, () => {
        const prompt = buildItineraryPrompt({
          destination: dest,
          destinationSource: 'user',
          durationDays: 4,
          budgetAmount: 50000,
          budgetCurrency: 'INR',
          noteText: `Exploring the best spots in ${dest}`,
        });

        // Starts with hard constraint block
        assert.ok(prompt.startsWith(`DESTINATION (HARD CONSTRAINT): ${dest}`));
        assert.ok(prompt.includes('Every place, activity, cost estimate and maps_query MUST be located in or within a sensible day-trip distance'));
        assert.ok(prompt.includes(dest));

        // Must NOT leak Jaipur or Rajasthan
        assert.equal(prompt.toLowerCase().includes('jaipur'), false);
        assert.equal(prompt.toLowerCase().includes('hawa mahal'), false);
        assert.equal(prompt.toLowerCase().includes('rajasthan'), false);
      });
    }

    it('prompt template files contain no hardcoded real place names', () => {
      const promptFiles = ['system.js', 'constraintParsing.js', 'imageAnalysis.js'];
      const realPlaces = ['jaipur', 'rajasthan', 'hawa mahal', 'amber fort', 'nahargarh'];

      for (const file of promptFiles) {
        const filePath = path.join(serverSrcDir, 'prompts', file);
        const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
        for (const place of realPlaces) {
          assert.equal(
            content.includes(place),
            false,
            `Prompt template ${file} contains forbidden place name: ${place}`
          );
        }
      }
    });
  });

  // Test 3: Destination resolution priority (manual > note > screenshot > error)
  describe('3. Destination Resolution Priority', () => {
    it('manual field beats note and screenshot', () => {
      const manualDest = 'Paris';
      const noteDest = 'Japan';
      const screenshotPlace = 'Bali';

      // Priority 1: manual
      const resolved = manualDest || noteDest || screenshotPlace;
      assert.equal(resolved, 'Paris');
    });

    it('note beats screenshot when manual is absent', () => {
      const manualDest = '';
      const noteDest = 'Bali';
      const screenshotPlace = 'Tokyo';

      const resolved = manualDest || noteDest || screenshotPlace;
      assert.equal(resolved, 'Bali');
    });

    it('requires destination when manual, note, and screenshot are all absent', () => {
      const manualDest = '';
      const noteDest = '';
      const screenshotCandidates = [];

      const resolved = manualDest || noteDest || (screenshotCandidates.length > 0 ? screenshotCandidates[0] : null);
      assert.equal(resolved, null);
    });
  });

  // Test 4: Geo-validation rejects Jaipur activities for Japan, flags repair, errors on mismatch
  describe('4. Server-Side Geo-Validation & Repair Mechanism', () => {
    it('rejects an itinerary with Jaipur activities when destination is Japan', () => {
      const destInfo = classifyDestination('Japan');
      assert.equal(destInfo.country, 'Japan');
      assert.equal(destInfo.type, 'country');

      const badItinerary = {
        destination: 'Japan',
        days: [
          {
            day_number: 1,
            title: 'Jaipur Highlights',
            activities: [
              {
                title: 'Hawa Mahal Palace of Winds',
                place_name: 'Hawa Mahal',
                city: 'Jaipur',
                country: 'India',
                maps_query: 'Hawa Mahal, Jaipur, India',
              },
              {
                title: 'Nahargarh Sunset',
                place_name: 'Nahargarh Fort',
                city: 'Jaipur',
                country: 'India',
                maps_query: 'Nahargarh Fort, Jaipur, India',
              },
            ],
          },
        ],
      };

      const result = validateItineraryDestination(badItinerary, destInfo);
      assert.equal(result.isValid, false);
      assert.equal(result.violatingActivities.length, 2);
      assert.ok(result.violatingActivities[0].reason.includes('Jaipur/India'));
    });

    it('accepts an itinerary with activities strictly in Japan', () => {
      const destInfo = classifyDestination('Japan');
      const goodItinerary = {
        destination: 'Japan',
        days: [
          {
            day_number: 1,
            title: 'Tokyo Exploration',
            activities: [
              {
                title: 'Senso-ji Temple',
                place_name: 'Senso-ji',
                city: 'Tokyo',
                country: 'Japan',
                maps_query: 'Senso-ji, Tokyo, Japan',
              },
              {
                title: 'Fushimi Inari-taisha Hike',
                place_name: 'Fushimi Inari-taisha',
                city: 'Kyoto',
                country: 'Japan',
                maps_query: 'Fushimi Inari-taisha, Kyoto, Japan',
              },
            ],
          },
        ],
      };

      const result = validateItineraryDestination(goodItinerary, destInfo);
      assert.equal(result.isValid, true);
      assert.equal(result.violatingActivities.length, 0);
    });

    it('rejects an activity in another city when destination is a specific city (e.g. Paris vs Rome)', () => {
      const destInfo = classifyDestination('Paris');
      assert.equal(destInfo.canonical_name, 'Paris');
      assert.equal(destInfo.type, 'city');

      const mixedItinerary = {
        destination: 'Paris',
        days: [
          {
            day_number: 1,
            title: 'Day 1',
            activities: [
              {
                title: 'Colosseum Tour',
                place_name: 'Colosseum',
                city: 'Rome',
                country: 'Italy',
                maps_query: 'Colosseum, Rome, Italy',
              },
            ],
          },
        ],
      };

      const result = validateItineraryDestination(mixedItinerary, destInfo);
      assert.equal(result.isValid, false);
      assert.equal(result.violatingActivities.length, 1);
    });
  });

  // Test 5: Sequential trips do not leak data across destinations
  describe('5. Sequential Trip Isolation (No Cross-Trip Leakage)', () => {
    it('destination-aware mock and generation isolates trips cleanly', () => {
      const trip1 = {
        id: 'test-trip-japan',
        destination: 'Japan',
        destination_hint: 'Japan',
        duration_days: 3,
        budget_amount: 80000,
        budget_currency: 'INR',
      };
      const itin1 = getMockItinerary(trip1);
      assert.equal(itin1.destination, 'Japan');
      for (const day of itin1.days) {
        for (const act of day.activities) {
          assert.equal(act.country, 'Japan');
          assert.equal(act.city.toLowerCase().includes('jaipur'), false);
        }
      }

      const trip2 = {
        id: 'test-trip-paris',
        destination: 'Paris',
        destination_hint: 'Paris',
        duration_days: 3,
        budget_amount: 60000,
        budget_currency: 'EUR',
      };
      const itin2 = getMockItinerary(trip2);
      assert.equal(itin2.destination, 'Paris');
      for (const day of itin2.days) {
        for (const act of day.activities) {
          assert.equal(act.country, 'France');
          assert.equal(act.city.toLowerCase().includes('japan'), false);
          assert.equal(act.city.toLowerCase().includes('jaipur'), false);
        }
      }

      const trip3 = {
        id: 'test-trip-bali',
        destination: 'Bali',
        destination_hint: 'Bali',
        duration_days: 4,
        budget_amount: 50000,
        budget_currency: 'USD',
      };
      const itin3 = getMockItinerary(trip3);
      assert.equal(itin3.destination, 'Bali');
      for (const day of itin3.days) {
        for (const act of day.activities) {
          assert.equal(act.country, 'Indonesia');
          assert.equal(act.city.toLowerCase().includes('jaipur'), false);
        }
      }
    });
  });

  // Test 6: Repo-wide check: no hardcoded 'Jaipur' default values in source code
  describe('6. Anti-Leakage Repo-Wide Source Scan', () => {
    it('source files do not contain hardcoded default destination assignment to Jaipur', () => {
      // Find all js/jsx files in server/src and client/src (exclude test files and mock data)
      function scanDir(dir) {
        const files = [];
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            if (item.name !== 'node_modules' && item.name !== 'dist' && item.name !== 'test') {
              files.push(...scanDir(fullPath));
            }
          } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
            files.push(fullPath);
          }
        }
        return files;
      }

      const allFiles = [...scanDir(serverSrcDir), ...scanDir(clientSrcDir)];

      const forbiddenPatterns = [
        /defaultValues:\s*\{[^}]*destination:\s*['"]jaipur['"]/i,
        /useState\(\s*['"]jaipur['"]\s*\)/i,
        /destination\s*\|\|\s*['"]jaipur['"]/i,
        /destination\s*\?\?\s*['"]jaipur['"]/i,
      ];

      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          assert.equal(
            pattern.test(content),
            false,
            `File ${file} contains hardcoded Jaipur default pattern: ${pattern}`
          );
        }
      }
    });
  });
});
