# Component Library — iOS Glass Component Rules

Concrete, per-component rules that implement `05-UI-DESIGN-SYSTEM.md`. Build these once in `components/ui/` and compose everything else from them (see `02-PROJECT-STRUCTURE.md §3.7`).

## 1. Buttons

| Variant | Use | Style |
|---|---|---|
| Primary | Main CTA (Chat with Agent, Save changes, Publish) | Solid `--accent` fill, white text, `--radius-md`, subtle inner highlight top edge; press state scales to 96% + darkens to `--accent-pressed` |
| Glass (secondary) | Secondary actions (Cancel, Filter, Save listing) | `--glass-fill` background, `--glass-border`, `--text-primary` label |
| Tinted | Selected/toggle state (active filter chip) | `--accent-soft` fill, `--accent` text |
| Destructive | Delete, Decline, Report | `--danger-soft` fill at rest, solid `--danger` on confirm step |
| Plain/text | Tertiary inline actions | No fill, `--accent` text, no border |

Rules:
- Min height 44px (mobile), 36–40px acceptable on desktop with mouse precision, but touch targets on responsive desktop (touchscreen laptops) still respect 44px min.
- Full-width primary buttons on mobile forms/sheets; auto-width on desktop toolbars.
- Icon+label buttons: icon left, 8px gap, Lucide icons at 18–20px.
- Loading state: label replaced by a small iOS-style activity spinner, button stays same width (no layout shift).

## 2. Cards

### ListingCard (grid item — 2/row mobile rule applies)
```
┌─────────────────────┐
│  [image 4:3]         │  ← rounded-lg top corners, verification pill top-left, save-heart top-right
│  ● Verified          │
├─────────────────────┤
│  TZS 150,000/mo      │  ← Headline weight, --text-primary
│  Self-contained · Njiro│ ← Subheadline, --text-secondary
│  ★ 4.8 (23)           │  ← Footnote
└─────────────────────┘
```
- Container: `.glass-surface` at `--radius-md`, padding `--space-3`.
- Title clamps to 1 line, secondary line clamps to 1 line, so two cards side-by-side stay equal height.
- Tap target = whole card; heart/save icon has its own larger hit-area (44px) stopping propagation.

### AgentCard
Avatar (circular, glass ring border) + business name + rating + verification badge + "View profile" plain button.

### StatCard (dashboards)
Compact glass tile: icon in `--accent-soft` circle, big number (Title 1), label (Footnote). Used in 2-col mobile / 4-col desktop stat grids.

### LeadCard / Kanban card (agent lead board)
Glass card with student name, budget, move-in date, status pill (colored per lifecycle stage using the status color mapping in the design system), last-message snippet, timestamp.

## 3. Forms & Inputs

- **Text input**: glass field, `--radius-sm`, hairline border, focuses to `--accent` 2px ring + border tint; placeholder in `--text-tertiary`.
- **Grouped list form (mobile)**: iOS Settings-style — rows inside a single rounded glass container, hairline dividers between rows, label left / control right (e.g. toggle, chevron-to-picker).
- **Select/Picker**: opens as a bottom sheet on mobile (native iOS picker wheel or list), popover on desktop — never a native `<select>` box styled minimally; always routed through the sheet/popover component.
- **Toggle switch**: iOS-style pill switch, `--success` when on, gray track when off.
- **Segmented control**: used for room-type/status quick filters; pill track background `--glass-fill-subtle`, active segment `--glass-fill-strong` with shadow.
- **Textarea**: same glass field styling, min-height 88px, autosize for chat/description fields.
- **Validation errors**: inline below field, `--danger` text, small icon; never a red border alone (contrast/accessibility).
- **Multi-step forms** (agent listing creation, lead intake): iOS-style step indicator (dots or progress bar) at top, one screen per step on mobile, single scrolling form with section headers on desktop.

## 4. Navigation Components

### TabBar (mobile, bottom)
- 4–5 items, glass-fill-strong, blurred, safe-area padding.
- Active item: icon filled variant + `--accent` tint + label; inactive: icon outline + `--text-secondary`.
- Roles: Student → Home/Search, Saved, Leads, Chats, Profile. Agent → Dashboard, Listings, Leads, Chats, Profile. Admin (mobile, simplified) → Dashboard, Queue, Reports, More.

