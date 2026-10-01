# WanderShot — Smart Travel Itinerary Planner from Screenshots & Notes

> **WanderShot** transforms your saved Instagram & Pinterest screenshots, travel blog images, and voice memos into realistic, day-by-day travel itineraries in under 2 minutes using Google's multimodal **Gemini 2.5 Flash** models, **Supabase PostgreSQL & RLS**, and **React**.

---

## 🌟 Key Features

1. **Multimodal Visual Analysis (Gemini 2.5 Flash)**
   - Upload 1–10 screenshots per trip (JPEG, PNG, WebP up to 5 MB each).
   - Sharp-powered image processing: auto-rotates, resizes to ≤ 1280px on longest side, re-encodes, and strips private EXIF/GPS metadata.
   - Extracts place landmarks, coordinates, city, region, country, and up to 6 lowercase visual style tags (e.g., `#heritage`, `#aesthetic-cafe`, `#viewpoint_photo_spot`).
   - If an image cannot be confidently identified, it sets `is_identified: false` with lowered confidence and never invents a false name.

2. **Trip Constraint & Audio Parsing**
   - Natural language notes (up to 2000 chars) and in-browser voice memos (up to 60s recorded with `MediaRecorder` or audio file upload).
   - Gemini transcribes speech and extracts budget amount, currency, scope (total, per-person, per-day), travel pace, interests, and dietary/accessibility notes.
   - User-provided form fields always override parsed notes on conflict.

3. **Editable Review Stage**
   - Interactive review cards before generation: rename places, change cities, change categories, or toggle places in/out of the plan.
   - Add custom must-visit stops manually.
   - Aggregated visual style tag cloud & ambiguity notes.

4. **Day-by-Day Itinerary Generation & Budget Tracking**
   - Complete schedule with chronological slots, travel transit minutes, and Google Maps search links per stop.
   - Source traceability: Screenshot-sourced activities display direct badges linking back to your original screenshot ("From your screenshot #N").
   - Strict budget status tracking: `within_budget` (≤ 90%), `near_limit` (90–100%), and `over_budget` (> 100%) with actionable warnings and cheaper alternatives.

5. **Editing & Versioning Suite**
   - **Regenerate Single Day (Prompt D):** Refresh any individual day with custom instruction prompt.
   - **Swap Activity (Prompt E):** Replace any activity with a curated alternative in the same time slot and area.
   - **Manual Edit & Reorder:** Change times, costs, descriptions; move activities up/down with instant recalculation of daily and total costs.
   - **Itinerary Versioning:** Each full generation creates an incremental version (`v1`, `v2`, `v3`).

6. **Sharing & Clean PDF Export**
   - **Secret Share Links:** Generates cryptographically secure 32-character tokens (`crypto.randomBytes`) for read-only access.
   - **Export to PDF:** Dedicated CSS print styles formatted for paper & clean PDF export.
   - **Copy as Text:** One-click copy formatted text itinerary for messaging apps.
   - **Honest AI Disclaimer:** Transparent notification on review, itinerary, and shared pages stating that all prices, hours, and availability are AI estimates.

7. **Production Security & Data Isolation**
   - Per-user Row Level Security (RLS) policies on all tables.
   - Private Supabase Storage bucket (`trip-uploads`) restricting reads and writes to `auth.uid()`.
   - Server-side only Gemini API key and Supabase Service Role key (never exposed to client).
   - Input validation with strict Zod schemas on both frontend and backend.
   - Rate limiting: General (100 req / 15 min), AI endpoints (10 req / 10 min), public share (60 req / 15 min), and daily AI quota checks.

---

## 🏗️ Architecture & Folder Structure

