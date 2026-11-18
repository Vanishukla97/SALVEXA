SALVEXA
SALVEXA is an AI-powered health companion that helps users check symptoms, understand medicines, scan prescriptions, track medical history, and send an emergency SOS with their location and medical details to a hospital and guardian.

Medical disclaimer: SALVEXA provides informational guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. In a real emergency, call 108 (ambulance) or 112 (emergency services) immediately.

Features
Symptom checker — describe symptoms and get an AI-assisted triage with red-flag detection.
Medicine recommendations — rule-based + AI recommendations with allergy, age, and drug-interaction safety checks.
Prescription scanner — upload a prescription image; OCR extracts the text and AI structures the medicines.
Medical history — view symptoms, recommendations, prescriptions, and profile metrics in one place.
Emergency SOS — finds nearby hospitals via OpenStreetMap, shows saved preferred hospitals, and dispatches an alert with a patient snapshot to the hospital and emergency contact.
Notifications — in-app notifications with priorities, unread counts, and scheduled delivery.
Accounts & onboarding — JWT auth, remember-me sessions, terms consent, and an emergency onboarding flow (blood group, guardian, preferred hospitals).
Settings & i18n — user preferences and multilingual UI support.
Tech Stack
Layer	Technology
Frontend	Next.js 16 (App Router), React 19, TypeScript 5
Styling	Tailwind CSS 4, custom design tokens
Backend	Node.js, Express 4
Database	MySQL 8 (works with TiDB Cloud), mysql2
Auth	JWT, bcryptjs, HTTP-only cookies + bearer tokens
AI	OpenAI Chat Completions API (gpt-4o-mini by default)
OCR	tesseract.js, pdf-parse
Hospital data	OpenStreetMap Overpass API (with mirror fallback)
SMS	Provider abstraction — mock by default (Twilio/Fast2SMS placeholders)
Validation / security	express-validator, helmet, cors, morgan
Project Structure
SALVEXA-main/
├── src/                        # Next.js frontend
│   ├── app/                    # App Router pages
│   │   ├── login/ signup/ onboarding/
│   │   ├── symptoms/ recommendations/ scanner/
│   │   ├── medical-history/ profile/ settings/
│   │   └── terms/ privacy-policy/
│   ├── components/             # UI, layout, emergency modal
│   └── lib/                    # API client, auth, emergency, i18n
├── backend/                    # Express API
│   ├── src/
│   │   ├── routes/ controllers/ models/
│   │   ├── services/           # AI triage, OCR, recommendations, hospitals, SMS
│   │   ├── middleware/ config/
│   │   └── server.js
│   ├── database/
│   │   ├── schema.sql          # Full schema + medicine seed
│   │   └── migrations/         # Incremental SQL migrations
│   └── scripts/                # Hospital preload utilities
├── public/                     # Static assets (audio alarm, icons)
└── package.json
Getting Started
Prerequisites
Node.js 20+
MySQL 8+ (local or TiDB Cloud)
npm
Optional: an OpenAI API key for AI features
1. Backend setup
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
Edit backend/.env with your database and API credentials, then create the database:

mysql -u root -p < database/schema.sql
Apply any newer migrations from backend/database/migrations/ if you already had an older database.

Start the API:

npm run dev
The API runs at http://localhost:5000/api. Health check: GET http://localhost:5000/api/health.

On startup the backend also runs idempotent migrations and creates runtime tables (hospitals, hospital_lookup_cache) automatically.

2. Frontend setup
From the project root:

npm install
npm run dev
Open http://localhost:3000.

If the API is not on http://localhost:5000/api, create a .env.local in the project root:

NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_TERMS_VERSION=v1.0
3. Environment variables
Frontend (/.env.local)
Variable	Default	Description
NEXT_PUBLIC_API_BASE_URL	http://localhost:5000/api	Backend API base URL
NEXT_PUBLIC_TERMS_VERSION	v1.0	Current terms version shown to users
Backend (backend/.env)
Variable	Default	Description
PORT	5000	API port
NODE_ENV	development	Environment
CLIENT_ORIGIN	http://localhost:3000	Allowed CORS origin
DB_HOST / DB_PORT	127.0.0.1 / 3306	MySQL host and port
DB_USER / DB_PASSWORD	root / empty	MySQL credentials
DB_NAME	salvexa	Database name
DB_SSL	false	Set true for SSL; auto-enabled for TiDB Cloud hosts
JWT_SECRET	—	Required strong secret
JWT_EXPIRES_IN	1d	Normal session lifetime
JWT_REMEMBER_EXPIRES_IN	30d	Remember-me session lifetime
TERMS_VERSION	v1.0	Latest accepted terms version
OVERPASS_API_URL	https://overpass-api.de/api/interpreter	Hospital lookup endpoint
HOSPITAL_RADIUS_KM	10	Default hospital search radius
HOSPITAL_MAX_RESULTS	40	Max hospitals returned
SMS_PROVIDER	mock	mock, twilio, or fast2sms
OPENAI_API_KEY	—	OpenAI key (AI features disabled without it)
OPENAI_MODEL	gpt-4o-mini	Text model
OPENAI_PRESCRIPTION_MODEL	gpt-4o-mini	Prescription analysis model
OPENAI_BASE_URL	https://api.openai.com/v1	OpenAI-compatible base URL
AI_LOW_CONFIDENCE_THRESHOLD	0.65	Triage confidence cutoff
Available Scripts
Frontend (project root)
Command	Description
npm run dev	Start Next.js in development (webpack)
npm run build	Production build
npm start	Start production server
npm run lint	Run ESLint
Backend (backend/)
Command	Description
npm run dev	Start API with nodemon
npm start	Start API with Node
Hospital data preload (optional, from backend/)
Command	Description
node scripts/preload-hospitals.js	Preload hospitals for configured Indian cities
node scripts/auto-preload.js	Background watcher that fills missing city coverage
These scripts warm the local hospitals table so nearby-hospital lookups are fast and reliable even if Overpass is slow.

API Overview
Base URL: http://localhost:5000/api

Area	Endpoints
Health	GET /health
Auth	POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/accept-terms, POST /auth/logout, POST /auth/logout-all
Profile	GET /profile, POST /profile, PUT /profile, DELETE /profile, POST /profile/avatar, DELETE /profile/medical-history
Symptoms	GET /symptoms, GET /symptoms/:id, POST /symptoms, PUT /symptoms/:id, DELETE /symptoms/:id
Recommendations	GET /recommendations, GET /recommendations/:id, POST /recommendations/generate
Prescriptions	POST /prescriptions/scan (multipart field: image), GET /prescriptions, GET /prescriptions/:id
Medicines	GET /medicines
Notifications	GET /notifications, GET /notifications/unread-count, PATCH /notifications/read-all, PATCH /notifications/:id/read, PATCH /notifications/:id/hide, POST /notifications/emergency-trigger
Settings	GET /settings, PUT /settings
Emergency	GET /emergency/hospitals, GET /emergency/context, POST /emergency/dispatch
All routes except /health and the auth register/login endpoints require a JWT (Authorization: Bearer <token>).

Database
The full schema lives in backend/database/schema.sql. Core tables:

users, health_profile, symptoms, medicines, recommendations, prescriptions, notifications, user_settings, user_sessions, preferred_hospitals, emergency_dispatches, sms_logs, profile_allergies, profile_current_medicines, symptom_items, prescription_medicines, recommendation_safety_checks.

Two tables are created at runtime by backend/src/config/db.js: hospitals and hospital_lookup_cache.

Emergency relationships
has
saves
triggers
owns
generates
osm_id (soft)
osm_id (soft)
USERS
HEALTH_PROFILE
PREFERRED_HOSPITAL
EMERGENCY_DISPATCH
SMS_LOG
HOSPITAL
preferred_hospitals.user_id → users.id (CASCADE)
emergency_dispatches.user_id → users.id (CASCADE)
sms_logs.user_id → users.id (SET NULL)
sms_logs.dispatch_id → emergency_dispatches.id (CASCADE)
hospital_osm_id is a logical link to hospitals.osm_id; there is no foreign-key constraint.
Emergency Flow
User taps Emergency / SOS in the navbar.
The browser requests geolocation; a cached location is used instantly when available.
The frontend loads the emergency context (profile snapshot, guardian, preferred hospitals) and nearby hospitals from the backend.
User picks a hospital and confirms; POST /emergency/dispatch creates an emergency_dispatches row.
SMS is sent to the hospital and guardian (currently mock mode — messages are logged on the server, not delivered).
An in-app notification is created and an alarm tone plays until the modal is closed.
SMS providers are pluggable in backend/src/services/smsService.js. Real Twilio/Fast2SMS delivery is not wired yet, so SMS_PROVIDER=mock is expected in development.

Notes & Limitations
SMS delivery is mocked; no real messages are sent yet.
AI features require a valid OPENAI_API_KEY. Without it, rule-based fallbacks may be used.
Geolocation requires localhost or HTTPS in the browser.
Overpass API can be slow or rate-limited; the backend retries mirrors and caches results.
There is currently no automated test suite.
License
No license file is included in this repository. Add one before distributing or publishing the project.
