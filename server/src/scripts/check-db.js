import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log(`Checking Supabase connection: ${supabaseUrl}`);
  
  const tables = [
    'profiles',
    'trips',
    'trip_images',
    'extracted_places',
    'itineraries',
    'itinerary_days',
    'itinerary_activities',
    'ai_request_logs',
  ];

  let missing = [];
  let ready = [];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(0);
    if (error) {
      if (error.code === 'PGRST205') {
        missing.push(table);
      } else {
        console.warn(`Table "${table}" returned error:`, error.message);
      }
    } else {
      ready.push(table);
    }
  }

  if (missing.length === 0) {
    console.log('✅ ALL TABLES ARE CREATED AND CACHED! Database is 100% ready.');
    console.log('Found tables:', ready.join(', '));
  } else {
    console.log(`⚠️ Missing tables (${missing.length}/${tables.length}):`, missing.join(', '));
    console.log(`Ready tables: ${ready.length ? ready.join(', ') : 'none'}`);
    console.log('\nTo create all tables instantly:');
    console.log('1. Open your Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/fvrfwabwthysrtuilkca/sql/new`);
    console.log('2. Copy and paste the contents of: supabase/schema_combined.sql');
    console.log('3. Click "RUN".');
  }
}

checkDatabase().catch(console.error);
