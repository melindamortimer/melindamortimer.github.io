# Homepage Redesign Spec

Redesign `index.html` to adopt the "Minimalist Developer Portfolio" Stitch template, replacing placeholder content with real projects.

## Source Material

- **Stitch project:** Portfolio Landing Page (ID: 15731994343600340057)
- **Stitch screen:** Minimalist Developer Portfolio (ID: 108e782274be4662aff089cc42aa7709)
- **Reference HTML:** Downloaded to `/tmp/stitch-minimalist.html` (241 lines)

## Tech Stack

- **Tailwind CSS via CDN** (`cdn.tailwindcss.com`) with custom color config from Stitch design system
- **Fonts:** Space Grotesk (headlines), Inter (body), JetBrains Mono (monospace accents) via Google Fonts
- **No build step** — single `index.html` file, served by GitHub Pages
- **No external dependencies** beyond CDN links

## Design System (from Stitch)

Adopt the full Stitch color system as Tailwind config:

| Token | Hex | Usage |
|---|---|---|
| `surface` | `#0b1326` | Page background |
| `surface-container` | `#171f33` | Card backgrounds |
| `surface-container-low` | `#131b2e` | Project section background |
| `surface-container-high` | `#222a3d` | Hover states |
| `surface-container-highest` | `#2d3449` | Active/elevated states |
| `primary` | `#c0c1ff` | Primary accent (indigo) |
| `primary-container` | `#8083ff` | Gradient end, button hover |
| `secondary` | `#4cd7f6` | Cyan accent |
| `on-surface` | `#dae2fd` | Primary text |
| `on-surface-variant` | `#c7c4d7` | Secondary text |
| `outline-variant` | `#464554` | Subtle borders |

### Typography

- Headlines: Space Grotesk, bold, tight tracking
- Body: Inter
- Monospace accents: JetBrains Mono, uppercase, wide tracking

### Effects

- **Glassmorphism nav:** `rgba(11, 19, 38, 0.7)` background + `backdrop-filter: blur(20px)`
- **Text gradient:** `linear-gradient(135deg, #c0c1ff, #8083ff)` with `-webkit-background-clip: text`
- **Card hover:** Background shifts from `surface-container` to `surface-container-highest`, 500ms transition
- **Image hover:** Grayscale + low opacity at rest, color + higher opacity on hover, 700ms transition

## Sections

### 1. Nav Bar

Fixed glassmorphism nav, full width.

| Position | Content | Behavior |
|---|---|---|
| Left | "MELINDA MORTIMER" | Bold, headline font, text color `on-surface` |
| Center | "GitHub" link, "LinkedIn" link | Uppercase, tracking-widest, small text. GitHub → `https://github.com/melindamortimer`. LinkedIn → `https://www.linkedin.com/in/melinda-mortimer-502a8795/` |
| Right | "Resume" button | Primary background, links to `#` (placeholder) |

### 2. Hero Section

Left-aligned, below nav with `pt-32` spacing.

- **Subtitle:** "Senior Data Scientist" — monospace, cyan (`secondary`), small, uppercase, wide tracking
- **Headline:** Two lines:
  - Line 1: "MELINDA" — gradient text treatment (`primary` to `primary-container`)
  - Line 2: "MORTIMER" — standard `on-surface` color
  - Font: Space Grotesk, bold, `text-5xl md:text-7xl`, tight leading and tracking

No stats cards. No additional body text.

### 3. Project Grid

Background: `surface-container-low`. Padded section with `py-24`.

**Section header row:**
- Left: "Featured Projects" — headline font, bold, uppercase
- Right: "Follow on GitHub" link → `https://github.com/melindamortimer` with arrow icon, cyan color

**Grid:** `grid-cols-12` on desktop, single column on mobile. Gap of `1.5rem`.

#### Card 1: Rubik's Timer (top-left, 8 cols)

