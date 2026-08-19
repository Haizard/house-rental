# Nyumba Nearby

Student housing marketplace for Njiro, Arusha. Students can discover homes and choose a local housing agent; agents manage listings and receive qualified leads.

## Architecture

This is one Next.js application and one Vercel deployment. The frontend lives in `src/app`, backend endpoints use Next.js route handlers in `src/app/api`, and business/data access lives in `src/server` and `src/lib`. There is no separate backend deployment.

- Vercel hosts the Next.js web app and API routes.
- Supabase provides PostgreSQL and later file storage/auth integrations.
- Prisma and the running Vercel application use `supabase_session_pooler` through the Prisma adapter. The direct connection is retained for developer networks that permit it.

## Setup

1. Copy `.env.example` values into `.env` or Vercel Project Settings.
2. Generate the database client: `npx prisma generate`.
3. When ready to create the initial Supabase tables, run `npx prisma migrate dev --name init` locally. This is intentionally not run automatically because it changes the remote database.
4. Populate development catalog data with `npm run db:seed` after the tables exist.
5. Run locally with `npm run dev`.

## Vercel deployment

Import this repository into Vercel as a Next.js project. Add the following server-side environment variables to the Production and Preview environments:

- `supabase_project_url`
- `supabase_session_pooler`
- `supabase_direct_connection_string`
- `supabase_publish_key`
- `supabase_service_role_secret`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

The `supabase_service_role_secret` must never be prefixed with `NEXT_PUBLIC_` or used in browser code.

## Current implementation

- Responsive public home, search, listing discovery, and listing-detail surfaces
- Glass design tokens and reusable listing card
- Demo listing API at `/api/listings`
- Repeatable Prisma seed command for a demo agent, university, properties, and listings
- Prisma schema for users, agents, students, universities, properties, listings, leads, chats, viewings, subscriptions, charges, notifications, and reports
- Supabase-compatible Prisma client configuration

The public listing UI is temporarily demo-backed. Once the migration is applied and initial listings are seeded, the same API route will move to Prisma data without changing the client contract.
