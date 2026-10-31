# Linktag — URL shortener frontend

Vite + React + TypeScript UI for the FastAPI URL shortener in `../todo-backend`.

## Run

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8001
npm install
npm run dev
```

Start the backend first (see `../todo-backend/README.md`). If port 5173 is busy Vite picks 5174; both are allowed by the backend's CORS config.

## Features

- Shorten a link, optionally with a custom alias and an expiry (1–90 days)
- The new link is shown as a baggage tag with copy / open actions
- "Your links" list with visit counts (refreshes when you return to the tab), two-step delete, and paging
- Clear messages for taken aliases, invalid URLs, rate limits and an unreachable API
- Light/dark mode, responsive to mobile, respects reduced motion

## Structure

```
src/
  api.ts                    typed client for the backend
  App.tsx                   page layout and state
  components/ShortenForm.tsx
  components/ResultCard.tsx the tag
  components/LinkList.tsx
  components/Toast.tsx
  index.css                 design tokens and all styles
```
