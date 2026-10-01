import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { createClient } from '@supabase/supabase-js';

import { supabaseAdmin } from './src/lib/supabase.js';

const BASE_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';

async function setupAuth() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testtraveler99@gmail.com',
      password: 'Password123!',
    });
    if (!error && data?.session?.access_token) {
      AUTH_TOKEN = data.session.access_token;
      return;
    }
  } catch (err) {}

  // Fallback using service role generateLink + verifyOtp
  const linkRes = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'testtraveler99@gmail.com',
  });
  const verifyRes = await supabase.auth.verifyOtp({
    token_hash: linkRes.data.properties.hashed_token,
    type: 'magiclink',
  });
  if (verifyRes.data?.session?.access_token) {
    AUTH_TOKEN = verifyRes.data.session.access_token;
    return;
  }
  throw new Error('Could not authenticate test user.');
}

function buildMultipartBody(fields, files = []) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }

  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
      )
    );
    chunks.push(file.buffer);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);

  return {
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };
}

async function testTrip(name, { destination, note_text, budget_amount = 90000, duration_days = 5, files = [] }) {
  console.log(`\n======================================================`);
  console.log(`REPRODUCING TRIP: ${name} (Destination: ${destination})`);
  console.log(`======================================================`);

  const payload = buildMultipartBody({
    note_text,
    destination,
    duration_days: String(duration_days),
    budget_amount: String(budget_amount),
    budget_currency: 'INR',
    travelers: '1',
    pace: 'balanced',
  }, files);

  // (a) Record exact payload sent
  console.log('(a) Client POST /api/trips body fields:', {
    destination,
    note_text,
    duration_days,
    budget_amount,
    budget_currency: 'INR',
  });

  const createRes = await fetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: payload.headers,
    body: payload.body,
  });

  const createJson = await createRes.json();
  if (!createJson.success) {
    console.error('Failed to create trip:', createJson);
    return;
  }
  const tripId = createJson.data.tripId;
  console.log(`Created trip ID: ${tripId}`);

  // (b) Inspect trip row
  const getRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  const getJson = await getRes.json();
  if (!getJson.success) {
    console.error('Failed to get trip:', getJson);
    return;
  }
  console.log('(b) Stored in trips table before analysis:');
  console.log({
    id: getJson.data.id,
    destination: getJson.data.destination,
    destination_hint: getJson.data.destination_hint,
    destination_source: getJson.data.destination_source,
    note_text: getJson.data.note_text,
    status: getJson.data.status,
  });

  // Step 2: Analyze
  console.log('Running POST /trips/:id/analyze ...');
  const analyzeRes = await fetch(`${BASE_URL}/trips/${tripId}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  const analyzeJson = await analyzeRes.json();
  console.log('Analysis result:', {
    status: analyzeJson.data?.status,
    nextStep: analyzeJson.data?.nextStep,
    destination: analyzeJson.data?.destination,
    destinationSource: analyzeJson.data?.destinationSource,
    placesCount: analyzeJson.data?.placesCount,
  });

  // Step 3: Generate
  console.log('Running POST /trips/:id/itinerary/generate ...');
  const genRes = await fetch(`${BASE_URL}/trips/${tripId}/itinerary/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  const genJson = await genRes.json();

  if (!genJson.success) {
    console.error('Generation failed:', genJson);
    return;
  }

  const itin = genJson.data;
  console.log('(e) Generated Itinerary:');
  console.log({
    title: itin.title,
    destination: itin.destination,
    summary: itin.summary,
    total_cost: itin.total_estimated_cost,
    days_count: itin.days?.length,
  });

  console.log('Sample activities in itinerary:');
  const sampleActivities = (itin.days || []).flatMap((d) =>
    (d.activities || []).map((a) => ({
      day: d.day_number,
      title: a.title,
      place_name: a.place_name,
      maps_query: a.maps_query,
      city: a.city,
      country: a.country,
    }))
  );
  console.table(sampleActivities.slice(0, 8));
}

import sharp from 'sharp';

async function run() {
  await setupAuth();
  // Trip A: Japan
  await testTrip('Trip A: Japan', {
    destination: 'Japan',
    note_text: '5 days exploring local food and culture',
    budget_amount: 90000,
    duration_days: 5,
  });

  // Trip B: Paris
  await testTrip('Trip B: Paris', {
    destination: 'Paris',
    note_text: '4 days of cafés and museums',
    budget_amount: 75000,
    duration_days: 4,
  });

  // Trip C: Bali with beach screenshot
  const beachImageBuffer = await sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: 64, g: 164, b: 223 } },
  }).jpeg().toBuffer();

  await testTrip('Trip C: Bali (with beach screenshot)', {
    destination: 'Bali',
    note_text: '4 days of tropical beach clubs, coastal cliffs, and serene sunsets',
    budget_amount: 60000,
    duration_days: 4,
    files: [
      {
        fieldname: 'images',
        filename: 'bali-beach.jpg',
        contentType: 'image/jpeg',
        buffer: beachImageBuffer,
      },
    ],
  });

  // Trip D: Jaipur (confirming typing Jaipur still works and returns Jaipur places)
  await testTrip('Trip D: Jaipur', {
    destination: 'Jaipur',
    note_text: '3 days of heritage forts, royal palaces, and historic bazaars',
    budget_amount: 35000,
    duration_days: 3,
  });
}

run().catch(console.error);
