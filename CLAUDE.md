# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Umzugsplaner is a German-language moving assistant PWA (Progressive Web App). The app helps users plan and organize their move. All UI text and comments are in German.

## Commands

All development commands run from `umzugshelfer-pwa/`:

```bash
cd umzugshelfer-pwa
npm install       # install dependencies
npm start         # dev server at http://localhost:3000
npm run build     # production build
npm test          # run tests (interactive)
npm test -- --watchAll=false  # run tests once (CI mode)
```

### Docker (from project root):

```bash
docker compose build
docker compose up -d
# Rebuild without cache:
docker compose build --no-cache umzugsplaner-app && docker compose up -d --force-recreate
```

## Environment Variables

For local dev, create `umzugshelfer-pwa/.env`:

```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_OPENAI_API_KEY=...   # optional, for AI features
```

For Docker, create `.env` in project root (see `env.example`). The OpenAI key is intentionally excluded from Docker build args — it is loaded at runtime from the user's Supabase profile record.

## Architecture

**Stack:** React 18 (Create React App), Tailwind CSS, Supabase (auth + PostgreSQL + storage), OpenAI API.

**Entry point:** `umzugshelfer-pwa/src/index.js` wraps `<App>` in `<BrowserRouter>` and `<React.StrictMode>`.

**Routing & auth (`src/App.js`):**
- Session state is managed via `supabase.auth.onAuthStateChange` and passed as a prop throughout the app.
- `ProtectedRoute` redirects unauthenticated users to `/login`.
- `PublicRoute` redirects authenticated users to `/dashboard`.
- `/features/*` routes are public feature landing pages (no auth required).

**Supabase client (`src/supabaseClient.js`):** Single exported `supabase` instance; throws at startup if env vars are missing.

**Theme (`src/contexts/ThemeContext.js`):** Dark/light toggle persisted to `localStorage`. Default is `dark`. Tailwind dark mode via `class` strategy on `<html>`.

**Component structure (`src/components/`):**
- Each major feature is a self-contained component that receives `session` as a prop and performs its own Supabase queries.
- `featurepages/` — public-facing marketing/info pages for each feature (no data fetching).
- `Bedarfsrechner*.js` — standalone calculators (boxes, volume, transport costs, paint, wallpaper, insulation, flooring), aggregated by `BedarfsrechnerPage.js`.
- `KiPacklisteAssistent.js` / `KiTodoAssistent.js` — AI assistant modals using the OpenAI API directly from the client.

**Database setup:** See `supabase_setup.md` and `Supabase_Tabellen_Setup.md` for the SQL to run in Supabase SQL Editor. RLS (Row Level Security) is used — all tables are user-scoped.

**Styling:** Tailwind CSS with custom dark theme color tokens (e.g., `dark-bg`, `dark-text-main`, `light-bg`). Custom colors are defined in `tailwind.config.js`. Use `dark:` prefix classes for dark mode variants.

**Deployment:** Nginx serves the static React build inside the Docker container. The Dockerfile is at `umzugshelfer-pwa/Dockerfile`. `docker-compose.yml` maps `APP_PORT` (from root `.env`) to container port 80.
