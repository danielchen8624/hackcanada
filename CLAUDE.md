# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NorthReport is a feed-first, AI-powered neighborhood safety platform that transforms community reports into actionable intelligence.
The main UI is the Pulse Feed: a real-time stream of what residents are seeing (Stories, Posts, and Structured Reports) — ranked by momentum (upvotes + recency) and risk (severity + corroboration). Residents can record or snap hazards, or simply post what they see. Gemini summarizes and explains items, detects trends/patterns, and helps turn high-signal feed items into formal city-facing reports. Community leaders can take action directly from feed items: view hotspots, generate digests, and assisted-file 311 reports.
Voices from the Ground + Live City Map (Snap Map-style)
NorthReport includes a community layer called Voices from the Ground where residents upload short-form content about what they’re seeing (video / audio / text). When posting, users choose:
Story → expires in 24 hours (like Instagram/Snap)
Post → persistent, Reddit-style thread (comments + reposts)
The community can upvote/like, comment, and repost — and more upvotes pushes content higher so the most important updates rise.
On top of the feed, NorthReport includes a Live City Map view (Snapchat-style heatmap) showing hotspots of recent Voices activity. Users can tap hotspots to view the stack of stories/posts from that area. Any Voice can optionally be converted into a structured hazard report to feed trends/patterns and assisted 311 filing.
2

## Commands

- `npm run dev` — Start the Next.js dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm run seed` — Seed Firestore with sample data (`npx tsx scripts/seed.ts`)

No test framework is configured.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript (strict mode)
- **Tailwind CSS 4** with PostCSS, dark glassmorphism theme
- **Firebase Admin SDK** — Firestore for all data storage
- **Auth0 v4** (`@auth0/nextjs-auth0`) — Authentication with middleware in `proxy.ts`
- **Google Gemini AI** (`gemini-2.0-flash`) — Classification, summaries, pattern detection, voice command routing
- **Leaflet / React-Leaflet** — Interactive maps with geohash bucketing
- **ElevenLabs API** — Text-to-speech for voice feedback

## Architecture

### Routing & Auth
- Pages live in `app/` using Next.js App Router (file-based routing)
- Auth0 middleware in `proxy.ts` protects `/feed/*`, `/map/*`, `/dashboard/*`, `/report/*`, `/auth/*`
- Two roles: `resident` and `leader` (leaders access `/dashboard/*`)
- Auth helpers in `lib/auth.ts`: `requireAuth()` and `requireLeader()` for API route protection

### API Routes (`app/api/`)
- RESTful routes returning `Response.json()` with standard error handling via `handleApiError`
- In-memory rate limiting (`lib/rateLimiter.ts`, 50 req/min default)
- Key endpoints: `/api/feed`, `/api/voices`, `/api/reports`, `/api/command`, `/api/explain`, `/api/patterns/*`, `/api/auto-file/*`, `/api/health`, `/api/hotspots`, `/api/tts`

### Data Layer (Firestore)
- Collections: `users`, `voices`, `reports`, `neighborhoods`, `patterns`, `filed_311`, `voice_comments`, `voice_votes`, `voice_reposts`
- Firebase Admin initialized in `lib/firebase.ts`
- Location privacy: 6-char geohash bucketing (~0.6km precision) via `lib/geohash.ts`
- Images stored as base64 strings in Firestore (not Cloud Storage)

### AI Integration (`lib/gemini.ts`)
- All AI calls use `gemini-2.0-flash` with structured JSON output and retry logic
- Functions: report classification, voice post classification, voice-to-report conversion, pattern detection (trends/clusters/anomalies), weekly digest generation, voice command routing, item explanation

### Feed Ranking (`lib/feedScore.ts`)
- Formula: `feedScore = momentum * 0.6 + risk * 0.4`
- Momentum = recency decay (12h half-life) + engagement (upvotes, comments, reposts)
- Risk = severity weight + corroboration boost

### Voice System
- Wake phrase "Hey NorthReport" via Web Speech API (`components/VoiceListener.tsx`)
- Command routing through `/api/command` → Gemini classifies intent
- TTS response via ElevenLabs (`lib/elevenlabs.ts`) with browser fallback (`lib/tts.ts`)

### Client Components
- All page-level components use `'use client'` directive
- State management via React hooks only (no global store)
- Leaflet map dynamically imported (no SSR) in `components/CityMap.tsx`
- Animations via Framer Motion

## Environment Variables

Required in `.env.local`:
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `THREE11_URL` (mock 311 portal URL)

## Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).
