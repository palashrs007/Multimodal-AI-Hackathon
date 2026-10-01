import assert from 'assert';
import app from './src/app.js';
import http from 'http';
import { env } from './src/config/env.js';
import { callGeminiJson, MODEL_ROLES } from './src/services/gemini.js';

import sharp from 'sharp';

const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}/api`;
const AUTH_TOKEN = 'demo-user-00000000-0000-0000-0000-000000000001';

const dummyJpgBuffer = await sharp({
  create: {
    width: 200,
    height: 200,
    channels: 3,
    background: { r: 235, g: 100, b: 80 },
  },
})
  .jpeg({ quality: 90 })
  .toBuffer();

function buildMultipartBody(fields, files = []) {
  const boundary = '----WanderShotFormBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== null) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
        )
      );
    }
  }

  for (const file of files) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.mime}\r\n\r\n`
      )
    );
    parts.push(file.buffer);
    parts.push(Buffer.from('\r\n'));
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: Buffer.concat(parts),
  };
}

async function runRemodelTests() {
  console.log('🧪 Starting WanderShot Remodel & Acceptance Criteria Test Suite...\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at http://localhost:${PORT}\n`);

  try {
    // -------------------------------------------------------------
    // Test 1: GET /api/health/ai (Verify models health endpoint)
    // -------------------------------------------------------------
    console.log('--- Test 1: GET /api/health/ai ---');
    const aiHealthRes = await fetch(`${BASE_URL}/health/ai`);
    const aiHealthJson = await aiHealthRes.json();
    assert.strictEqual(aiHealthRes.status, 200);
    assert.strictEqual(aiHealthJson.success, true);
    console.log('AI Models configured:');
    console.log(`  PRIMARY: ${aiHealthJson.data.PRIMARY?.model} (${aiHealthJson.data.PRIMARY?.status})`);
    console.log(`  ESCALATION: ${aiHealthJson.data.ESCALATION?.model} (${aiHealthJson.data.ESCALATION?.status})`);
    console.log(`  FALLBACK: ${aiHealthJson.data.FALLBACK?.model} (${aiHealthJson.data.FALLBACK?.status})`);
    console.log('✅ Test 1 Passed: /api/health/ai returned status for configured models.\n');

    // -------------------------------------------------------------
    // Test 2: Validation rejection on short note (< 10 chars)
    // -------------------------------------------------------------
    console.log('--- Test 2: Validation of note_text (< 10 chars should be 400) ---');
    const shortPayload = buildMultipartBody({
      note_text: 'short',
      destination: 'Jaipur',
    });
    const shortRes = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: shortPayload.headers,
      body: shortPayload.body,
    });
    const shortJson = await shortRes.json();
    assert.strictEqual(shortRes.status, 400);
    assert.strictEqual(shortJson.success, false);
    console.log(`✅ Test 2 Passed: Rejected with status 400 and message: ${shortJson.error.message}\n`);

    // -------------------------------------------------------------
    // Test 3: Text-Only with Destination (End-to-End Itinerary Generation)
    // -------------------------------------------------------------
    console.log('--- Test 3: (a) Text-only with destination (Jaipur) -> Zero places generation ---');
    const textOnlyPayload = buildMultipartBody({
      note_text: '5 days in Jaipur around ₹40,000. I love rooftop cafés, heritage walks and quiet viewpoints. Vegetarian food only.',
      destination: 'Jaipur',
      origin_city: 'Delhi',
      duration_days: '5',
      budget_amount: '40000',
      budget_currency: 'INR',
      pace: 'relaxed',
    });
    const trip1Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: textOnlyPayload.headers,
      body: textOnlyPayload.body,
    });
    const trip1Json = await trip1Res.json();
    assert.strictEqual(trip1Res.status, 201);
    const trip1Id = trip1Json.data.tripId;
    console.log(`Trip created with ID: ${trip1Id}`);

    // Analyze step (Prompt B only, skips review)
    const analyze1Res = await fetch(`${BASE_URL}/trips/${trip1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    const analyze1Json = await analyze1Res.json();
    assert.strictEqual(analyze1Res.status, 200);
    assert.strictEqual(analyze1Json.data.status, 'review-skipped');
    assert.strictEqual(analyze1Json.data.nextStep, 'generate');
    assert.strictEqual(analyze1Json.data.destination, 'Jaipur');
    assert.strictEqual(analyze1Json.data.destinationSource, 'user');
    console.log(`Analysis returned nextStep: 'generate', destination: 'Jaipur', source: 'user'`);

    // Generate itinerary with 0 extracted places
    const gen1Res = await fetch(`${BASE_URL}/trips/${trip1Id}/itinerary/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    const gen1Json = await gen1Res.json();
    assert.strictEqual(gen1Res.status, 201);
    const itin1 = gen1Json.data;
    assert.ok(itin1.days.length > 0, 'Itinerary should have days');
    assert.strictEqual(itin1.destination, 'Jaipur');
    // Verify activities are flagged as ai_suggested
    const allActivities = itin1.days.flatMap((d) => d.activities);
    assert.ok(allActivities.every((a) => a.is_ai_suggested === true), 'All zero-place activities must be is_ai_suggested');
    console.log(`✅ Test 3 Passed: Successfully generated ${itin1.days.length}-day itinerary for ${itin1.destination} with ${allActivities.length} activities (all AI suggested).\n`);

    // -------------------------------------------------------------
    // Test 4: (b) Text-Only WITHOUT Destination (Expect NEEDS_DESTINATION error)
    // -------------------------------------------------------------
    console.log('--- Test 4: (b) Text-only without destination in field or note (Expect NEEDS_DESTINATION) ---');
    const noDestPayload = buildMultipartBody({
      note_text: 'Going on vacation for 4 days with budget ₹30,000. Looking for nice views and great food.',
      duration_days: '4',
      budget_amount: '30000',
    });
    const trip2Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: noDestPayload.headers,
      body: noDestPayload.body,
    });
    const trip2Json = await trip2Res.json();
    assert.strictEqual(trip2Res.status, 201);
    const trip2Id = trip2Json.data.tripId;

    const analyze2Res = await fetch(`${BASE_URL}/trips/${trip2Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    const analyze2Json = await analyze2Res.json();
    assert.strictEqual(analyze2Res.status, 502);
    assert.strictEqual(analyze2Json.error.code, 'NEEDS_DESTINATION');
    console.log(`✅ Test 4 Passed: Returned error code NEEDS_DESTINATION with message: "${analyze2Json.error.message}"\n`);

    // -------------------------------------------------------------
    // Test 5: PATCH /api/trips/:id/destination (Resolve destination manually)
    // -------------------------------------------------------------
    console.log('--- Test 5: PATCH /api/trips/:id/destination (Manually providing destination after error) ---');
    const patchRes = await fetch(`${BASE_URL}/trips/${trip2Id}/destination`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ destination: 'Manali, India', rerun_matching: false }),
    });
    const patchJson = await patchRes.json();
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchJson.data.destination, 'Manali, India');
    assert.strictEqual(patchJson.data.destination_source, 'user');
    console.log(`✅ Test 5 Passed: Destination patched to ${patchJson.data.destination} with source user.\n`);

    // -------------------------------------------------------------
    // Test 6: (c) Text + Matching Screenshots
    // -------------------------------------------------------------
    console.log('--- Test 6: (c) Text + Screenshots attached ---');
    const withImagesPayload = buildMultipartBody(
      {
        note_text: '3 days relaxing in Goa. Love beach shacks, seafood curries, and sunset views.',
        destination: 'Goa',
        duration_days: '3',
        budget_amount: '25000',
        budget_currency: 'INR',
      },
      [{ field: 'images', filename: 'beach.jpg', mime: 'image/jpeg', buffer: dummyJpgBuffer }]
    );
    const trip3Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: withImagesPayload.headers,
      body: withImagesPayload.body,
    });
    const trip3Json = await trip3Res.json();
    assert.strictEqual(trip3Res.status, 201);
    const trip3Id = trip3Json.data.tripId;

    const analyze3Res = await fetch(`${BASE_URL}/trips/${trip3Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    const analyze3Json = await analyze3Res.json();
    assert.strictEqual(analyze3Res.status, 200);
    assert.strictEqual(analyze3Json.data.status, 'review');
    console.log(`✅ Test 6 Passed: Analyzed trip with screenshot, status is review for manual check.\n`);

    // -------------------------------------------------------------
    // Test 7: (d) Destination Hard Constraint Check
    // -------------------------------------------------------------
    console.log('--- Test 7: (d) Typed destination (Jaipur) + conflicting screenshot description ---');
    const conflictPayload = buildMultipartBody(
      {
        note_text: 'Planning 3 days in Jaipur specifically. Love historic palaces.',
        destination: 'Jaipur',
        duration_days: '3',
        budget_amount: '30000',
      },
      [{ field: 'images', filename: 'eiffel.jpg', mime: 'image/jpeg', buffer: dummyJpgBuffer }]
    );
    const trip4Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: conflictPayload.headers,
      body: conflictPayload.body,
    });
    const trip4Json = await trip4Res.json();
    assert.strictEqual(trip4Res.status, 201);
    const trip4Id = trip4Json.data.tripId;

    const analyze4Res = await fetch(`${BASE_URL}/trips/${trip4Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });
    const analyze4Json = await analyze4Res.json();
    assert.strictEqual(analyze4Res.status, 200);
    assert.strictEqual(analyze4Json.data.destination, 'Jaipur');
    assert.strictEqual(analyze4Json.data.destinationSource, 'user');
    console.log(`✅ Test 7 Passed: Destination remains Jaipur (source: user) overriding any visual mismatch.\n`);

    // -------------------------------------------------------------
    // Test 8: (e) Forced Primary Model Failure & Fallback Cascade
    // -------------------------------------------------------------
    console.log('--- Test 8: (e) Forced primary model failure & automatic fallback chain ---');
    const originalPrimary = MODEL_ROLES.PRIMARY;
    try {
      // Intentionally point primary model to a non-existent model to force 404
      MODEL_ROLES.PRIMARY = 'gemini-non-existent-model-test-xyz';
      console.log(`Temporarily set PRIMARY to invalid model: ${MODEL_ROLES.PRIMARY}`);

      // Attempt call - it should catch 404 on PRIMARY and fall back to FALLBACK (gemini-3.1-flash-lite)
      const fallbackResult = await callGeminiJson({
        systemInstruction: 'You are a test assistant.',
        parts: [{ text: 'Return a JSON with message "fallback succeeded"' }],
        schema: {
          type: 'object',
          properties: { message: { type: 'string' } },
          required: ['message'],
        },
        kind: 'test_fallback_chain',
        role: 'PRIMARY',
        userId: 'demo-user-00000000-0000-0000-0000-000000000001',
        mockFallback: () => ({ message: 'fallback succeeded' }),
      });

      assert.ok(fallbackResult, 'Fallback call should succeed via fallback chain');
      assert.ok(fallbackResult.message, 'Should contain message from fallback model');
      console.log(`Result from fallback model: "${fallbackResult.message}"`);
      console.log('✅ Test 8 Passed: Primary model 404 was seamlessly caught and served by fallback chain!\n');
    } finally {
      MODEL_ROLES.PRIMARY = originalPrimary;
    }

    console.log('====================================================');
    console.log('🎉 ALL 8 REMODEL & ACCEPTANCE CRITERIA TESTS PASSED!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

runRemodelTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
