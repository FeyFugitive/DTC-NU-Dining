# NUFood

A modern, fast alternative to Northwestern University's Dine on Campus app. View dining hall menus, operating hours, track your nutrition, and save your favorite foods to get personalized recommendations on where to dine.

Live at: [nufood.me](https://nufood.me)

## Features

-  Fast, responsive interface
-  Real-time dining hall items and operating hours
-  View future and past daily menus within the week
-  Search through all available menu items
-  Save favorite foods and get personalized recommendations
-  Mobile-friendly design
-  Email notifications of where favorite foods are
-  Nutrition tracking to hit your goals

## Local development (frontend)

The Vite app and all npm dependencies live in **`frontend/`**. Do not rely on a root `node_modules` from npm workspaces; that layout often triggers **`TAR_ENTRY_ERROR` / corrupted tarball** warnings on macOS (CloudDocs, antivirus, or interrupted installs).

**Install and build** (paste one line at a time, or use the block below — it has no `#` lines so **zsh** will not try to run `#` as a command):

```bash
cd frontend
rm -rf node_modules
npm cache verify
npm install
npm run build
```

To also delete a stray **root** `node_modules` first, run this from the **repository root** (still no comment lines):

```bash
cd /path/to/DTC-NU-Dining
rm -rf node_modules
cd frontend
rm -rf node_modules
npm cache verify
npm install
npm run build
```

If installs still fail, clear the npm cache and retry:

```bash
npm cache clean --force
cd frontend && rm -rf node_modules && npm install
```

From the **repository root** you can use convenience scripts (they delegate to `frontend/`):

```bash
npm install --prefix frontend
npm run build
```

If pasting instructions from the web, avoid lines that start with `#` in **zsh** unless you have enabled comments: `setopt interactivecomments`.

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Firebase Authentication
- Google Analytics for usage tracking

### Backend
- Go (Golang) for API and scraping
- PostgreSQL database 
- Firebase Admin SDK for auth verification
- Headless Chromium (`chromedp`) for browser-context DineOnCampus API fetching

## Deployment

The application is deployed using:
- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL

### Backend Runtime Note
The backend now relies on a Chrome-based headless runtime for scraping. Use the pinned `backend/Dockerfile` on Railway to guarantee Chromium availability and set `CHROME_BIN` consistently.

## Screenshots

### Weekly Items View
![Weekly Items View showing dining locations items and their current status](./frontend/public/images/main.png)

### All Items View
![Display of all historical items that Northwestern has served.](./frontend/public/images/allItems.png)

### Operation Hours
![Operation Hours View showing dining locations and their status](./frontend/public/images/operationTimes.png)

### Nutrition Tracker
![Nutrition Tracker that allows you to see the macros of the foods being served.](./frontend/public/images/nutrition.png)

### Favorite Items Selection
![Favorite Items View showing your selected favorites.](./frontend/public/images/favorites.png)

## Contributing

This is primarily a personal project for Northwestern University students, but feel free to open issues if you encounter any bugs or have suggestions for improvements.
