# Features TODO — Incomplete & Proposed

This document tracks everything that is built, partially built, missing from the original spec, and newly proposed.

**Last updated:** August 2026

---

## ✅ What's Built (complete)

### Public Surface
- Home page with hero, search, featured listings, area chips, agent CTA
- Search page with client-side filtering (area, type, price)
- Listing detail page with gallery, agent link, lead intake, viewing request, report
- Agent profile page with bio, rating, listings grid
- AI natural-language search (Swahili/English → filters → DB query)

### Student Surface
- Registration + sign-in (credentials)
- Dashboard with stats, recent leads, saved homes preview
- Saved listings page
- Leads list page with status pills
- Chat list page + chat thread with composer
- Viewing requests page
- Profile editing (university, budget, preferences)
- Notification bell + full notifications page
- AI search bar on home page

### Agent Surface
- Shared layout with sidebar (desktop) / tab bar (mobile)
- Dashboard with stats, verification, lead inbox, viewing requests
- Listings list page (2-col grid, status pills)
- Create listing (multi-step form + AI extraction)
- Edit listing (form + publish/pause/delete)
- Image upload with drag-and-drop (Supabase Storage)
- Billing page (subscription status, charge history)
- Verification submission
- Profile editing (business name, bio)
- Notification bell + notifications

### Admin Surface
- Shared layout with sidebar (desktop) / tab bar (mobile)
- Dashboard with platform health metrics
- Users management (search, suspend/restore)
- Agents management (verification status, suspend)
- Listings moderation (search, activate/pause)
- Properties management (view all)
- Verification queue (approve/reject)
- Reports queue (resolve/dismiss)

### AI Layer
- AI service abstraction + OpenAI/OpenRouter provider
- Housing search prompt + API route
- Listing extraction prompt + API route
- Zod schemas for output validation
- AI listing extract component in create flow

### Infrastructure
- Prisma schema (18+ models)
- Auth (NextAuth v5, JWT, role guards)
- Prisma client singleton (Supabase pooler)
- Design tokens (CSS variables, glass utilities)
- StatusPill component
- Storage service abstraction (Supabase Storage + local fallback)

---

## 🔴 Missing from Original Spec (not yet built)

### Agent Surface Gaps
| Feature | Priority | Notes |
|---|---|---|
| Agent chat list page | HIGH | No `/agent/chats/` routes exist |
| Agent chat thread page | HIGH | No agent-side chat view |
| Agent leads board (Kanban) | HIGH | Only shown as list on dashboard; docs call for Kanban-style lifecycle board |
| Agent analytics page | MEDIUM | Views, leads, conversion rates per docs §4 |
| Agent registration flow | MEDIUM | Agents register as students; no dedicated agent signup with verification |

### Student Surface Gaps
| Feature | Priority | Notes |
|---|---|---|
| AI smart matching / scoring | LOW | Calculate property suitability score per AI Feature 2 |

### Admin Surface Gaps
| Feature | Priority | Notes |
|---|---|---|
| Admin duplicate review queue | MEDIUM | Side-by-side compare, merge action per docs §4 |
| Admin payments page | MEDIUM | Subscriptions, lead charges, refunds, revenue reports |
| Listing moderation (reject/flag) | LOW | Only activate/pause built; reject/flag not wired |

### Monetization (Phase 5)
| Feature | Priority | Notes |
|---|---|---|
| Payment provider integration | HIGH | `PaymentService` is a stub; no real money movement |
| Agent subscription purchase flow | HIGH | No UI to subscribe/pay |
| Lead charge processing | HIGH | Charges created as PENDING but never processed |
| Subscription renewal/expiry | HIGH | No expiration handling or renewal flow |
| `payments` table | HIGH | Added to schema but no API/UI |
| `reviews` table | MEDIUM | Added to schema but no API/UI |
| `subscription_plans` table | LOW | Simplified to inline `planName` |

