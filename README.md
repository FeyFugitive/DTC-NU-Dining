# Campus Dining (Northwestern)

Campus Dining is a mobile-first web app for quickly deciding where to eat at Northwestern.  
It focuses on a clean hall-first flow: scan hall cards, tap into a dining hall page, and browse live menu sections with minimal friction.

## What Makes This App Different

- Hall-first UX with stacked cards, status chips, and quick drill-down into each dining hall
- Compact, dense menu rows designed for faster scanning on phone screens
- Live menu and operating-hour data served through a local Go API + scraper pipeline
- Optional Google sign-in for favorites and personalized data
- Lightweight shell/navigation tuned for day-to-day use rather than a heavy dashboard layout

## Current Product Scope

- Home feed with:
  - dining hall cards (open/closed, wait, crowd placeholder, payment tags)
  - search + quick filters
  - per-hall navigation
- Dining hall detail page:
  - hall metadata
  - per-period menu sections (including non-standard periods when present)
  - favorite toggling (when signed in)
- Supporting views:
  - all menu items
  - operation hours
  - preferences

## Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui + MUI (existing accordion components)
- Firebase Auth (Google sign-in)

### Backend
- Go API
- PostgreSQL
- Headless Chromium (`chromedp`) scraper against Dine On Campus endpoints
- Firebase Admin SDK for token verification

## Local Development

This repo runs as two local processes:
- frontend dev server on `http://localhost:5173`
- backend API on `http://localhost:8081`

### 1) Prerequisites

- Node.js + npm
- Go (1.22+ recommended)
- PostgreSQL (local or remote)
- Firebase project (for optional auth)

### 2) Backend setup

Create `backend/.env`:

```env
POSTGRES_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME?sslmode=disable
```

Add Firebase Admin key file for local auth verification:
- path: `backend/firebase_keys.json`
- source: Firebase Console -> Project Settings -> Service Accounts -> Generate new private key

Start backend:

```bash
cd backend
go run .
```

Expected startup log includes: `Server starting on port 8081`.

### 3) Seed menu + hours data (required on fresh DB)

In a separate terminal:

```bash
curl -i http://localhost:8081/api/scrapeWeeklyItems
curl -i http://localhost:8081/api/scrapeOperatingTimes
```

`scrapeWeeklyItems` loads **today and the next 3 calendar days** (no past days), for a shorter scrape than a full week.

Sanity check:

```bash
curl -s http://localhost:8081/api/generalData | head -c 300
```

It should return JSON (starts with `{`), not an error string.

### 4) Frontend setup

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8081

VITE_FIREBASE_APIKEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGE_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Notes:
- Firebase vars are required for Google sign-in.
- **`VITE_FIREBASE_STORAGE_BUCKET`** is required for **dish photos** on the food detail page (Firebase Storage).
- If Firebase env is omitted, the app still runs but auth and photo uploads are disabled.

### Dish photos (Firebase)

Photos are stored in **Cloud Storage**; metadata (download URLs) is stored in **Firestore** under collection `menuItemPhotos` (one document per dish slot, `photos` array field).

1. In Firebase Console: enable **Storage**, use the default bucket (or note the bucket name for `VITE_FIREBASE_STORAGE_BUCKET`).
2. **Firestore rules** (dev-friendly; tighten for production):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menuItemPhotos/{docId} {
      allow read: if true;
      allow create, update: if request.auth != null;
    }
  }
}
```

3. **Storage rules** (example):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /menuItemPhotos/{docId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Signed-in users can upload from the food page; everyone can read photos and the Firestore doc.

Start frontend:

```bash
cd frontend
npm install
npm run dev
```

## Common Restart Flow

When coming back to work:

1. Terminal A
   ```bash
   cd backend
   go run .
   ```
2. Terminal B
   ```bash
   cd frontend
   npm run dev
   ```
3. If DB is empty, rerun the two scrape endpoints.

## Deployment Notes

- Frontend: Vercel
- Backend: Railway
- Database: Railway Postgres

### Railway (backend)

This repo is a monorepo: the API Dockerfile is at `backend/Dockerfile`. Either:

1. Use the root `railway.toml` (points Railway at that Dockerfile), **or**
2. In the Railway service → **Settings → Root Directory** → set `backend`

Required service variables:

- `POSTGRES_URL` — Railway Postgres connection string
- `RAILWAY=true` — use env-based Firebase config (see `backend/internal/auth/auth.go`)
- `FIREBASE_*` — service account fields for Railway (same values as `firebase_keys.json`)
- `ADMIN_TOKEN` — for admin scrape routes (optional locally)

After first deploy, seed data:

```bash
curl -i https://YOUR-RAILWAY-DOMAIN/api/scrapeWeeklyItems
curl -i https://YOUR-RAILWAY-DOMAIN/api/scrapeOperatingTimes
```

The server listens on Railway’s `PORT` (falls back to `8081` locally).

For Railway/backend containers, ensure Chromium runtime support is present for scraper jobs and `CHROME_BIN` is configured when needed.

## Troubleshooting

- `Error fetching all items: no daily items found`
  - weekly data not scraped yet; call `/api/scrapeWeeklyItems`
- `Error fetching location operations: no locationOperatingTimes found`
  - operating times not scraped yet; call `/api/scrapeOperatingTimes`
- Google sign-in popup fails
  - verify Google provider is enabled
  - verify `localhost` is in Firebase Authorized Domains
  - verify all `VITE_FIREBASE_*` vars exist and frontend was restarted
- Photo upload fails or photos never load
  - enable Storage + Firestore and apply the rules in **Dish photos (Firebase)** above
  - confirm `VITE_FIREBASE_STORAGE_BUCKET` matches your bucket
- `go: command not found`
  - install Go and reopen terminal

## Contributing

Issues and PRs are welcome.  
If you change data contracts between backend and frontend, include both sides in the same PR and document any new env vars in this README.
