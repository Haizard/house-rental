# Student Housing Marketplace — Documentation Set

Derived from `student_housing_marketplace_project_spec.md`, split into concrete, buildable references.

| Doc | Contents |
|---|---|
| [01-MVP.md](./01-MVP.md) | Product statement, MVP feature scope by role, what's explicitly out of scope, launch stages, success metrics, build-order phasing |
| [02-PROJECT-STRUCTURE.md](./02-PROJECT-STRUCTURE.md) | Tech stack, full repo/folder layout, architectural rules, runtime architecture |
| [03-DATABASE-STRUCTURE.md](./03-DATABASE-STRUCTURE.md) | Non-negotiable modeling rules, every core table with fields/enums, relationship diagram, indexing, financial auditability |
| [04-UI-STRUCTURE.md](./04-UI-STRUCTURE.md) | Information architecture per surface (Public/Student/Agent/Admin), cross-cutting flows, navigation pattern by device, card grid rule |
| [05-UI-DESIGN-SYSTEM.md](./05-UI-DESIGN-SYSTEM.md) | The iOS-native glassmorphism design language: color tokens, glass mechanics, typography, spacing, iOS interaction patterns, responsive strategy, accessibility |
| [06-COMPONENT-LIBRARY.md](./06-COMPONENT-LIBRARY.md) | Concrete component-by-component specs (buttons, cards, forms, nav, sheets, chat, badges) implementing the design system |

## How to use this set

1. Start with **01-MVP.md** to lock scope before writing code.
2. Set up the repo per **02-PROJECT-STRUCTURE.md**, then implement `prisma/schema.prisma` from **03-DATABASE-STRUCTURE.md**.
3. Build `components/ui/` first, straight from **05-UI-DESIGN-SYSTEM.md** tokens and **06-COMPONENT-LIBRARY.md** specs — every feature screen composes from this layer, nothing styles itself independently.
4. Build screens per **04-UI-STRUCTURE.md**, role by role, following the phased build order in 01-MVP.md §7.

## Design non-negotiables (quick reference)

- Base background is always **light** — never black or dark.
- Every elevated surface is **glass/translucent** (blur + soft transparency), consistently, across every page/component.
- Mobile feels **indistinguishable from a native iOS app**: bottom tab bar, large titles, sheets, push navigation.
- Large screens feel like a **native iOS/macOS desktop app**: frosted sidebar + toolbar, split-view feel.
- **Card grids show exactly 2 items per row on mobile**, everywhere, without exception.
