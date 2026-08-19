# Student Housing Marketplace — Product & Technical Specification

## 1. Project Overview

A student-focused housing marketplace starting in **Njiro, Arusha, Tanzania**, targeting university/college students who frequently rent rooms and houses, often on approximately three-month rental cycles.

The current market is dominated by informal **dalali wa nyumba (housing agents)**. Agents know which rooms are available, connect renters with properties, take prospective tenants to view properties, and earn a commission when a rental succeeds.

The platform will digitize this existing ecosystem rather than trying to eliminate the agents.

### Core marketplace

**Students / Renters ↔ Platform ↔ Dalalis ↔ Property Owners**

The platform provides:

- Property discovery
- Housing search and filtering
- AI-powered housing search
- Agent profiles
- Listings
- Qualified leads
- Internal chat
- Viewing requests
- Listing/property verification
- Agent lead management
- Subscription and lead billing
- Reviews and trust signals
- Admin moderation

The platform initially focuses on **Njiro** and should be designed so it can later expand to other student areas in Arusha and eventually other Tanzanian university towns.

---

# 2. Business Problem

## Current process

A student looking for accommodation normally depends on:

- Walking around the area
- Asking friends
- Asking existing tenants
- Finding a dalali
- Paying a small viewing/search fee
- Visiting multiple rooms
- Negotiating with the agent/owner

Dalalis have valuable local information, but the process is fragmented and mostly offline.

## Main problems

### Student problems

- Difficult to know which rooms are actually available
- Difficult to compare prices
- Difficult to know distance from university
- Limited photos/information
- Risk of outdated or misleading listings
- Finding trustworthy agents is difficult
- Many physical visits are required
- No central record of conversations and viewing appointments

### Dalali problems

- Finding customers is difficult
- Information is scattered across WhatsApp, phone calls and personal networks
- No proper lead-management system
- Agents can compete for the same property
- No professional online profile
- No analytics showing which listings perform
- Difficult to manage many student enquiries

### Platform opportunity

Create a trusted digital marketplace that gives dalalis customers while giving students a faster and safer way to find accommodation.

---

# 3. Critical Business Insight

The platform should **not treat the property listing as belonging permanently to one dalali**.

In the real market:

- Multiple dalalis may know the same property
- A tenant may tell a friend that they are leaving
- A dalali may know about a vacancy before the owner knows
- An owner may work with multiple agents
- One property can therefore have multiple agents

Therefore:

## Property ownership and lead ownership are different concepts.

A property may have multiple associated agents.

However:

**One student lead belongs to the agent selected by the student.**

This protects agents from stealing each other's customers while accurately reflecting the real-world market.

---

# 4. Revenue Model

## Agent subscription

### Standard Agent Plan

**TZS 20,000/month**

Provides:

- Agent account
- Agent profile
- Listing creation
- Listing management
- Lead management
- Internal chat
- Viewing management
- Basic analytics
- Access to platform-generated leads

## Qualified lead fee

**TZS 5,000 per qualified lead**

The agent is charged when a student creates a meaningful lead, not when someone merely views a listing.

A qualified lead should normally require:

- Student name
- Phone number
- Desired move-in date
- Budget
- Basic housing requirements
- Explicit action such as starting a conversation or requesting a viewing

### Important rule

Do NOT charge per individual message.

Once a lead is created, the student and agent can communicate through the platform without a message-by-message charge.

---

# 5. Lead Lifecycle

Recommended lifecycle:

`NEW → CONTACTED → VIEWING_REQUESTED → VIEWING_CONFIRMED → VIEWED → NEGOTIATING → RENTED`

Alternative endings:

`NEW → CLOSED`

`NEW → LOST`

`VIEWING_REQUESTED → CANCELLED`

The platform records the lifecycle for analytics and agent performance.

---

# 6. Example Business Scenario

Property:

- Njiro
- Self-contained room
- TZS 150,000/month
- Near university
- Available September

Dalali A submits the property.

A student searches for a room and sees it.

Student clicks:

**Chat with Agent**

The platform collects the student's basic requirements.

A qualified lead is created.

Dalali A is charged:

**TZS 5,000**