- **Element:** `<a href="https://rubikstimer.io/" target="_blank" rel="noopener noreferrer">`
- **Image:** `images/back-rubix.png`, `aspect-[16/9]`, grayscale/opacity hover effect
- **Title:** "Rubik's Timer"
- **Description:** "A speedcubing timer with scramble generation, session tracking, and solve statistics"
- No tech chips, no sub-links

#### Card 2: CentrePass.io (top-right, 4 cols)

- **Element:** `<a href="https://www.centrepass.io" target="_blank" rel="noopener noreferrer">`
- **Image:** `images/back-centrepass.png` at bottom of card (like Stitch `aspect-square` pattern)
- **Title:** "CentrePass.io"
- **Description:** "Netball fixtures, results, and player statistics all in one place"
- No tech chips, no sub-links

#### Card 3: Pokemon Team Battle (bottom-left, 6 cols)

- **Element:** `<a href="pokemon-team-builder/index.html">`
- **No image** — text-only card
- **Title:** "Pokemon Team Battle"
- **Description:** "Build and rank two Pokemon teams based on their total stats"
- No tech chips, no sub-links, no Material Symbols icon

#### Card 4: DS Model Template (bottom-right, 6 cols)

- **Element:** `<a href="https://github.com/melindamortimer/ds-model-template" target="_blank" rel="noopener noreferrer">`
- **No image** — text-only card
- **Title:** "DS Model Template"
- **Description:** "A reusable template for data science model development, packaging, and deployment"
- No tech chips, no sub-links, no Material Symbols icon

#### Card styling

All cards:
- `rounded-xl`, `bg-surface-container`
- Hover: `bg-surface-container-highest`, 500ms transition
- Full card is the clickable `<a>` element (block display)
- `text-decoration: none`, inherit text colors

Image cards additionally:
- Images start grayscale + 40% opacity
- On hover: full color + 60% opacity, 700ms transition
- Image scale: `scale-105` at rest, `scale-100` on hover (subtle zoom-out effect)

### 4. Footer

Simple, below the project grid. `border-t border-outline-variant/15`.

**Content:** Centered row of links only:
- "GitHub" → `https://github.com/melindamortimer`
- "LinkedIn" → `https://www.linkedin.com/in/melinda-mortimer-502a8795/`

Styled as monospace, tiny uppercase, wide tracking (matching Stitch footer link style). Hover color: `secondary` (cyan).

No copyright line. No status indicator.

## Removed from Stitch Template

These Stitch elements are intentionally excluded:
- "ALGO_EDIT" branding
- "System.init()" subtitle text
- Stats cards (Stars, Repos, Open Source)
- Tech chips on all project cards
- Separate text links inside cards (Repository, Live Demo, View Source, etc.)
- Material Symbols icons on text-only cards
- Skills section (Distributed Systems, Machine Learning, Low-Level Dev)
- CTA section ("Ready to deploy the next evolution?")
- Copyright line in footer
- "System Status: Online" indicator
- All placeholder project content (NEURAL_SYNC_V4, KRYPTOS_ENGINE, VOID_MESH, QUANT_VISION)
- Placeholder images from Google CDN

## Responsive Behavior

Adopt Stitch template's responsive approach:
- **Desktop:** 12-col grid, horizontal nav, side-by-side hero
- **Mobile (`md:` breakpoint):** Single column grid, stacked cards, nav links hidden behind `hidden md:flex`

## File Changes

- **Modified:** `index.html` — full rewrite from 154-line plain CSS to Tailwind-based template
- **No new files** — remains a single-file page
- **Existing assets used:** `images/back-rubix.png`, `images/back-centrepass.png`
- **Unused assets:** `images/back-pokemon.png`, `images/back-ds-template.png` (not referenced by new design)

## Placeholders to Fill Later

| Element | Current Value | Action Needed |
|---|---|---|
| Resume button | `#` | Replace with resume URL or PDF link |
