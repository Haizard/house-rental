# Database Structure & Rules

PostgreSQL is the single source of truth. Schema is relational and normalized. Prisma is the recommended ORM.

## 1. Non-Negotiable Modeling Rules

These rules exist because they encode real business behavior in Njiro's rental market — breaking them breaks the product.

1. **Property ≠ Listing.** `properties` is the physical place. `listings` is one agent's offer/claim about that place. Multiple agents can list the same property.
2. **A property never has a single `agent_id` column.** Agent↔property relationships live only in `property_agents` (many-to-many).
3. **A lead belongs to exactly one agent — the one the student chose.** Never auto-route or copy a lead to a second agent.
4. **Billing events are their own table (`lead_charges`), separate from `leads`.** This keeps financial auditing independent of lead-lifecycle mutation.
5. **Never charge for views, impressions, clicks, or AI recommendations.** Only a successfully created lead is billable.
6. **Chat is not billed per message.** One `lead` → one billable event → unlimited messages inside that lead's conversation.
7. **Verification status is explicit and multi-state.** Never let the UI or the DB imply owner approval that hasn't happened (`OWNER_VERIFIED` is a distinct, evidence-backed state).
8. **Duplicate detection produces a status, not a deletion.** AI flags; admin merges/confirms.
9. **Expiring a subscription must never delete listings or historical data.** Pause/downgrade access, don't destroy records.
10. **All money fields are integers in the smallest currency unit (or `numeric`), never floats.**

## 2. Core Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text unique nullable | |
| phone | text unique nullable | Primary contact channel in TZ context |
| password_hash / auth_provider_id | text | |
| role | enum | `STUDENT`, `AGENT`, `ADMIN`, `OWNER` |
| first_name, last_name | text | |
| avatar_url | text nullable | |
| is_active | boolean | |
| created_at, updated_at | timestamptz | |

### `agent_profiles`
`id, user_id (FK→users, unique), business_name, bio, profile_photo_url, verification_status, rating, total_reviews, total_successful_rentals, created_at, updated_at`

### `student_profiles`
`id, user_id (FK→users, unique), university_id (FK→universities), budget_min, budget_max, preferred_area, move_in_date, room_type, created_at, updated_at`

### `universities`
`id, name, slug, description, latitude, longitude, city, is_active, created_at, updated_at`

### `properties`
The physical place. **No `agent_id` column.**
`id, title, property_type, address, area, latitude, longitude, description, created_at, updated_at`

### `property_agents` (M2M)
`id, property_id (FK), agent_id (FK), relationship_type, status, created_at, updated_at`
- `relationship_type`: `AGENT | OWNER | INFORMANT`

### `listings`
An agent's active offer for a property.
`id, property_id (FK), agent_id (FK), title, description, rent_amount, rent_period, property_type, availability_date, status, verification_status, published_at, expires_at, created_at, updated_at`
- `status`: `DRAFT | PENDING_REVIEW | ACTIVE | PAUSED | RENTED | EXPIRED | REJECTED`
- `verification_status`: `UNVERIFIED | AGENT_VERIFIED | PROPERTY_VERIFIED | OWNER_VERIFIED | VERIFIED`

### `amenities`
`id, name, slug, category`

### `listing_amenities`
`id, listing_id (FK), amenity_id (FK), value`

### `listing_images`
`id, listing_id (FK), url, storage_key, sort_order, is_primary, created_at`

### `listing_videos`
`id, listing_id (FK), url, storage_key, created_at`

### `leads` — most important table
`id, student_id (FK), agent_id (FK), listing_id (FK), status, source, budget, move_in_date, requirements (jsonb), lead_charge_amount, billing_status, created_at, updated_at`
- `status` (lifecycle): `NEW → CONTACTED → VIEWING_REQUESTED → VIEWING_CONFIRMED → VIEWED → NEGOTIATING → RENTED`, with alternate exits `NEW → CLOSED`, `NEW → LOST`, `VIEWING_REQUESTED → CANCELLED`
- `source`: `LISTING | AI_SEARCH | SEARCH | FEATURED_LISTING | DIRECT_AGENT`
- `billing_status`: `PENDING | CHARGED | WAIVED | FAILED | REFUNDED`

