# UI Structure — Information Architecture & Navigation

This document defines *what screens exist and how they connect*. Visual language (glassmorphism, iOS pattern, colors) is in `05-UI-DESIGN-SYSTEM.md`. Component-level specs are in `06-COMPONENT-LIBRARY.md`.

## 1. Surfaces

There are four navigational surfaces, each with its own shell:

| Surface | Route group | Access | Nav shell |
|---|---|---|---|
| Public | `(public)` | Anyone | Top nav bar (desktop) / iOS large-title + bottom tab bar (mobile) |
| Student | `(student)` | Authenticated student | Sidebar (desktop) / bottom tab bar (mobile) |
| Agent | `(agent)` | Authenticated + verified agent | Sidebar (desktop) / bottom tab bar (mobile) |
| Admin | `(admin)` | Admin only | Sidebar (desktop) / bottom tab bar (mobile, simplified) |

## 2. Public Surface

```
Home
 ├─ Hero search (natural-language + structured filters)
 ├─ Featured/verified listings (2-per-row grid on mobile, 3–4 on desktop)
 ├─ Popular areas (Njiro, ...) as cards
 └─ How it works (student / agent quick explainer)

Search Results (/search)
 ├─ Filter sheet (area, price, type, university, distance, amenities, availability)
 ├─ Result grid (2-col mobile / 3–4-col desktop) — ListingCard
 └─ Map toggle (optional, post-MVP)

Listing Detail (/listings/[id])
 ├─ Photo/video gallery
 ├─ Price + rental period + verification badge
 ├─ Location/area (approximate, no exact address publicly)
 ├─ Amenities grid
 ├─ Agent card (mini profile, rating)
 ├─ Actions: Save · Chat with Agent (creates lead) · Request Viewing · Report
 └─ Similar listings (2-col mobile grid)

University / Area Page (/universities/[slug])
 ├─ University info + map pin
 └─ Listings near this university (grid)

Agent Profile (/agents/[id])
 ├─ Business name, bio, verification badge, rating
 ├─ Active listings (grid)
 └─ Reviews list
```

## 3. Student Surface (`/student/...`)

```
Dashboard          → recent activity, saved listings preview, active leads preview
Saved Listings     → grid, 2-col mobile
Leads              → list of leads with lifecycle status chip; tap → conversation
Chats              → conversation list → thread view (iOS Messages-style bubbles)
Viewing Requests   → list with status (Requested/Accepted/Declined/Completed…)
Profile            → university, budget range, preferred area, move-in date, room type
```

## 4. Agent Surface (`/agent/...`)

```
Dashboard      → subscription status, active listings count, new leads, quick stats
Listings       → list/grid + "Create listing" (AI-assisted extraction form)
   └─ Listing detail/edit → status, verification status, images, amenities
Leads          → Kanban-style board across lifecycle stages (NEW…RENTED) or filterable list
   └─ Lead detail → student info, requirements, linked conversation, linked viewing
Chats          → conversation list → thread
Viewings       → calendar/list, accept/decline/reschedule/mark completed
Billing        → subscription status/renew, lead charge history, payment methods
Analytics      → listing views, leads received, conversion rates
Profile        → business name, bio, photo, verification status
```

## 5. Admin Surface (`/admin/...`)

```
Dashboard          → platform health metrics (supply/demand/marketplace/revenue/trust)
Users              → search/suspend/restore/activity
Agents             → verification queue, suspend, view listings/leads/billing
Properties         → duplicate merge, edit, verify, remove fraudulent
Listings           → approve/reject/pause/mark rented/flag
Duplicate Review   → side-by-side compare, merge action
Reports            → complaint queue, resolution workflow
Payments           → subscriptions, lead charges, refunds, failed payments, revenue reports
```

## 6. Cross-Cutting Flows

### 6.1 Lead creation ("Chat with Agent" / "Request Viewing")
```
Listing Detail → [Chat with Agent] → auth check
   → lead intake form (name, phone, move-in date, budget, requirements)
   → lead created → lead_charge created → conversation opened
   → redirect to Chats thread, agent notified
```

### 6.2 Viewing request
```
Conversation or Listing → [Request Viewing] → date/time + notes sheet
   → viewing_request created (REQUESTED)
   → agent Accepts/Declines/Reschedules from Agent > Viewings
   → status updates reflected in both Student > Viewing Requests and the chat thread (system message)
```

### 6.3 AI natural-language search
```
Home / Search → free-text input ("Natafuta chumba Njiro karibu na chuo, 150,000...")
   → AI extracts structured filters (shown to user as editable filter chips)
   → filters run against real listings query
   → results grid (never AI-invented listings)
```

## 7. Navigation Pattern by Device

### Desktop / large screen (≥1024px) — "iOS desktop app" pattern
- Fixed left **sidebar** (frosted glass) with sections + icons, similar to macOS Finder/Mail sidebar.
- Top **toolbar** per page: page title, contextual actions, search field.
- Content area uses a card-based grid; detail views open as a right-side panel or centered sheet, not full navigation away from context, matching native macOS/iPadOS split-view feel.

### Mobile / small screen (<768px) — native iOS pattern
- **Bottom tab bar**, frosted glass, 4–5 items max, matching iOS Human Interface Guidelines tab bar behavior.
- **Large title** navigation bar at top of each tab that collapses to a small centered title on scroll (iOS large-title pattern).
- Drill-down navigation uses a **push transition** (slide from right) with a back chevron + label, not a full page reload.
- Actions that would be a dropdown on desktop become an iOS **action sheet** or **bottom sheet** on mobile.
- Forms use iOS-style grouped list rows (inset, rounded groups) rather than boxed web forms.

### Tablet (768–1024px)
- Follows the desktop sidebar pattern but collapsible to icon-only rail, mirroring iPadOS sidebar behavior.

## 8. Card Grid Rule (governs all listing/agent/property grids)

- **Mobile (<640px): exactly 2 items per row** for listing cards, agent cards, saved items, search results, and similar grids — no single-column stacking for card collections.
- **Tablet: 3 per row.**
- **Desktop: 3–4 per row** depending on container width, capped so cards never exceed a comfortable reading width (~340px).
- Grid gap scales with breakpoint (see design system spacing tokens).
- This rule applies uniformly across Public, Student, Agent, and Admin surfaces wherever cards are used.

## 9. Empty/Error/Loading States (apply everywhere)

- Empty states: icon + one-line explanation + primary action (e.g. "No saved listings yet" → "Browse listings").
- Loading: skeleton cards matching the 2-col mobile / N-col desktop grid, using the glass shimmer treatment (see design system).
- Errors: inline, explain what happened and how to fix it — never a raw stack trace or generic "Something went wrong" with no next step.
