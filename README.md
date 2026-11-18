# SALVEXA

SALVEXA is an AI-powered health companion for symptom checking, medicine guidance, prescription scanning, medical history, and emergency SOS with hospital + guardian alerts.

> **Disclaimer:** SALVEXA is informational only and not a substitute for professional medical advice. In an emergency, call **108** (ambulance) or **112**.

## Features

- **Symptom checker** — AI-assisted triage with red-flag detection.
- **Medicine recommendations** — allergy, age, and drug-interaction safety checks.
- **Prescription scanner** — OCR + AI extraction of prescription medicines.
- **Medical history** — symptoms, recommendations, prescriptions, and profile metrics in one dashboard.
- **Emergency SOS** — nearby hospitals via OpenStreetMap, preferred hospitals, and alert dispatch to hospital + guardian.
- **Notifications & settings** — priorities, unread counts, user preferences, and i18n.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 / TiDB Cloud (`mysql2`) |
| Auth | JWT, `bcryptjs` |
| AI / OCR | OpenAI API, `tesseract.js`, `pdf-parse` |
| Integrations | OpenStreetMap Overpass API, pluggable SMS (mock by default) |

## Project Structure

```
SALVEXA-main/
├── src/                 # Next.js app (app/, components/, lib/)
├── backend/
│   ├── src/             # routes, controllers, models, services
│   ├── database/        # schema.sql + migrations
│   └── scripts/         # hospital preload utilities
└── public/              # static assets
```

## Quick Start

**Prerequisites:** Node.js 20+, MySQL 8+, npm.

### Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
mysql -u root -p < database/schema.sql
npm run dev
```

API: `http://localhost:5000/api` — health check: `GET /api/health`.

### Frontend

```bash
npm install
npm run dev
```

App: `http://localhost:3000`. If the API is elsewhere, add `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_TERMS_VERSION=v1.0
```

### Key Environment Variables (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MySQL connection |
| `DB_USER` / `DB_PASSWORD` | `root` / empty | MySQL credentials |
| `DB_NAME` | `salvexa` | Database name |
| `DB_SSL` | `false` | Auto-enabled for TiDB Cloud |
| `JWT_SECRET` | — | **Required** strong secret |
| `OPENAI_API_KEY` | — | Required for AI features |
| `SMS_PROVIDER` | `mock` | `mock`, `twilio`, or `fast2sms` |
| `OVERPASS_API_URL` | Overpass endpoint | Hospital lookup |

See `backend/.env.example` for the full list.

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| Root | `npm run dev` | Start Next.js dev server |
| Root | `npm run build` / `npm start` | Build / run production |
| Root | `npm run lint` | Run ESLint |
| `backend/` | `npm run dev` / `npm start` | Start API (nodemon / Node) |
| `backend/` | `node scripts/preload-hospitals.js` | Preload hospital data |
| `backend/` | `node scripts/auto-preload.js` | Fill missing city coverage |

## API Overview

Base URL: `http://localhost:5000/api`

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Profile | `GET/POST/PUT/DELETE /profile`, `POST /profile/avatar` |
| Symptoms | `GET/POST /symptoms`, `GET/PUT/DELETE /symptoms/:id` |
| Recommendations | `GET /recommendations`, `POST /recommendations/generate` |
| Prescriptions | `POST /prescriptions/scan`, `GET /prescriptions` |
| Emergency | `GET /emergency/hospitals`, `GET /emergency/context`, `POST /emergency/dispatch` |
| Other | `/medicines`, `/notifications`, `/settings` |

All routes except `/health` and register/login require a JWT (`Authorization: Bearer <token>`).

## Database

Schema: `backend/database/schema.sql`; incremental changes in `backend/database/migrations/`.

Core tables: `users`, `health_profile`, `symptoms`, `medicines`, `recommendations`, `prescriptions`, `notifications`, `user_settings`, `user_sessions`, `preferred_hospitals`, `emergency_dispatches`, `sms_logs`.

`hospitals` and `hospital_lookup_cache` are created automatically on backend startup.

**Emergency relationships:**

- `preferred_hospitals.user_id` → `users.id` (CASCADE)
- `emergency_dispatches.user_id` → `users.id` (CASCADE)
- `sms_logs.user_id` → `users.id` (SET NULL)
- `sms_logs.dispatch_id` → `emergency_dispatches.id` (CASCADE)
- `hospital_osm_id` is a logical link only — no FK constraint.

## Emergency Flow

1. User taps **Emergency / SOS**; geolocation (or cached location) is loaded.
2. Backend returns the patient snapshot, guardian, preferred hospitals, and nearby hospitals.
3. User selects a hospital; `POST /emergency/dispatch` records the dispatch.
4. SMS is sent to hospital + guardian (mock mode by default) and an in-app notification is created.

## Notes

- SMS delivery is mocked; real Twilio/Fast2SMS delivery is not wired yet.
- Geolocation requires `localhost` or HTTPS.
- Overpass can be slow or rate-limited; mirrors and caching are used.
- No automated test suite or license file is included.

## License

No license file is included. Add one before distributing or publishing.
