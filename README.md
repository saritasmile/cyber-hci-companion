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