```
wandershot/
├── package.json               # Root monorepo workspace scripts
├── README.md                  # Comprehensive documentation
├── .gitignore                 # Secrets and build ignore rules
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql       # Database schema, enums, triggers, and bucket
│   │   └── 002_rls.sql        # Row Level Security (RLS) policies
│   └── tests/
│       └── rls_check.sql      # RLS verification script (User A vs User B isolation)
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── test-flow.js           # Automated end-to-end integration test suite
│   └── src/
│       ├── index.js           # Server entrypoint with graceful shutdown
│       ├── app.js             # Express app (Helmet CSP, CORS, pino-http, rateLimit)
│       ├── config/env.js      # Zod-validated environment config
│       ├── lib/               # Supabase clients, logger, custom AppError classes
│       ├── middleware/        # Auth (JWT), validate (Zod), upload (Sharp), rateLimit
│       ├── schemas/           # Zod validation schemas (trip, image, constraints, itinerary)
│       ├── prompts/           # System instruction and Prompts A, B, C, D, E
│       ├── services/          # Gemini SDK, sharp processing, budgetService, shareService
│       ├── routes/            # health, me, trips, analysis, itinerary, share
│       └── controllers/       # Controller logic for all endpoints
└── client/
    ├── package.json
    ├── .env.example
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── routes.jsx         # App router (Protected & public routes)
        ├── lib/               # apiClient, supabase, format, maps
        ├── schemas/           # Client Zod schemas for forms
        ├── hooks/             # useAuth, useTrips, useTrip, useItinerary, useVoiceRecorder, useToast
        ├── context/           # AuthContext (Supabase Auth + local demo fallback)
        ├── components/
        │   ├── layout/        # AppShell, Navbar, Footer, ProtectedRoute, PageHeader
        │   ├── shared/        # Spinner, Skeleton, EmptyState, Modal, ConfirmDialog, AIDisclaimerBanner
        │   ├── auth/          # LoginForm, SignupForm, AuthLayout
        │   ├── dashboard/     # TripCard, TripGrid, NewTripButton, TripActionsMenu
        │   ├── trip/          # ImageDropzone, ImagePreviewGrid, VoiceRecorder, TripConstraintInputs, Stepper
        │   ├── review/        # ExtractedPlaceCard, ParsedConstraintsPanel, AddPlaceForm, StyleTagCloud
        │   └── itinerary/     # ItineraryHeader, BudgetSummaryBar, BudgetBreakdownChart, DayTabs, DayTimeline, ActivityCard, SwapActivityDialog, RegenerateDayDialog, VersionSelector, WarningsPanel, GeneralTipsPanel, ShareDialog, ExportMenu
        ├── pages/             # Landing, Login, Signup, Dashboard, NewTrip, Review, Itinerary, PrintItinerary, SharedTrip, Settings, NotFound
        └── styles/index.css   # Tailwind directives, print styles, and custom scrollbars
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or newer (`v24.x` recommended)
- **npm**: v10 or newer

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Configure Environment Variables

#### Backend (`server/.env`):
Copy `server/.env.example` to `server/.env`:
```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Supabase Credentials (from your Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=trip-uploads

# Google Gemini API (from Google AI Studio: https://aistudio.google.com/)
# Note: Check ai.google.dev/gemini-api/docs/models for current model IDs
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL_PRIMARY=gemini-3.8-flash
GEMINI_MODEL_ESCALATION=gemini-3.1-pro-preview
GEMINI_MODEL_FALLBACK=gemini-3.1-flash-lite
GEMINI_GROUNDING=false
GEMINI_MOCK=false

# Limits & Quotas
MAX_IMAGES_PER_TRIP=10
MAX_IMAGE_MB=5
MAX_AUDIO_MB=8
DAILY_AI_CALL_LIMIT=30
SIGNED_URL_TTL_SECONDS=3600
```

> **Note on GEMINI_MOCK:**
> If you do not have a Gemini API key yet, you can set `GEMINI_MOCK=true` in `server/.env`. This enables deterministic, schema-valid fixtures so you can test the complete multimodal flow without API quota.

#### Frontend (`client/.env`):
Copy `client/.env.example` to `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🗄️ Supabase Setup & Migrations

1. Create a new project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase Dashboard:
   - Run `supabase/migrations/001_init.sql` to create all enums, tables, triggers, and bucket initialization.
   - Run `supabase/migrations/002_rls.sql` to activate Row Level Security (RLS) on all tables and storage policies.
3. Open **Storage** in the Supabase Dashboard:
   - Verify that the private bucket named `trip-uploads` is created.
4. Run `supabase/tests/rls_check.sql` in the SQL Editor to verify that User A cannot read or mutate User B's trips under RLS.

---

## 💻 Running Locally

To run both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing

WanderShot includes a comprehensive end-to-end integration test suite (`server/test-flow.js`) that validates all 13 core flows:
1. Health endpoint status verification
2. Auth header check & Profile retrieval
3. Trip creation with multipart image upload & magic-byte validation
4. Gemini multimodal analysis & Prompt B parsing
5. Extracted places retrieval
6. User place editing (`PATCH /api/trips/:id/places/:placeId`)
7. Manual stop addition (`POST /api/trips/:id/places`)
8. Itinerary generation & budget recalculation
9. Single day regeneration (Prompt D)
10. Activity swap with alternative (Prompt E)
11. Share link generation, public fetch (sanitized), and revocation
12. Security rejection of non-whitelisted files (e.g. executables)
13. Prompt injection containment test

Run the test suite:
```bash
node server/test-flow.js
```

---

## 🔒 Security Design

- **Zero Client Key Exposure:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` reside strictly on the server.
- **Magic-Byte Sniffing & Image Sanitization:** Uploaded images are inspected with `file-type` to detect magic bytes, auto-rotated, stripped of EXIF/GPS coordinates with `sharp`, and converted to clean JPEGs.
- **Prompt Injection Defense:** User text and screenshot captions are treated as untrusted data, delimited in `<user_note>` and `<user_instruction>` blocks. AI outputs are strictly validated against typed Zod schemas.
- **Data Deletion:** The `/settings` page provides a full data wipe endpoint (`DELETE /api/me/data`) that deletes all user rows and storage objects.

---

## 📜 Known Limitations & Considerations
- **Gemini Model Name:** Ensure your environment variable `GEMINI_MODEL` points to the latest stable multimodal model (defaults to `gemini-2.5-flash`).
- **Audio Codecs:** In-browser audio recording utilizes the browser's `MediaRecorder` API (supporting WebM/Opus on Chrome/Firefox and MP4/AAC on Safari).
- **Public Share Links:** Public share endpoints return sanitized read-only payloads and generate short-lived signed URLs (1 hour TTL) for screenshot thumbnails.