### AI Layer Gaps
| Feature | Priority | Notes |
|---|---|---|
| Duplicate detection | MEDIUM | AI flags `POSSIBLE_DUPLICATE`; admin decides per docs §3.5 |
| Fraud/risk detection | LOW | Flag suspicious patterns per AI Feature 5 |
| Lead summaries | LOW | AI summarize conversations for agents per AI Feature 6 |
| Demand analytics | LOW | After enough data per AI Feature 7 |

### Trust & Ops Gaps
| Feature | Priority | Notes |
|---|---|---|
| Availability confirmation | MEDIUM | Agents don't periodically confirm listings are still available |
| Email notifications | MEDIUM | Only in-app; no email delivery |
| SMS/WhatsApp notifications | LOW | Future integration per docs |

### Design System & Polish
| Feature | Priority | Notes |
|---|---|---|
| `components/ui/` base primitives | HIGH | No GlassCard, GlassButton, GlassInput React components |
| Shared Sidebar component | HIGH | Duplicated across student/agent/admin layouts |
| Shared TabBar component | HIGH | Duplicated across student/agent/admin layouts |
| Shared GroupedRow component | MEDIUM | Duplicated across all form pages |
| Bottom sheet / action sheet | MEDIUM | Design system §6 spec but not built |
| Modal component | MEDIUM | Design system §6 spec but not built |
| Toast/banner system | MEDIUM | Design system §6 spec but not built |
| Skeleton loading states | LOW | Glass shimmer treatment per design system |
| Error boundaries (error.tsx) | LOW | No Next.js error pages |
| Custom 404 pages (not-found.tsx) | LOW | No custom not-found for each surface |
| `prefers-reduced-motion` | LOW | CSS exists but components don't adapt |
| Pull-to-refresh | LOW | iOS pattern from design system |
| Swipe actions | LOW | Chat/lead list rows |

### Schema Gaps
| Missing | Notes |
|---|---|
| `listing_videos` table | In docs but not in schema |
| Composite index `(status, area)` | Missing on listings for search |
| Geo indexes (PostGIS) | Missing for distance queries |
| `ai_interactions` table | Added to schema but written via raw SQL in API |

### Security & Hardening
| Feature | Priority | Notes |
|---|---|---|
| Rate limiting | HIGH | No rate limiting on API routes |
| CSRF protection | MEDIUM | |
| Shared validation schemas | LOW | Each route defines its own Zod schemas |

---

## 🟢 New Feature Ideas (proposed)

### 🟢 Agent Status Feature (WhatsApp-style)

A temporary, time-sensitive status update system for dalalis to post urgent vacancies.

**Core concept:**
- Agents post short status updates (text + optional photos) about available rooms
- Statuses expire after 24 hours
- Students see a "Status" section with agent bubbles (like WhatsApp Status)
- Viewing a Status is FREE — no lead charge
- Only meaningful actions (Chat, Request Viewing) create a qualified lead

**Status types:**
- `AVAILABLE` — Room available now
- `NEW_ROOM` — New property discovered
- `PRICE_DROP` — Price reduced
- `URGENT` — Student leaving today, room available immediately
- `GENERAL` — General housing update

**Status fields:**
- Content (free text, Swahili/English)
- Title (optional)
- Area
- Property type
- Rent amount
- Image URL
- Linked listing (optional)
- Expires at (24 hours from post)

**Housing-specific actions on Status:**
- 💬 Chat with Agent (creates lead)
- 🏠 View Property (links to listing)
- 📅 Request Viewing
- ❤️ Save
- 🚫 Report

**AI opportunity:**
- AI extracts structured data from Status text
- Agent can convert Status → Listing with one tap
- Status becomes a fast input method for dalalis

**Freshness advantage:**
- "Posted 32 minutes ago" gives students confidence
- Solves the stale listing problem
- Real-time vacancy discovery