The student and dalali chat inside the platform.

The student requests a viewing.

The dalali accepts.

The student views the room.

If the student rents it, the dalali receives their normal market commission directly through the existing rental process.

The platform does NOT initially need to collect the entire rent or the dalali's one-month commission.

The platform earns its revenue from:

- TZS 20,000 monthly agent subscription
- TZS 5,000 qualified lead fees

---

# 7. Listing Verification Model

Listings should support multiple verification states.

### UNVERIFIED

Information reported by an agent but not independently verified.

### AGENT_VERIFIED

The platform has verified the agent.

### PROPERTY_VERIFIED

The platform has verified the physical property/information.

### OWNER_VERIFIED

The owner has confirmed the property and availability.

### VERIFIED

Strongest trust state where appropriate verification requirements have been satisfied.

The UI should clearly communicate verification status.

Never falsely imply that an owner approved a listing when they did not.

---

# 8. Duplicate Property Handling

The platform should detect possible duplicate properties.

Example:

Agent A:
> Self-contained room, Njiro, 150k.

Agent B:
> Single room, Njiro, 150,000, near university.

The system should identify them as possible duplicates.

Use a combination of:

- Location
- Approximate coordinates
- Rent
- Property type
- Photos
- Description similarity
- Address
- Nearby landmarks

AI may assist in identifying possible duplicates, but the final business decision should remain deterministic/admin-controlled.

Possible statuses:

- UNIQUE
- POSSIBLE_DUPLICATE
- CONFIRMED_DUPLICATE
- MERGED

---

# 9. Student Experience

## Search

Students can search by:

- University
- Area
- Distance
- Price
- Room type
- Self-contained/shared
- Furnished/unfurnished
- Bedrooms
- Bathroom
- Water availability
- Electricity
- Internet
- Security
- Availability date
- Gender restrictions where applicable
- Other verified amenities

## Listing page

A listing should show:

- Photos
- Video where available
- Price
- Rental period
- Location/area
- Approximate distance to university
- Room/property type
- Amenities
- Availability
- Verification status
- Agent profile
- Agent rating/reviews
- Contact/chat
- Request viewing
- Report listing

Avoid exposing exact private addresses publicly where that creates safety/privacy concerns. Exact viewing information can be shared through the agent/viewing workflow.

---

# 10. Internal Chat

The platform should include real-time or near-real-time messaging.

### Participants

- Student
- Agent

Later:

- Owner
- Admin/support

### Chat features

- Text messages
- Listing context
- Lead context
- Viewing request
- Viewing confirmation
- Read status
- Message timestamps
- Report/block
- Basic attachment support later

Every conversation should belong to a lead.

### Important rule

The chat should not be priced per message.

One qualified lead creates the billable event.

---

# 11. Viewing System

Student can request a viewing.

Fields:

- Listing
- Student
- Agent
- Requested date
- Requested time
- Notes
- Status

Statuses:

- REQUESTED
- ACCEPTED
- DECLINED
- RESCHEDULED
- COMPLETED
- CANCELLED
- NO_SHOW

Agent can:

- Accept
- Reject
- Suggest another time
- Mark completed

Student can:

- Cancel
- Confirm attendance
- Report a problem

---

# 12. AI Features

AI should support the platform, not control critical business rules.

## AI Feature 1 — Student Housing Assistant

Student can write natural language such as:

> "Natafuta chumba Njiro karibu na chuo, 150,000 kwa mwezi, self-contained, nahitaji kuhamia September."

AI extracts structured requirements and searches the database.

The final property results must come from the actual database.

AI must never invent a room.

---

## AI Feature 2 — Smart Matching

Calculate property suitability based on:

- Budget
- Location
- University
- Distance
- Room type
- Amenities
- Availability
- Student preferences

Return a match score and explain why the listing matches.

---

## AI Feature 3 — Listing Information Extraction

Agent can enter:

> "Nina chumba kimoja Njiro karibu na chuo, 150k, self, maji yapo, available mwezi wa 9."

AI can extract:

- Location = Njiro
- Rent = 150,000
- Type = Self-contained
- Water = Available
- Availability = September

Agent confirms before publication.

