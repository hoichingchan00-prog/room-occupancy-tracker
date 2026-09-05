# Math Centre Occupancy Tracker

Live classroom occupancy dashboard for a math centre. Built with Next.js App Router, Tailwind CSS, and Supabase Realtime.

## Setup

1. Install [Node.js](https://nodejs.org/) (18+), then install packages:

```bash
npm install
```

2. Create a project at [supabase.com](https://supabase.com). In **SQL Editor**, paste and run `supabase/schema.sql`. That creates the `rooms` table, an `adjust_occupancy` RPC, realtime publication, and seed classrooms.

3. In **Project Settings → API**, copy the project URL and anon key into `.env.local`:

```bash
cp .env.example .env.local
```

4. In **Database → Replication**, confirm `rooms` is enabled for Realtime (the SQL script adds it).

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Open a second browser or device to the same URL — occupancy +1/−1 updates should appear on both without refresh.

## How sync works

- Each room card calls `adjust_occupancy` so concurrent taps stay consistent.
- The dashboard subscribes to `postgres_changes` on `public.rooms` via `@supabase/supabase-js`.
- Status color from headcount: green 0–5, yellow 6–15, red 16+. The bar still fills toward max capacity; only the color uses these counts.

## Notes

This machine did not have Node.js or Xcode command-line tools available when the project was scaffolded, so `npm install` and `git init` still need to be run locally after those tools are installed.
