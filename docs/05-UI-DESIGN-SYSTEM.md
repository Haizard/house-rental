# UI Design System — iOS Native Glassmorphism

## 1. Design Direction (non-negotiable)

The product must feel like a **native iOS app wearing a web app's clothes**. On mobile, a user should not be able to tell whether this is a website or an installed iOS app. On large screens, it should feel like a native **iOS/macOS desktop app** (think Mail, Music, or Settings on macOS): a frosted sidebar, vibrancy, soft depth, rounded surfaces.

Hard constraints from the brief:
- **Background is never black or dark.** The base canvas is always light, airy, and bright.
- **Glassmorphism + transparency everywhere** — cards, nav bars, sheets, buttons, inputs, modals all use frosted-glass surfaces layered over the light background, not flat opaque fills.
- **Applies uniformly**: every page, container, component, form, button, and layout follows the same system — no page should look like it belongs to a different app.
- **Mobile grids show exactly 2 cards per row** (see `04-UI-STRUCTURE.md §8`).

## 2. Color System

Base canvas is a soft, light, slightly warm-neutral gray-blue — never white-flat, never dark. Glass surfaces sit on top of it so blur/transparency is actually visible (pure white backgrounds make glassmorphism invisible).

### 2.1 Core tokens (CSS variables — put in `globals.css`)

```css
:root {
  /* Base canvas — always light, never black/dark */
  --bg-base: #F2F4F8;
  --bg-base-alt: #EAEFF6;          /* secondary sections, slightly cooler */
  --bg-gradient: linear-gradient(180deg, #F6F8FC 0%, #E9EEF7 100%);

  /* Glass surfaces */
  --glass-fill: rgba(255, 255, 255, 0.55);
  --glass-fill-strong: rgba(255, 255, 255, 0.72);
  --glass-fill-subtle: rgba(255, 255, 255, 0.35);
  --glass-border: rgba(255, 255, 255, 0.6);
  --glass-border-hairline: rgba(60, 60, 67, 0.12);   /* iOS separator equivalent */
  --glass-blur: 20px;
  --glass-blur-strong: 32px;
  --glass-shadow: 0 8px 32px rgba(31, 41, 55, 0.08), 0 1px 2px rgba(31, 41, 55, 0.04);

  /* Brand / accent — iOS-blue derived, used sparingly & consistently */
  --accent: #0A84FF;         /* iOS system blue (light mode) */
  --accent-pressed: #0670E0;
  --accent-soft: rgba(10, 132, 255, 0.14);   /* tinted glass fill for selected states */

  /* Secondary accents (status, category) — iOS system palette */
  --success: #34C759;
  --success-soft: rgba(52, 199, 89, 0.14);
  --warning: #FF9F0A;
  --warning-soft: rgba(255, 159, 10, 0.16);
  --danger: #FF3B30;
  --danger-soft: rgba(255, 59, 48, 0.14);
  --info: #5AC8FA;

  /* Text — iOS label hierarchy, dark text on light glass (never dark backgrounds) */
  --text-primary: rgba(28, 28, 30, 0.92);     /* iOS label */
  --text-secondary: rgba(60, 60, 67, 0.68);   /* iOS secondaryLabel */
  --text-tertiary: rgba(60, 60, 67, 0.42);    /* iOS tertiaryLabel */
  --text-on-accent: #FFFFFF;

  /* Verification / trust badges */
  --verified: #34C759;
  --agent-verified: #5AC8FA;
  --unverified: #8E8E93;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-pill: 999px;
}
```

### 2.2 Rules
- Never use `#000000`/near-black as a page or container background — dark text, never dark surfaces.
- Every elevated surface (card, nav bar, tab bar, sheet, modal, dropdown, toast) uses a `--glass-*` token with `backdrop-filter: blur(...)`, not a solid opaque fill.
- Accent color (`--accent`) is used for primary actions, active nav states, and links only — not decoratively.
- Status colors map 1:1 to backend enums: `success`=RENTED/ACTIVE/VERIFIED/ACCEPTED/COMPLETED, `warning`=PENDING_REVIEW/PAUSED/NEW lead, `danger`=REJECTED/EXPIRED/DECLINED/CANCELLED, `info`=CONTACTED/VIEWING_REQUESTED.

## 3. Glassmorphism Mechanics

Every glass surface follows the same recipe so the app feels consistent:

```css
.glass-surface {
  background: var(--glass-fill);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.6);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.6);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
}
```

- **Layering**: base canvas → gradient wash → glass surface → content. Never stack two glass layers directly on each other without at least 8px of visible base canvas between them, or the blur reads as muddy gray instead of "frosted."
- **Saturate(1.6)** is intentional — it's what makes iOS vibrancy look alive instead of flat gray glass.
- **Strong vs. subtle glass**: nav bars/tab bars/modals use `--glass-fill-strong` (more opaque, for legibility over scrolling content). Cards at rest use `--glass-fill`. Decorative/background panels use `--glass-fill-subtle`.
- **Borders are hairline, translucent white**, never a hard gray stroke — this is what sells the "glass edge catching light" effect.
- Respect `prefers-reduced-motion` and provide a `backdrop-filter` fallback (`background: var(--glass-fill-strong)` at higher opacity) for browsers/devices without blur support.

## 4. Typography

Use the native iOS system font stack so type rendering matches the OS exactly:

```css
--font-family: -apple-system, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif;
```