AI must not publish unverified extracted information automatically.

---

## AI Feature 4 — Duplicate Detection

Use AI similarity analysis to flag potential duplicate listings.

AI output:

`possible_duplicate = true`

The application/admin decides what happens.

---

## AI Feature 5 — Fraud/Risk Detection

Flag suspicious patterns such as:

- Reused photos
- Contradictory listing details
- Unrealistic pricing
- Repeated descriptions
- Multiple suspicious accounts
- Abnormal listing behavior

AI flags risk; it should not automatically accuse an agent of fraud.

---

## AI Feature 6 — Lead Summaries

For agents managing many conversations, AI can summarize:

> Student wants self-contained room under 150k. Viewing requested Saturday.

AI can also identify leads needing follow-up.

---

## AI Feature 7 — Future Demand Analytics

After enough data exists, AI can help identify:

- Popular areas
- Popular price ranges
- Popular room types
- High-demand periods
- Listing conversion rates
- Agent performance
- Student search patterns

---

## Future AI Feature — Swahili/Voice Search

Allow students to speak naturally in Swahili.

Example:

> "Natafuta chumba cha laki moja hamsini Njiro karibu na chuo."

Convert voice → text → structured search → matching listings.

This should be considered a later-stage feature.

---

# 13. Technology Stack

## Frontend

**Next.js**

Recommended:

- Next.js App Router
- TypeScript
- Server Components where appropriate
- Client Components only where interactivity requires them

## Database

**PostgreSQL**

Primary relational database.

Recommended ORM:

**Prisma**

Alternative ORM may be considered if project requirements change, but Prisma is preferred for initial development.

## Styling/UI

Recommended:

- Tailwind CSS
- shadcn/ui
- Lucide icons

## Authentication

Use a secure authentication solution compatible with Next.js.

Possible architecture:

- Auth.js
- Secure session-based authentication
- OAuth/social login later

Support initial roles:

- STUDENT
- AGENT
- ADMIN
- OWNER (optional in initial MVP but database-ready)

## Validation

Use:

**Zod**

for API/server validation and form schemas.

## Forms

Recommended:

**React Hook Form + Zod**

## File/image storage

Do not store large image binaries directly in PostgreSQL.

Use object storage such as:

- S3-compatible storage
- Cloudflare R2
- Supabase Storage
- Similar production storage

Database stores metadata and URLs/references.

## Real-time chat

Possible options:

- WebSockets
- Socket.IO
- Supabase Realtime
- Ably
- Pusher

Choose based on deployment requirements.

## Payments

Payment architecture must support Tanzania.

Design the payment abstraction so providers can be added without rewriting the billing system.

Potential providers can be evaluated later based on:

- Mobile money support
- Cards
- Tanzanian availability
- API quality
- Transaction fees

The system should initially focus on agent subscription and lead billing rather than collecting property rent.

## AI

Use an abstraction layer so the application is not locked to one AI provider.

Possible architecture:

`AIService`

with providers such as:

- OpenAI-compatible API
- OpenRouter-compatible API
- Other providers later

AI calls should be server-side.

Never expose API keys to the browser.

---

# 14. High-Level Architecture

```text
Next.js Application
│
├── Public Website
│   ├── Home
│   ├── Search
│   ├── Listings
│   ├── Universities
│   └── Agent Profiles
│
├── Student Dashboard
│   ├── Saved Listings
│   ├── Leads
│   ├── Chats
│   ├── Viewing Requests
│   └── Profile
│
├── Agent Dashboard
│   ├── Overview
│   ├── Listings
│   ├── Leads
│   ├── Chats
│   ├── Viewings
│   ├── Billing
│   ├── Analytics
│   └── Profile
│
├── Admin Dashboard
│   ├── Users
│   ├── Agents
│   ├── Properties
│   ├── Listings
│   ├── Verification
│   ├── Duplicate Review
│   ├── Reports
│   ├── Payments
│   └── Analytics
│
├── Application Services
│   ├── Auth
│   ├── Listings
│   ├── Leads
│   ├── Chat
│   ├── Viewings
│   ├── Billing
│   ├── Notifications
│   ├── Verification
│   └── AI
│
└── PostgreSQL
```

