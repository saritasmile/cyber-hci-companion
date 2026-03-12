# Cyber × HCI

A cybersecurity learning companion for UX designers and researchers.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — database and auth
- **Anthropic SDK** — AI content generation (server-side only)

## Project Structure

```
/app          — Next.js App Router pages
/components   — Reusable UI components
/lib          — Supabase client, Anthropic client, utility functions
/types        — TypeScript type definitions
/public       — Static assets
```

## Modules

| # | Module | Description |
|---|--------|-------------|
| 01 | Scenario Intelligence | Real-world cyber incidents through a UX lens |
| 02 | Guided Study | Structured learning paths |
| 03 | Horizon Scan | Emerging threats and trends |
| 04 | Rabbit Hole | Deep-dive exploration |
| 05 | Design Patterns | Security UX patterns and anti-patterns |
| 06 | Knowledge Map | Concept visualization across modules |

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd cyber-hci-companion
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in the values in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Anthropic API key (server-side only) |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel + Supabase)

### 1. Supabase project setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Note your **Project URL** and **anon/public key** from Settings → API.
3. Note your **service role key** from Settings → API (keep this secret).
4. In the SQL editor, run the migration file to create the schema:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
5. Optionally seed the feed items table:
   ```
   supabase/seed_feed_items.sql
   ```

### 2. Supabase auth callback URL

In Supabase dashboard → Authentication → URL Configuration:

- **Site URL:** `https://your-vercel-domain.vercel.app`
- **Redirect URLs:** `https://your-vercel-domain.vercel.app/auth/callback`

### 3. Deploy to Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Vercel will detect Next.js automatically via `vercel.json`.
3. Add the following environment variables in Project Settings → Environment Variables:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |

4. Deploy. Vercel will run `npm run build` automatically.

### 4. Security notes

- `NEXT_PUBLIC_*` variables are bundled into the client — only safe public values go here.
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-side only and must never be prefixed with `NEXT_PUBLIC_`.
- `ANTHROPIC_API_KEY` is only accessed inside `/app/api/*` route handlers, never in client components.