### Sidebar (desktop)
- Fixed width 260px, glass-fill-strong, full-height, sits inset from window edge with `--space-3` margin so the canvas gradient is visible around it (true "floating glass panel" look, not edge-to-edge flat sidebar).
- Section groups with small caption labels; active item gets `--accent-soft` rounded pill background.

### Top Toolbar (desktop)
- Page title (Title 1) left, contextual actions + search field right, sits in a glass bar with hairline bottom border, sticky on scroll.

### Large Title Nav Bar (mobile)
- Large Title styling per typography table; collapses on scroll into a centered small-title glass bar (`--glass-fill-strong`, hairline bottom border) exactly like iOS `UINavigationBar` with `prefersLargeTitles`.

## 5. Sheets, Modals, Overlays

- **Bottom sheet**: rounded top corners `--radius-lg`, drag handle (4px pill, `--text-tertiary`, centered, 8px from top), glass-fill-strong, light scrim behind (`rgba(242,244,248,0.6)`), swipe-down to dismiss.
- **Action sheet**: same shell, stacked full-width plain buttons, destructive action styled `--danger`, Cancel as a separated glass button below with an 8px gap.
- **Modal (desktop)**: centered card, `--radius-lg`, `--glass-fill-strong`, max-width 480–560px, light scrim behind, close (×) top-right.
- **Toast/banner**: pill-shaped glass banner sliding from top, auto-dismiss 3s, tap to dismiss early.
- **Popover** (desktop filters, menus): small glass card anchored to trigger, `--radius-md`, arrow/caret optional.

## 6. Chat Components

- **Conversation list row**: avatar, name, last-message snippet (`--text-secondary`), timestamp (`--footnote`), unread dot in `--accent`.
- **Message bubble**: outgoing = `--accent` solid, white text, right-aligned, `--radius-md` with flattened bottom-right corner; incoming = `--glass-fill` bubble, `--text-primary`, left-aligned, flattened bottom-left corner. System messages (viewing request/confirmation) render as centered glass pill, not a bubble.
- **Composer**: glass input bar pinned above tab bar/keyboard, attach icon left, send button (circular, `--accent`) right, disabled/gray until text entered.

## 7. Badges & Status Pills

| State family | Color token | Examples |
|---|---|---|
| Positive | `--success` / `--success-soft` | VERIFIED, ACTIVE, RENTED, ACCEPTED, COMPLETED |
| Neutral/pending | `--warning` / `--warning-soft` | PENDING_REVIEW, PAUSED, NEW, REQUESTED |
| Negative | `--danger` / `--danger-soft` | REJECTED, EXPIRED, DECLINED, CANCELLED, NO_SHOW |
| Informational | `--info` | CONTACTED, VIEWING_REQUESTED, NEGOTIATING |

Pill shape: `--radius-pill`, `--caption` text weight 600, 4px vertical / 10px horizontal padding, soft-tinted background with full-strength text color (never full-strength background with white text for status pills — reserve solid fills for primary buttons).

## 8. Empty / Loading / Skeleton States

- Skeleton cards mirror the real card's glass shape with an animated shimmer gradient sweeping left→right, respecting the 2-column mobile grid.
- Empty state block: centered icon in a large `--accent-soft` circle, Headline text, Subheadline supporting text, primary button.

## 9. Component-to-Token Checklist (use before shipping any new component)

- [ ] Background uses a `--glass-*` token, not a flat solid color.
- [ ] Corner radius pulled from the radius scale, never a hardcoded pixel value.
- [ ] Text colors from the `--text-*` hierarchy, verified for contrast over the busiest background it'll sit on.
- [ ] Touch targets ≥44px.
- [ ] Press/hover state uses the standard 200ms iOS ease curve.
- [ ] Works unchanged inside both the mobile shell (tab bar/sheets) and desktop shell (sidebar/toolbar) — no component should need a role- or page-specific visual override.
- [ ] Card-type components respect the 2-per-row mobile grid rule.
