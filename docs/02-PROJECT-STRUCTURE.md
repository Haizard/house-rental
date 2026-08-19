# Project Structure & Technical Architecture

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server Components by default; Client Components only where interactivity requires them |
| Database | PostgreSQL | Single source of truth |
| ORM | Prisma | Preferred for MVP |
| Styling | Tailwind CSS + shadcn/ui + Lucide icons | Extended with the custom iOS-glass design tokens (see `05-UI-DESIGN-SYSTEM.md`) |
| Auth | Auth.js (NextAuth) | Session-based; OAuth later |
| Validation | Zod | Every API input and every AI output is validated |
| Forms | React Hook Form + Zod | Shared resolvers between client & server |
| File storage | S3-compatible (R2 / Supabase Storage) | DB stores metadata + URL only, never binaries |
| Real-time chat | Socket.IO / Supabase Realtime / Pusher / Ably | Pick one based on hosting; abstracted behind a `ChatTransport` interface |
| Payments | Provider-agnostic abstraction | Tanzania mobile money first; cards later |
| AI | Provider-agnostic `AIService` | OpenAI-compatible / OpenRouter-compatible; server-side only, keys never reach the browser |

## 2. Repository Layout

A single Next.js application is sufficient for the MVP. A monorepo (Turborepo) is optional and only worth it once `packages/ui` or `packages/types` need to be shared with a second app (e.g. a future mobile client).

### 2.1 MVP-recommended: single app

```text
student-housing-platform/
├── src/
│   ├── app/
│   │   ├── (public)/                 # marketing + discovery, no auth required
│   │   │   ├── page.tsx              # Home
│   │   │   ├── search/
│   │   │   ├── listings/[id]/
│   │   │   ├── universities/[slug]/
│   │   │   └── agents/[id]/
│   │   │
│   │   ├── (student)/
│   │   │   ├── dashboard/
│   │   │   ├── saved/
│   │   │   ├── leads/
│   │   │   ├── chats/[conversationId]/
│   │   │   ├── viewings/
│   │   │   └── profile/
│   │   │
│   │   ├── (agent)/
│   │   │   ├── dashboard/
│   │   │   ├── listings/
│   │   │   ├── leads/
│   │   │   ├── chats/[conversationId]/
│   │   │   ├── viewings/
│   │   │   ├── billing/
│   │   │   ├── analytics/
│   │   │   └── profile/
│   │   │
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── agents/
│   │   │   ├── properties/
│   │   │   ├── listings/
│   │   │   ├── verification/
│   │   │   ├── duplicates/
│   │   │   ├── reports/
│   │   │   └── payments/
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── listings/
│   │   │   ├── leads/
│   │   │   ├── chat/
│   │   │   ├── viewings/
│   │   │   ├── billing/
│   │   │   ├── ai/
│   │   │   └── webhooks/
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css               # design tokens (CSS vars) live here
│   │
│   ├── components/
│   │   ├── ui/                       # base design-system primitives (glass card, ios button, sheet, tab bar…)
│   │   ├── listings/
│   │   ├── chat/
│   │   ├── leads/
│   │   ├── viewings/
│   │   ├── agents/
│   │   ├── admin/
│   │   └── layout/                   # NavBar, TabBar, Sidebar, PageShell
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/                       # Prisma client singleton
│   │   ├── ai/
│   │   │   ├── ai-service.ts
│   │   │   ├── providers/
│   │   │   │   ├── openai.ts
│   │   │   │   └── openrouter.ts
│   │   │   ├── prompts/
│   │   │   │   ├── housing-search.ts
│   │   │   │   ├── listing-extraction.ts
│   │   │   │   ├── duplicate-detection.ts
│   │   │   │   └── lead-summary.ts
│   │   │   └── schemas/              # Zod schemas that validate AI output
│   │   │       ├── housing-search.ts
│   │   │       └── listing-extraction.ts
│   │   ├── payments/
│   │   │   ├── payment-service.ts    # provider-agnostic interface
│   │   │   └── providers/
│   │   ├── notifications/
│   │   ├── validation/               # shared Zod schemas
│   │   └── permissions/              # RBAC helpers, server-side only
│   │
│   ├── server/                       # business logic, framework-agnostic
│   │   ├── listings/
│   │   ├── leads/
│   │   ├── agents/
│   │   ├── students/
│   │   ├── chat/
│   │   ├── viewings/
│   │   └── billing/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   └── types/
│
├── public/
├── docs/
│   ├── 01-MVP.md
│   ├── 02-PROJECT-STRUCTURE.md
│   ├── 03-DATABASE-STRUCTURE.md
│   ├── 04-UI-STRUCTURE.md
│   ├── 05-UI-DESIGN-SYSTEM.md
│   └── 06-COMPONENT-LIBRARY.md
├── .env.example
├── package.json
├── tailwind.config.ts
└── README.md
```

### 2.2 Optional monorepo layout (post-MVP, if a second app is added)

```text
student-housing-platform/
├── apps/
│   └── web/                # everything in src/ above
├── packages/
│   ├── ui/                 # design-system primitives, shared with future apps
│   ├── validation/         # shared Zod schemas
│   ├── types/               # shared TS types
│   └── config/             # eslint/tailwind/tsconfig presets
├── docs/
├── turbo.json
└── package.json
```

## 3. Architectural Rules

1. **Business logic never lives in UI components.** Pages/components call `server/*` functions; `server/*` calls `lib/db`.
2. **AI is behind `AIService`.** No component or route calls a provider SDK directly. Every AI response is parsed through a Zod schema before use.
3. **Payments are behind `PaymentService`.** Adding a new Tanzanian mobile-money provider must not require touching billing logic elsewhere.
4. **Role checks happen server-side only.** Client-side role state is for UI convenience (hiding buttons), never for authorization.
5. **File uploads never touch Postgres as binary.** Only `url` + `storage_key` are persisted.
6. **Route groups mirror roles**: `(public)`, `(student)`, `(agent)`, `(admin)` — each with its own layout, nav shell, and middleware guard.
7. **`components/ui/` is the single design-system source.** Feature folders (`listings/`, `chat/`, …) compose from `ui/`, they don't redefine buttons/cards/inputs.

## 4. High-Level Runtime Architecture

```text
Next.js Application
│
├── Public Website  (Home, Search, Listings, Universities, Agent Profiles)
├── Student Dashboard  (Saved, Leads, Chats, Viewings, Profile)
├── Agent Dashboard  (Overview, Listings, Leads, Chats, Viewings, Billing, Analytics, Profile)
├── Admin Dashboard  (Users, Agents, Properties, Listings, Verification, Duplicates, Reports, Payments, Analytics)
│
├── Application Services (server/ + lib/)
│   Auth · Listings · Leads · Chat · Viewings · Billing · Notifications · Verification · AI
│
└── PostgreSQL (source of truth)
```

## 5. Environment & Config Rules

- `.env.example` documents every required variable — never commit real secrets.
- AI provider keys, payment provider keys, and storage credentials are server-only env vars.
- `lib/ai` and `lib/payments` read config once at module load, not per-request.
