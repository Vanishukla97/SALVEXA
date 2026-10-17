# Salvexa Backend

Node.js + Express + MySQL backend for the AI-Based Medicine Recommendation System.

## Setup

1. Copy env file:
```bash
cp .env.example .env
```
2. Install packages:
```bash
npm install
```
3. Create DB schema:
- Run `database/schema.sql` in MySQL.
4. Start server:
```bash
npm run dev
```

Base URL: `http://localhost:5000/api`

## Folder Structure

- `src/routes` REST API routes
- `src/controllers` request handlers
- `src/models` DB access layer
- `src/middleware` auth/error/upload middleware
- `src/services` recommendation, safety checks, OCR
- `database/schema.sql` MySQL tables and medicine seed

## API Overview

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/accept-terms`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /profile`
- `POST /profile`
- `PUT /profile`
- `DELETE /profile`
- `POST /symptoms`
- `GET /symptoms`
- `GET /symptoms/:id`
- `PUT /symptoms/:id`
- `DELETE /symptoms/:id`
- `POST /recommendations/generate`
- `GET /recommendations`
- `GET /recommendations/:id`
- `POST /prescriptions/scan` (multipart key: `image`)
- `GET /prescriptions`
- `GET /prescriptions/:id`
- `GET /medicines`

## Notes

- JWT auth supports remember login (`rememberMe` in login body).
- Terms consent tracking:
  - `TERMS_VERSION` env controls latest legal version.
  - `users.terms_accepted_at` + `users.terms_version` are stored at signup.
  - If version changes, login response returns `requiresTermsConsent: true`.
- Passwords are hashed using `bcryptjs`.
- OCR uses `tesseract.js`.
- Recommendation engine is rule-based and includes:
  - allergy checks
  - basic drug interaction warnings
  - age restrictions