---

# 15. Core Database Structure

The schema should be relational and normalized.

## users

```text
id
email
phone
password_hash / auth_provider_id
role
first_name
last_name
avatar_url
is_active
created_at
updated_at
```

Roles:

```text
STUDENT
AGENT
ADMIN
OWNER
```

---

## agent_profiles

```text
id
user_id
business_name
bio
profile_photo_url
verification_status
rating
total_reviews
total_successful_rentals
created_at
updated_at
```

---

## student_profiles

```text
id
user_id
university_id
budget_min
budget_max
preferred_area
move_in_date
room_type
created_at
updated_at
```

---

## universities

```text
id
name
slug
description
latitude
longitude
city
is_active
created_at
updated_at
```

---

## properties

Represents the physical property.

```text
id
title
property_type
address
area
latitude
longitude
description
created_at
updated_at
```

Important:

A property should NOT contain a single agent_id.

Multiple agents can be associated with a property.

---

## property_agents

Many-to-many relationship.

```text
id
property_id
agent_id
relationship_type
status
created_at
updated_at
```

Relationship examples:

```text
AGENT
OWNER
INFORMANT
```

---

## listings

Represents an agent's active offer/listing for a property.

```text
id
property_id
agent_id
title
description
rent_amount
rent_period
property_type
availability_date
status
verification_status
published_at
expires_at
created_at
updated_at
```

Statuses:

```text
DRAFT
PENDING_REVIEW
ACTIVE
PAUSED
RENTED
EXPIRED
REJECTED
```

---

## listing_amenities

```text
id
listing_id
amenity_id
value
```

---

## amenities

```text
id
name
slug
category
```

---

## listing_images

```text
id
listing_id
url
storage_key
sort_order
is_primary
created_at
```

---

## listing_videos

```text
id
listing_id
url
storage_key
created_at
```

---

## leads

This is one of the most important tables.

```text
id
student_id
agent_id
listing_id
status
source
budget
move_in_date
requirements
lead_charge_amount
billing_status
created_at
updated_at
```

Possible source values:

```text
LISTING
AI_SEARCH
SEARCH
FEATURED_LISTING
DIRECT_AGENT
```

Billing:

```text
PENDING
CHARGED
WAIVED
FAILED
REFUNDED
```

---

## conversations

```text
id
lead_id
student_id
agent_id
status
created_at
updated_at
last_message_at
```

---

## messages

```text
id
conversation_id
sender_id
message_type
content
attachment_url
is_read
created_at
```

Message types:

```text
TEXT
IMAGE
FILE
SYSTEM
VIEWING_REQUEST
```

---

## viewing_requests

```text
id
lead_id
listing_id
student_id
agent_id
requested_at
scheduled_at
status
notes
created_at
updated_at
```

---

## subscriptions

```text
id
agent_id
plan_id
status
started_at
expires_at
auto_renew
created_at
updated_at
```

---

## subscription_plans

```text
id
name
price
billing_period
max_listings
features
is_active
created_at
updated_at
```

Initial plan:

```text
STANDARD
20,000 TZS/month
```

---

## lead_charges

Keep billing events separate from leads.

```text
id
lead_id
agent_id
amount
currency
status
payment_transaction_id
charged_at
created_at
```

Initial amount:

```text
5,000 TZS
```

This makes financial auditing much easier.

---

## payments

Generic payment table.

```text
id
user_id
agent_id
type
amount
currency
provider
provider_transaction_id
status
metadata
created_at
updated_at
```

Types:

```text
SUBSCRIPTION
LEAD_FEE
OTHER
```

---

## reviews

```text
id
student_id
agent_id
listing_id
rating
comment
status
created_at
updated_at
```

Reviews should ideally only be allowed after meaningful interaction/transaction.

---

## reports

```text
id
reporter_id
target_type
target_id
reason
description
status
admin_id
resolution
created_at
updated_at
```

---

## verification_records

```text
id
target_type
target_id
verification_type
status
verified_by
notes
created_at
updated_at
```

Verification types:

```text
AGENT
PROPERTY
OWNER
LISTING
```