### `conversations`
`id, lead_id (FK, one per lead), student_id (FK), agent_id (FK), status, created_at, updated_at, last_message_at`

### `messages`
`id, conversation_id (FK), sender_id (FK), message_type, content, attachment_url, is_read, created_at`
- `message_type`: `TEXT | IMAGE | FILE | SYSTEM | VIEWING_REQUEST`

### `viewing_requests`
`id, lead_id (FK), listing_id (FK), student_id (FK), agent_id (FK), requested_at, scheduled_at, status, notes, created_at, updated_at`
- `status`: `REQUESTED | ACCEPTED | DECLINED | RESCHEDULED | COMPLETED | CANCELLED | NO_SHOW`

### `subscription_plans`
`id, name, price, billing_period, max_listings, features (jsonb), is_active, created_at, updated_at`
- Seed row: `STANDARD`, 20,000 TZS / month

### `subscriptions`
`id, agent_id (FK), plan_id (FK), status, started_at, expires_at, auto_renew, created_at, updated_at`

### `lead_charges`
Kept separate from `leads` for auditability.
`id, lead_id (FK), agent_id (FK), amount, currency, status, payment_transaction_id, charged_at, created_at`
- Seed amount: 5,000 TZS

### `payments` (generic ledger)
`id, user_id (FK), agent_id (FK), type, amount, currency, provider, provider_transaction_id, status, metadata (jsonb), created_at, updated_at`
- `type`: `SUBSCRIPTION | LEAD_FEE | OTHER`

### `reviews`
`id, student_id (FK), agent_id (FK), listing_id (FK), rating, comment, status, created_at, updated_at`
- Only allowed after a meaningful interaction (e.g. a `COMPLETED` viewing or `RENTED` lead) — enforce in `server/`, not just UI.

### `reports`
`id, reporter_id (FK), target_type, target_id, reason, description, status, admin_id, resolution, created_at, updated_at`

### `verification_records`
`id, target_type, target_id, verification_type, status, verified_by, notes, created_at, updated_at`
- `verification_type`: `AGENT | PROPERTY | OWNER | LISTING`

### `notifications`
`id, user_id (FK), type, title, message, data (jsonb), read_at, created_at`

### `saved_listings`
`id, student_id (FK), listing_id (FK), created_at`

### `ai_interactions`
Audit log for AI usage. `id, user_id (FK), type, input, output, provider, model, tokens_used, metadata (jsonb), created_at`
- Do not log unnecessary sensitive personal data.

## 3. Relationship Overview (ASCII)

```text
users ──1:1── agent_profiles
users ──1:1── student_profiles ──*:1── universities

properties ──*:*── agents   (via property_agents)
properties ──1:*── listings ──*:1── agent_profiles

listings ──1:*── listing_images
listings ──1:*── listing_videos
listings ──*:*── amenities  (via listing_amenities)

students ──1:*── leads ──*:1── agent_profiles
leads ──1:1── conversations ──1:*── messages
leads ──1:*── viewing_requests
leads ──1:*── lead_charges ──0:1── payments

agent_profiles ──1:*── subscriptions ──*:1── subscription_plans

reviews, reports, verification_records, notifications, saved_listings, ai_interactions
  → all reference users / listings / agents as needed, independently auditable
```

## 4. Indexing Guidance

- `listings`: composite index on `(status, area)`, `(status, university-adjacent geo query)`, and `availability_date`.
- `leads`: index on `(agent_id, status)` for the agent lead board; `(student_id)` for the student's lead list.
- `messages`: index on `(conversation_id, created_at)`.
- `properties`: index on `(latitude, longitude)` — move to PostGIS + geo index once distance search matters.
- Enforce `unique(property_id, agent_id)` on `property_agents` to prevent duplicate relationship rows.

## 5. Financial Auditability Rules

- Every charge (subscription or lead) creates a row in `payments` linked back to `subscriptions` or `lead_charges`.
- Never mutate `lead_charges.amount` after `charged_at` is set — issue a linked refund record instead.
- `billing_status` transitions are one-directional except for explicit admin-initiated `REFUNDED`.

## 6. Search Note

MVP search runs on plain PostgreSQL filters (area, price, type, university, availability, amenities). Add PostGIS later for true distance queries (`university coordinates + property coordinates → distance`).
