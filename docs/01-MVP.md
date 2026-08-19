# MVP Specification — Student Housing Marketplace (Njiro, Arusha)

## 1. Product Statement

> A trusted digital marketplace that connects students searching for accommodation with local housing agents (dalalis) who know where available rooms and houses are.

The platform **digitizes and improves the existing dalali business** — it does not try to remove agents from the market.

Core loop:

```
Agent pays 20,000 TZS/month
        ↓
Agent lists available properties
        ↓
Students discover properties
        ↓
Student selects an agent
        ↓
Qualified lead created → Agent charged 5,000 TZS
        ↓
Student + Agent chat in-platform
        ↓
Viewing → Rental
        ↓
Agent earns normal market commission (off-platform)
        ↓
Platform earns subscription + lead revenue
```

## 2. MVP Goal

Prove the core marketplace loop in **Njiro, Arusha** with a small, real supply and demand base before adding complexity or expanding geography.

**Definition of success (do not ship past this bar for v1):**

1. Dalalis are willing to pay 20,000 TZS/month.
2. Students actively search for rooms.
3. Students create genuine leads.
4. Dalalis receive useful leads.
5. Both sides use in-app chat.
6. Viewings are actually arranged.
7. Some leads convert to rentals.
8. Listings stay reasonably accurate.
9. The platform generates recurring revenue.

The proof metric is **paid agents + genuine leads + successful rentals** — not registered-user counts.

## 3. MVP Feature Scope

### 3.1 Public (no login)
- Home
- Search results
- Listing detail page
- University / area landing pages
- Agent public profile

### 3.2 Student
- Register / log in
- Search & filter
- Listing detail view
- Save listing
- Create lead ("Chat with Agent" / "Request Viewing")
- In-app chat
- Request viewing
- Manage profile & preferences

### 3.3 Agent
- Register
- Submit verification application
- Subscribe (20,000 TZS/month)
- Dashboard (overview)
- Create / edit / pause listing
- Manage leads (lifecycle board)
- In-app chat
- Manage viewing requests
- Basic analytics (views, leads, conversion)

### 3.4 Admin
- Dashboard (platform health)
- User management (search, suspend, restore)
- Agent verification queue
- Listing moderation (approve/reject/pause/flag)
- Property management & duplicate merge
- Duplicate review queue
- Reports/complaints queue
- Billing overview (subscriptions, lead charges, failed payments)

### 3.5 AI (MVP-level only)
- Natural-language housing search (Swahili/English) → structured filters → **real DB query only, never invented listings**
- Listing information extraction from free text → agent must confirm before publish
- Basic duplicate detection → flags `POSSIBLE_DUPLICATE`, admin makes the final call

All AI features are **assistive**. AI never controls financial, ownership, permission, or verification decisions (see Business Rules doc).

## 4. Explicitly Out of Scope for v1

Do **not** build in the first version:

- Full rent payment processing
- Complex owner portal
- Voice AI
- Advanced fraud AI
- Predictive pricing
- Full accounting system
- Furniture marketplace
- Moving services
- Laundry marketplace
- Multi-country expansion

Rationale: prove the two-sided marketplace loop first; every one of these adds surface area without validating the core hypothesis.

## 5. Launch Plan

| Stage | Focus |
|---|---|
| **1 — Njiro pilot** | Recruit 5–10 dalalis, 50–100 listings, initial students. Charge lightly/not at all if it blocks supply acquisition. |
| **2 — Monetize** | Turn on 20,000 TZS subscription + 5,000 TZS qualified lead fee. Measure conversion. |
| **3 — Harden** | Improve verification, AI matching, chat, viewing management, agent analytics. |
| **4 — Geographic expansion** | Other student-heavy areas in Arusha. |
| **5 — National expansion** | Other Tanzanian university towns. |

## 6. Key Metrics to Instrument From Day One

| Category | Metrics |
|---|---|
| Supply | active agents, active listings, new listings/week, verified listings, expired listings |
| Demand | registered students, search sessions, listing views, saved listings, leads created |
| Marketplace health | leads/agent, lead→chat rate, lead→viewing rate, viewing→rental rate, avg time-to-rental |
| Revenue | active paid agents, subscription revenue, lead revenue, revenue/agent, MRR |
| Trust | reports, fraud flags, duplicate listings, failed availability confirmations, agent ratings |

## 7. Implementation Phasing (build order)

1. **Foundation** — Next.js, PostgreSQL, Prisma, auth, roles, base schema, base UI system (design tokens from the design system doc).
2. **Supply core** — Universities, Properties, Listings, Images, Search/filter, Agent profiles.
3. **Demand core** — Student accounts, Lead creation, Agent lead dashboard, Internal chat.
4. **Trust & ops** — Viewing requests, Notifications, Verification, Reports, Admin dashboard.
5. **Monetization** — Agent subscription, Lead billing, Payment integration, Financial records.
6. **AI layer** — Housing search, listing extraction, duplicate detection.
7. **Launch hardening** — Analytics, performance, production hardening, Njiro pilot go-live.

Do not start phase *N+1* core work before phase *N*'s critical path (schema + primary flow) is functioning end-to-end. This keeps the marketplace loop demoable at every stage.