**Database tables:**
- `agent_statuses` — Status posts with expiry
- `status_views` — Who viewed which Status (for analytics, not billing)

**UI locations:**
- Student: Status bubbles at top of home/search pages
- Agent: Status posting in dashboard + status management
- Admin: Status moderation

---

### 🟢 Free Agent / Pro Agent Tier System

Two-tier agent model that replaces the flat 20,000 TZS/month subscription.

**🆓 Free Agent — TZS 0/month:**
- 5 active listings
- 10 leads/month
- Post limited Status updates (3/day)
- Basic profile
- Basic chat
- Basic dashboard
- Ads displayed in agent dashboard areas
- 5,000 TZS per lead fee

**💼 Pro Agent — TZS 20,000/month:**
- 50+ active listings
- Unlimited leads
- Unlimited Status posts
- No ads
- Advanced analytics
- Better ranking/visibility
- More Status visibility
- Priority support
- Potentially discounted lead fee (3,000-5,000 TZS)

**Usage limits for Free agents:**
- Track monthly usage (listings, leads, statuses)
- Show upgrade prompt when limits approached
- "You received 37 leads this month. Upgrade to Pro for 20,000 TZS and unlock everything."

**Ad placement rules (policy-compliant):**
- Public listing pages
- Search results
- Public university/area pages
- Free agent dashboard areas
- NEVER in private chat messages
- NEVER incentivized clicks/views

**Revenue tracking per free agent:**
- Ad impressions
- Estimated ad revenue
- Leads generated
- Potential subscription value
- Admin dashboard shows: Agent | Ad Revenue | Leads | Potential (Upgrade/Keep Free)

**Upgrade conversion strategy:**
- Make free version genuinely useful
- Show value of platform through usage
- Upgrade prompt based on success: "You're getting business — pay 20,000 TZS to unlock more"
- Never punish free users; make upgrade feel like a natural next step

**Database additions:**
- `agent_tier` field on `AgentProfile` (FREE / PRO)
- `agent_usage` tracking (monthly listing count, lead count, status count)
- `subscription_plans` table (FREE, STANDARD/PRO with limits)
- `ad_impressions` table (for revenue tracking)

---

### 🟢 Additional Proposed Features

**University/area landing pages:**
- `/universities/[slug]` with info + nearby listings
- Area pages with aggregated stats

**Agent leads Kanban board:**
- Columns: NEW → CONTACTED → VIEWING → NEGOTIATING → RENTED
- Drag-and-drop status updates
- Lead detail sidebar

**Reviews system:**
- Students rate agents after completed viewings/rentals
- Rating displayed on agent profile
- Admin moderation for fake reviews

**Listing video support:**
- `listing_videos` table
- Upload and display videos on listing detail

**Real-time chat:**
- WebSocket or Supabase Realtime for live messaging
- Unread message indicators
- Online status

**Mobile-responsive improvements:**
- Bottom tab bar for student/agent/admin on mobile
- Large title navigation (collapses on scroll)
- Pull-to-refresh on listing feeds
- Swipe actions on chat/lead list rows

---

## 📊 Completion Summary

| Category | Built | Remaining | % |
|---|---|---|---|
| Public Surface | 90% | University pages | 90% |
| Student Surface | 95% | Smart matching | 95% |
| Agent Surface | 70% | Chat, Kanban, Analytics, Registration | 70% |
| Admin Surface | 85% | Duplicate review, Payments | 85% |
| AI Layer | 60% | Duplicate detection, Fraud, Summaries | 60% |
| Monetization | 10% | Payments, Subscriptions, Lead charges | 10% |
| Design System | 50% | UI primitives, Shared components, Sheets | 50% |
| Trust & Ops | 70% | Availability confirm, Email, Rate limiting | 70% |
| Status Feature | 0% | New feature — not yet started | 0% |
| Free/Pro Tiers | 10% | Schema added, no API/UI | 10% |

**Overall: ~65% complete**