| Style | Size / weight | Use |
|---|---|---|
| Large Title | 34px / 700 | Page top on mobile (collapses on scroll) |
| Title 1 | 28px / 700 | Section headers, desktop page titles |
| Title 2 | 22px / 600 | Card group headers |
| Headline | 17px / 600 | Card titles, list row primary text |
| Body | 17px / 400 | Default paragraph/content text |
| Subheadline | 15px / 400 | Secondary card text, metadata |
| Footnote | 13px / 400 | Timestamps, captions |
| Caption | 12px / 400 | Badge labels, tiny meta |

- Line height: 1.3–1.4 for headline/body, 1.15 for large titles.
- Tracking: default; do not letter-space body text (not iOS-native).
- Numbers (prices, ratings) may use tabular figures for alignment in lists.

## 5. Spacing & Radius

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

- Card internal padding: `--space-4` (mobile) / `--space-5` (desktop).
- Page horizontal margin: `--space-4` (mobile) / `--space-8`+ (desktop, capped content width ~1200px).
- Corner radius scale: small controls (chips, inputs) = `--radius-sm`; cards/buttons = `--radius-md`; sheets/modals/large cards = `--radius-lg`; pills (tags, tab segments) = `--radius-pill`. **Never use 0 or sharp corners** — everything is native-iOS-rounded.

## 6. iOS Interaction Patterns to Replicate

| Pattern | Where used | Behavior |
|---|---|---|
| Large-title nav bar | Top of every mobile tab/page | Large title on top of scroll; collapses to centered small title + blurred bar once content scrolls under it |
| Bottom tab bar | Student/Agent/Admin mobile shells | 4–5 glass tab items, active tab tinted `--accent`, icon+label, safe-area aware |
| Sidebar (vibrancy) | Desktop student/agent/admin shells | Frosted glass, sits over the gradient canvas, active item gets `--accent-soft` pill background |
| Segmented control | Filter toggles, lead-status switch | Pill-shaped glass track, sliding selected segment |
| Action sheet | Mobile "more actions" (report, share, cancel) | Rises from bottom, glass surface, destructive actions in `--danger` |
| Bottom sheet / modal | Filters, viewing request form, lead intake | Rounded top corners (`--radius-lg`), drag handle bar, glass background, dims canvas behind with a **light** scrim (`rgba(242,244,248,0.6)`), never a black scrim |
| Pull-to-refresh | Listing feeds, lead lists, chat list | Native iOS bounce + spinner |
| Swipe actions | Chat list, lead list rows | Swipe-left reveals contextual actions (Archive, Mark read) with rounded action chips |
| Toast / banner | Success/error confirmation | Top-of-screen glass pill banner, auto-dismiss, iOS-style |
| Haptic-equivalent feedback | Button press, toggle | Visual: 96% scale-down + opacity dip on press (150ms ease-out) simulating haptic tap |

## 7. Responsive Strategy

| Breakpoint | Pattern |
|---|---|
| `<768px` (mobile) | Full native-iOS pattern: bottom tab bar, large-title nav, push navigation, sheets/action sheets, 2-column card grids |
| `768–1024px` (tablet) | Collapsible icon-rail sidebar (iPadOS-style), 3-column grids, large-title behavior retained |
| `≥1024px` (desktop/large screen) | Fixed frosted sidebar + toolbar, "iOS desktop app" split-view feel, 3–4 column grids, hover states added (not present on touch) |

Desktop must still feel like an Apple-made desktop app — not a generic dashboard. Reference points: macOS Mail's sidebar + list + detail split view, and macOS Settings' rounded grouped sections.

## 8. Card Grid Density Rule

- **Mobile: 2 cards per row, always**, for any collection of listing/agent/property/summary cards. Use CSS grid: `grid-template-columns: repeat(2, 1fr); gap: var(--space-3);`
- Card content on mobile at 2-per-row must stay legible: image aspect ratio 4:3, title clamps to 2 lines, price prominent, verification badge as a small pill overlay on the image top-left.
- Tablet: `repeat(3, 1fr)`. Desktop: `repeat(auto-fill, minmax(280px, 1fr))` capped at 4 columns in the main content area.

## 9. Motion

- Standard transition: `200ms cubic-bezier(0.25, 0.1, 0.25, 1)` (iOS "ease" curve) for hover/press/toggle.
- Push/pop navigation: `320ms` slide with slight parallax on the outgoing view (mirrors `UINavigationController`).
- Sheets: spring-like ease-out, `380ms`, translateY from 100% with slight overshoot damped to 0.
- Respect `prefers-reduced-motion: reduce` by cutting all of the above to opacity-only 120ms fades.

## 10. Accessibility Within a Glass System

- Maintain **4.5:1 contrast** for body text against the *busiest* background that text will ever sit over (test text-on-glass over the gradient canvas, not just over solid white).
- Never rely on glass blur alone to separate foreground/background — always pair with the hairline border and shadow tokens.
- Focus states: 2px `--accent` ring with 2px offset, visible on all interactive elements regardless of glass surface.
- Minimum touch target 44×44px (iOS HIG standard) on all buttons, tab items, and list rows.

## 11. Do / Don't Summary

**Do**
- Light, bright, layered backgrounds with visible blur/vibrancy.
- Consistent rounded geometry everywhere.
- Native iOS chrome patterns (large titles, tab bars, sheets, segmented controls).
- Same design tokens on every page/role/surface.

**Don't**
- Dark or black page backgrounds.
- Flat, opaque, non-blurred "card" surfaces that break the glass language.
- Sharp corners or web-generic dropdown/select styling.
- Per-page one-off styling that doesn't route through the shared tokens/components.