---

## notifications

```text
id
user_id
type
title
message
data
read_at
created_at
```

---

## saved_listings

```text
id
student_id
listing_id
created_at
```

---

## ai_interactions

For AI analytics/auditing.

```text
id
user_id
type
input
output
provider
model
tokens_used
metadata
created_at
```

Do not store unnecessary sensitive information.

---

# 16. Listing vs Property Architecture

This distinction is mandatory.

### Property

The physical place.

Example:

> Property #10482

### Listing

An agent's offer/information about that property.

Example:

> Listing #L9001 by Agent A

Another agent may have:

> Listing #L9010 for Property #10482

This architecture allows multiple agents to represent the same physical property.

---

# 17. Lead Ownership Rules

When Student A chooses Agent A:

```text
Student A
    ↓
Listing
    ↓
Agent A
    ↓
Lead #123
```

Agent B must not receive that lead unless the student explicitly chooses Agent B.

If a student contacts multiple agents about the same property, those may be separate leads, but the system should detect potential duplicate student/property interactions to prevent abuse.

---

# 18. Lead Charging Rules

A lead becomes billable when:

1. Student is authenticated or verified sufficiently
2. Student selects an active listing
3. Student explicitly requests contact/chat/viewing
4. Required lead information is submitted
5. The lead is successfully created

Then:

```text
Lead created
↓
Create lead_charge
↓
Charge 5,000 TZS
↓
Open conversation
↓
Notify agent
```

Never charge merely for:

- Page views
- Search impressions
- Listing clicks
- AI recommendations

---

# 19. Subscription Rules

Agent subscription:

**20,000 TZS/month**

When active:

- Agent can publish/manage listings
- Agent can receive leads
- Agent can use chat
- Agent can request/manage viewings

When expired:

- Existing data remains
- Listings may be paused according to business rules
- New paid leads should not be delivered until subscription is renewed

Avoid deleting listings when subscription expires.

---

# 20. Admin Features

Admin should be able to:

### Users

- Search users
- Suspend users
- Restore users
- View activity

### Agents

- Verify agent
- Reject verification
- Suspend agent
- View listings
- View leads
- View billing

### Properties

- Merge duplicates
- Edit incorrect information
- Verify property
- Remove fraudulent properties

### Listings

- Approve
- Reject
- Pause
- Mark rented
- Flag

### Leads

- View lead lifecycle
- Investigate disputes
- Review billing

### Reports

- Investigate complaints
- Handle suspicious listings
- Resolve agent disputes

### Finance

- Subscription payments
- Lead charges
- Refunds
- Failed payments
- Revenue reports

---

# 21. Trust & Safety

The platform should prioritize trust.

Features:

- Agent verification
- Property verification
- Owner verification
- Reviews
- Report listing
- Report agent
- Duplicate detection
- Suspicious behavior detection
- Listing expiration
- Availability confirmation
- Admin moderation

A listing should not remain "available" forever.

Recommended:

Require agents to periodically confirm:

> "Is this property still available?"

If they fail to confirm, reduce ranking or automatically pause the listing.

---

# 22. Notifications

Channels:

### In-app

- New lead
- New message
- Viewing request
- Viewing accepted
- Subscription expiry
- Payment success
- Verification result

### Email

Use for:

- Account events
- Payment receipts
- Important notifications

### SMS/WhatsApp

Potential future integrations for Tanzania.

Do not make external messaging mandatory for MVP.

---

# 23. Search Architecture

Initial search can use PostgreSQL.

Search filters:

- Area
- Price
- Property type
- University
- Distance
- Availability
- Amenities

For geographic search, PostgreSQL can later use **PostGIS**.

Recommended future structure:

```text
University coordinates
+
Property coordinates
=
distance calculation
```

This allows:

> "Show rooms within 1 km of my university."

---

# 24. AI Architecture

Do not call AI directly throughout the application.

Create an AI service layer.

Example:

```text
lib/ai/
├── ai-service.ts
├── providers/
│   ├── openai.ts
│   ├── openrouter.ts
│   └── ...
├── prompts/
│   ├── housing-search.ts
│   ├── listing-extraction.ts
│   ├── duplicate-detection.ts
│   └── lead-summary.ts
└── schemas/
    ├── housing-search.ts
    └── listing-extraction.ts
```

AI output must be validated with Zod before being used by the application.

---

# 25. API/Application Structure

Recommended Next.js organization:

```text
src/
├── app/
│   ├── (public)/
│   ├── student/
│   ├── agent/
│   ├── admin/
│   ├── api/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── listings/
│   ├── chat/
│   ├── leads/
│   └── ...
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── ai/
│   ├── payments/
│   ├── notifications/
│   ├── validation/
│   └── permissions/
│
├── server/
│   ├── listings/
│   ├── leads/
│   ├── agents/
│   ├── students/
│   ├── chat/
│   ├── viewings/
│   └── billing/
│
└── types/
```

Keep business logic out of UI components.

---

# 26. Security Requirements

Implement:

- Server-side authorization
- Role-based access control
- Input validation
- Rate limiting
- Secure sessions
- Password hashing if password authentication is used
- CSRF protection where applicable
- Secure file upload validation
- File type restrictions
- Image size limits
- API authentication
- Payment webhook verification
- Audit logs for admin actions

Never trust client-side role/permission values.

---

# 27. Important Business Rules

### Rule 1

A property can have multiple agents.

### Rule 2

A student lead belongs to the agent selected by the student.

### Rule 3

A listing can be created from agent-reported information even if the owner has not registered, but it must clearly show its verification status.

### Rule 4

Do not claim owner authorization without owner confirmation.

### Rule 5

Lead fee = **5,000 TZS**.

### Rule 6

Agent subscription = **20,000 TZS/month**.

### Rule 7

Messages after lead creation are not individually charged.

### Rule 8

Property rent is not initially processed through the platform.

### Rule 9

Agent's normal rental commission remains between agent/owner/renter according to the existing market arrangement.

### Rule 10

AI assists decisions but does not control financial, permission, ownership, or verification rules.

---

# 28. MVP Scope

The first release should contain:

## Public

- Home
- Search
- Listing pages
- University/area pages
- Agent profiles

## Student

- Registration/login
- Search/filter
- Listing details
- Save listing
- Create lead
- Chat
- Request viewing
- Manage profile

## Agent

- Registration
- Verification application
- Subscription
- Dashboard
- Create listing
- Manage listings
- Receive leads
- Chat
- Manage viewing requests
- Basic analytics

## Admin

- Dashboard
- User management
- Agent verification
- Listing moderation
- Property management
- Duplicate review
- Reports
- Billing overview

## AI MVP

- Natural-language housing search
- Listing information extraction
- Basic duplicate detection

---

# 29. Do NOT Build in the First Version

Avoid unnecessary complexity initially.

Do not start with:

- Full rent payment processing
- Complex owner portal
- Voice AI
- Advanced fraud AI
- Predictive pricing
- Full accounting system
- Marketplace for furniture
- Moving services
- Laundry marketplace
- Multi-country expansion

Prove the core marketplace first.

---

# 30. Launch Strategy

## Stage 1 — Njiro

Focus on the specific student-heavy area around Njiro.

Recruit:

- 5–10 dalalis
- Initial 50–100 listings
- Initial student users

Do not charge aggressively during the initial validation period if that prevents supply acquisition.

## Stage 2

Once students are actively using the platform:

- Introduce 20,000 TZS subscription
- Introduce 5,000 TZS qualified lead charge
- Measure conversion

## Stage 3

Improve:

- Verification
- AI matching
- Chat
- Viewing management
- Agent analytics

## Stage 4

Expand to other student-heavy areas in Arusha.

## Stage 5

Expand to other Tanzanian university towns.

---

# 31. Key Metrics

Track:

### Supply

- Number of active agents
- Number of active listings
- New listings/week
- Verified listings
- Expired listings

### Demand

- Registered students
- Search sessions
- Listing views
- Saved listings
- Leads created

### Marketplace

- Leads per agent
- Lead → chat rate
- Lead → viewing rate
- Viewing → rental rate
- Average time to rental

### Revenue

- Active paid agents
- Subscription revenue
- Lead revenue
- Revenue per agent
- Monthly recurring revenue

### Trust

- Reports
- Fraud flags
- Duplicate listings
- Failed availability confirmations
- Agent ratings

---

# 32. Success Definition

The MVP is successful when:

1. Dalalis are willing to pay 20,000 TZS/month.
2. Students actively search for rooms on the platform.
3. Students create genuine leads.
4. Dalalis receive useful leads.
5. Students and agents use internal chat.
6. Viewings are successfully arranged.
7. Some leads convert into rentals.
8. Listings remain reasonably accurate.
9. The platform generates recurring revenue.

The most important proof is not the number of registered users.

It is:

**Paid agents + genuine leads + successful rentals.**

---

# 33. Long-Term Vision

The long-term product can become a student accommodation infrastructure platform for Tanzania.

Potential future ecosystem:

```text
Student
  ↓
AI Housing Assistant
  ↓
Property Search
  ↓
Agent
  ↓
Chat
  ↓
Viewing
  ↓
Rental
  ↓
Reviews
  ↓
Renewal / New Search
```

Later services can include:

- Digital rental agreements
- Rent payments
- Deposits
- Owner dashboard
- Verified properties
- Student roommate matching
- Moving services
- Internet/Wi-Fi services
- Furniture marketplace
- Cleaning services
- Student services

These should only be added after the core housing marketplace is proven.

---

# 34. Development Principles

1. Build the marketplace before adding unnecessary features.
2. Keep business rules deterministic.
3. Use AI as an assistant, not as the source of truth.
4. Keep property ownership separate from agent listing relationships.
5. Keep leads separate from listings.
6. Keep financial transactions auditable.
7. Never expose private information unnecessarily.
8. Design for Tanzania-first requirements.
9. Use Swahili-friendly UX.
10. Make the system scalable to multiple universities and cities.
11. Keep the payment provider behind an abstraction layer.
12. Keep the AI provider behind an abstraction layer.
13. Use PostgreSQL as the source of truth.
14. Validate all AI-generated structured data.
15. Build the MVP around real Njiro users before expanding.

---

# 35. Recommended Initial Folder/Repository Structure

```text
student-housing-platform/
├── apps/
│   └── web/
│       ├── src/
│       ├── public/
│       ├── prisma/
│       └── ...
│
├── packages/
│   ├── ui/
│   ├── validation/
│   ├── types/
│   └── config/
│
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   ├── database.md
│   └── business-rules.md
│
├── .env.example
├── package.json
├── turbo.json
└── README.md
```

A monorepo is optional. If it creates unnecessary complexity for the MVP, a single Next.js application is acceptable.

---

# 36. Initial Implementation Order

## Phase 1

- Next.js project
- PostgreSQL
- Prisma
- Authentication
- User roles
- Database schema
- Basic UI system

## Phase 2

- Universities
- Properties
- Listings
- Images
- Search/filter
- Agent profiles

## Phase 3

- Student accounts
- Lead creation
- Agent lead dashboard
- Internal chat

## Phase 4

- Viewing requests
- Notifications
- Verification
- Reports
- Admin dashboard

## Phase 5

- Agent subscription
- Lead billing
- Payment integration
- Financial records

## Phase 6

- AI housing search
- AI listing extraction
- AI duplicate detection

## Phase 7

- Analytics
- Optimization
- Production hardening
- Njiro pilot launch

---

# 37. Final Product Concept

The product should be positioned as:

> **A trusted digital marketplace that connects students searching for accommodation with local housing agents who know where available rooms and houses are.**

The platform does not initially replace the traditional dalali.

It **digitizes and improves the dalali's existing business**.

The core economic loop is:

```text
Agent pays
20,000 TZS/month
        ↓
Agent lists available properties
        ↓
Students discover properties
        ↓
Student selects an agent
        ↓
Qualified lead is created
        ↓
Agent pays 5,000 TZS
        ↓
Student + Agent chat
        ↓
Viewing
        ↓
Rental
        ↓
Agent earns normal rental commission
        ↓
Platform earns subscription + lead revenue
```

This is the core model that should be validated before expanding the platform.
