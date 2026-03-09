# 🛠️ Hack Club Site — Copilot Co-Programming Context

> **Read this file before writing any code, component, or page.**  
> This is your single source of truth for design system, branding, structure, and conventions.  
> When creating any new feature, route, component, or section — re-read the relevant section here first.

---

## 📁 Project Overview

This is a **marketing website for a Hack Club chapter**, built with **Astro**.  
It is a public-facing site intended to recruit members, showcase events/workshops, and build credibility.  
Every page must feel polished, tech-savvy, and energizing — this is not a blog or documentation site.

**Framework:** Astro (static-first, islands architecture)  
**Styling:** `@hackclub/theme` CSS (`css.hackclub.com/theme.css`) as the base design system + Tailwind utilities for layout  
**Icons:** `@hackclub/icons` (npm package) — always prefer these over any other icon library  
**Font:** Phantom Sans (Hack Club brand font — see font imports below)  
**Deployment target:** Vercel or Netlify (static output)

---

## 🎨 Brand & Design System

### ⚠️ CRITICAL RULES — CHECK THESE EVERY TIME YOU CREATE A COMPONENT

1. **Never write "hackclub", "Hackclub", "HackClub", or "hackClub"** — always `Hack Club` (two words, both capitalized).
2. **The Orpheus dinosaur logo must appear on every page** — use the flag SVG in the nav.
3. **All colors must use `@hackclub/theme` CSS variables** — no hardcoded hex values, no custom color variables.
4. **All UI components must use `@hackclub/theme` classes first** — cards use `.card`, buttons use `<button>` with `.cta`/`.outline`/`.lg`, badges use `.pill`/`.outline-badge`, layout uses `.container`.
5. **Phantom Sans is the primary typeface** — loaded from Hack Club's CDN via `@font-face` in `src/styles/fonts.css`.
6. **Dark background is the default theme** — override theme defaults to `var(--darker)` as the page background.
7. **Every page needs its own hero section** — no page should begin without a full-width hero.
8. **Every page must have multiple content sections** — minimum 3 sections below the hero.

---

### 🎨 Color System — `@hackclub/theme`

**Never define your own color variables.** All colors come from `@hackclub/theme` via `css.hackclub.com/theme.css`. Use the variables below — they are already declared globally once the stylesheet is loaded.

**Brand colors:**
```
var(--red)     → #ec3750   ← primary accent, CTAs
var(--orange)  → #ff8c37
var(--yellow)  → #f1c40f
var(--green)   → #33d6a6
var(--cyan)    → #5bc0de
var(--blue)    → #338eda
var(--purple)  → #a633d6
var(--muted)   → #8492a6
```

**Semantic / layout colors (also from the theme):**
```
var(--darker)     → #121217   ← deepest background (use for page bg in dark mode)
var(--dark)       → #17171d   ← secondary dark background
var(--darkless)   → #252429   ← card / surface backgrounds
var(--black)      → #1f2d3d   ← default text color (light mode)
var(--slate)      → #3c4858
var(--muted)      → #8492a6   ← secondary text
var(--smoke)      → #e0e6ed   ← borders, dividers
var(--snow)       → #f9fafc
var(--white)      → #ffffff

var(--primary)    → #ec3750   ← alias for red, use for all primary actions
var(--secondary)  → #8492a6
var(--accent)     → #5bc0de   ← theme's accent (cyan) — note: theme uses cyan here
var(--background) → var(--white) by default — override to var(--darker) for dark pages
var(--elevated)   → var(--white) by default — override to var(--darkless)
var(--sunken)     → var(--smoke) by default — override to var(--dark)
var(--border)     → var(--smoke) by default — override to a darker value
var(--text)       → var(--black) by default — override to var(--white) for dark mode
```

**Dark mode override — add to `src/styles/global.css`:**
```css
/* Override theme defaults to dark mode for this site */
:root {
  --background: var(--darker);
  --elevated:   var(--darkless);
  --sunken:     var(--dark);
  --border:     #2a2a2a;
  --text:       var(--white);
}
```

**Usage rules:**
- Primary CTAs → `var(--primary)` (red) with white text
- Secondary CTAs → `.outline` button class (see Buttons below)
- Hero gradient accents → `linear-gradient(135deg, var(--red), var(--orange))`
- Section accent stripes → rotate through brand colors, vary per section
- Never use more than 2 brand colors in a single component
- Never hardcode hex values — always use theme variables

---

### 🔤 Typography & Font Setup

**Primary font:** Phantom Sans (Hack Club brand font)  
**Fallback stack:** `'Phantom Sans', 'Helvetica Neue', Arial, sans-serif`

**Step 1 — Link both theme stylesheets in `src/layouts/BaseLayout.astro` `<head>`:**

```html
<!-- @hackclub/theme base styles (colors, components, typography) -->
<link rel="stylesheet" href="https://css.hackclub.com/theme.css">
<!-- Phantom Sans font — loaded via Hack Club CDN -->
<link rel="stylesheet" href="https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff2">
```

> The theme stylesheet already sets `font-family` on body elements. The fonts stylesheet loads Phantom Sans from Hack Club's CDN — this is permitted for chapter sites.

**Step 2 — Declare font faces in `src/styles/fonts.css` using Hack Club's CDN:**

```css
/* src/styles/fonts.css */
@font-face {
  font-family: 'Phantom Sans';
  src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff') format('woff'),
       url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Phantom Sans';
  src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff') format('woff'),
       url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Phantom Sans';
  src: url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff') format('woff'),
       url('https://assets.hackclub.com/fonts/Phantom_Sans_0.7/Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**Step 3 — Import in `src/styles/global.css` and wire into Tailwind:**

```css
/* src/styles/global.css */
@import './fonts.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Phantom Sans', 'Helvetica Neue', Arial, sans-serif;
  }
}
```

**Step 4 — Register in `tailwind.config.mjs` so `font-sans` and `prose` inherit Phantom Sans:**

```js
// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme'
import typography from '@tailwindcss/typography'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Phantom Sans', ...defaultTheme.fontFamily.sans],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: { fontFamily: theme('fontFamily.sans').join(', ') },
        },
      }),
    },
  },
  plugins: [typography],
}
```

**Type scale — use `@hackclub/theme` font size variables OR Tailwind `text-*` classes:**

| Theme Variable | Tailwind Class | Size   | Usage                          |
|----------------|----------------|--------|--------------------------------|
| `var(--font-1)` | `text-xs`     | 12px   | Labels, badges, captions       |
| `var(--font-2)` | `text-base`   | 16px   | Primary body text              |
| `var(--font-3)` | `text-xl`     | 20px   | Lead paragraph, card text      |
| `var(--font-4)` | `text-2xl`    | 24px   | Card headings                  |
| `var(--font-5)` | `text-3xl`    | 32px   | Section headings               |
| `var(--font-6)` | `text-5xl`    | 48px   | Page headings                  |
| `var(--font-7)` | `text-7xl`    | 96px   | Hero display text              |

For Markdown/MDX content (blog posts, workshop descriptions) wrap in `prose prose-invert` — inherits Phantom Sans via Tailwind typography config.

**Theme heading classes (use on `<h*>` tags):**
- `.ultratitle` — very large display title
- `.title` — moderately large title  
- `.subtitle` — smaller title
- `.headline` — for use in large text bodies (has built-in margins)
- `.subheadline` — smaller version of `.headline`
- `.eyebrow` — gray, all-caps label for section intros
- `.lead` — font-weight 400 variant
- `.caption` — image captions

---

### 🖼️ Logos & Assets

Always load logos directly from Hack Club's CDN:

```
Primary Logo (nav):      https://assets.hackclub.com/flag-orpheus-left.svg
Flag Top (banner embed): https://assets.hackclub.com/flag-orpheus-top.svg
Icon only (favicon):     https://assets.hackclub.com/icon-rounded.svg
Icon square:             https://assets.hackclub.com/icon-square.svg
B/W version (dark bg):   https://assets.hackclub.com/flag-orpheus-left-bw.svg
```

**Never** embed or download these files locally — always use the CDN URLs.  
Use `flag-orpheus-left.svg` in the navbar (standard horizontal orientation).  
Use `icon-rounded.svg` as the favicon and any compact icon usage.

---

### 💎 Icons

Install and use `@hackclub/icons`:

```bash
npm install @hackclub/icons
```

```astro
---
// In .astro files — use the React components or raw SVG
import Icon from '@hackclub/icons'
---
<Icon glyph="github" size={24} />
```

Browse all icons at: https://icons.hackclub.com  
Common glyphs: `github`, `slack`, `twitter`, `code`, `star`, `members`, `event`, `home`, `heart`, `flag`

---

## 🏗️ Layout & UI Structure Reference

> The visual structure is inspired by **Framer.com** — a dark, editorial, tech-product marketing site.  
> Study these structural patterns and apply them to every page.

### Global Layout Patterns

```
┌─────────────────────────────────────────┐
│  NAVBAR (sticky, frosted glass effect)  │
│  Logo left │ Nav links center │ CTA right│
├─────────────────────────────────────────┤
│  HERO (full viewport height, 100vh)     │
│  - Large display headline               │
│  - Subtitle paragraph                   │
│  - 2 CTA buttons (primary + secondary)  │
│  - Decorative visual (grid/cards/art)   │
├─────────────────────────────────────────┤
│  SOCIAL PROOF / LOGO STRIP              │
│  (partner schools, events, sponsors)    │
├─────────────────────────────────────────┤
│  FEATURE SECTIONS (alternating layout)  │
│  Left text + Right visual, then flip    │
├─────────────────────────────────────────┤
│  BENTO GRID / CARD GRID                 │
│  (2-4 column feature cards)             │
├─────────────────────────────────────────┤
│  TESTIMONIALS / QUOTES                  │
├─────────────────────────────────────────┤
│  CTA BANNER (full-width, accent bg)     │
├─────────────────────────────────────────┤
│  FOOTER                                 │
└─────────────────────────────────────────┘
```

### Navbar Component Rules

```astro
<!-- src/components/Navbar.astro -->
```

- **Always sticky** — `position: sticky; top: 0; z-index: 100`
- **Frosted glass** — `backdrop-filter: blur(12px); background: rgba(10,10,10,0.8)`
- **Left:** Hack Club flag logo (`flag-orpheus-left.svg`), 140px wide
- **Center:** Nav links with hover underline animation in `--accent` red
- **Right:** "Join Us" button (filled red) + optional secondary link
- Border bottom: `1px solid var(--border-color)`
- On mobile: hamburger menu with slide-in drawer

### Hero Section Rules

Every hero **must** include:
1. A small eyebrow label (e.g. `// HACK CLUB CHAPTER`)  — styled as a badge or tag
2. A massive headline using `--text-hero` size, bold
3. A 1–2 sentence subtext in `--text-secondary`
4. Two buttons: primary (filled `--accent`) + secondary (ghost/outline)
5. A decorative visual element (could be: floating cards, code snippet, pixel art, terminal, grid of screenshots)
6. Subtle background: dot grid pattern, gradient mesh, or noise texture

**Hero background technique (CSS using theme variables):**
```css
.hero {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(236, 55, 80, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(51, 214, 166, 0.06) 0%, transparent 50%),
    var(--darker);
  padding: var(--spacing-6) 0;
}
/* Optional dot grid overlay */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, var(--darkless) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.4;
  pointer-events: none;
}
```

### Card / Bento Grid Rules

**Use `@hackclub/theme` card classes — do not hand-roll card styles:**

```html
<!-- Standard card -->
<div class="card">...</div>

<!-- Card without shadow, uses --sunken color -->
<div class="card sunken">...</div>

<!-- Clickable card that grows on hover -->
<div class="card interactive">...</div>
```

Bento grids use `display: grid` with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`.  
Feature bento: use asymmetric grids where one card spans 2 columns for visual hierarchy.  
Add `gap: var(--spacing-3)` between cards (uses theme spacing tokens).

### Button System

**Use `@hackclub/theme` button elements — do not write custom button CSS:**

```html
<!-- Default filled button (uses --primary color automatically) -->
<button>Join the Club</button>

<!-- Large button -->
<button class="lg">Join the Club</button>

<!-- Outline / ghost button -->
<button class="outline">Learn More</button>

<!-- High-emphasis CTA with gradient background -->
<button class="cta">Start Hacking →</button>
```

**Pairing for hero sections** — primary + secondary side by side:
```html
<button class="lg cta">Join the Club</button>
<button class="lg outline">See Our Workshops</button>
```

> Never write `.btn-primary`, `.btn-ghost`, or any custom button classes — the theme handles all button variants natively on `<button>` elements.

### Badge / Pill System

```html
<!-- Standard filled badge -->
<span class="pill">Beginner</span>

<!-- Outline badge -->
<span class="outline-badge">Python</span>
```

Use `.pill` for difficulty levels, event types, and status labels.  
Use `.outline-badge` for tech stack tags and topic filters.

### Container / Layout System

```html
<!-- Full layout width (1024px) -->
<div class="container">...</div>

<!-- Wide (1536px) -->
<div class="container wide">...</div>

<!-- Readable text width (680px) — for blog/workshop content -->
<div class="container copy">...</div>

<!-- Narrow (512px) — for forms, modals -->
<div class="container narrow">...</div>
```

Use theme spacing tokens for padding and gaps:
```
var(--spacing-1) → 4px
var(--spacing-2) → 8px
var(--spacing-3) → 16px   ← standard component padding
var(--spacing-4) → 32px   ← section inner padding
var(--spacing-5) → 64px   ← section vertical spacing
var(--spacing-6) → 128px  ← hero vertical padding
```
```

---

## 📄 Pages — Structure & Content Requirements

### `/` — Home

**Hero:** "Build the future, together." — Big bold headline. Subtext about Hack Club being a community for teen hackers. Two CTAs: "Join the Club" + "See Our Workshops".  
**Sections:**
1. Logo/partner strip (hackathons, schools, sponsors)
2. Feature split: "Learn by building" (code + workshops)
3. Feature split: "A global community" (Slack, events)
4. Bento grid: Club benefits (free hardware, grants, mentors, hackathons)
5. Recent events/workshops masonry grid
6. Testimonial quotes from members
7. CTA banner: "Ready to hack?" with join link

---

### `/about`

**Hero:** "Who we are." — Mission statement hero.  
**Sections:**
1. Our story — text + timeline
2. Values (open source, learn by doing, community-first)
3. Team grid (member cards with name, role, avatar)
4. Club stats (members, workshops run, events held, countries)
5. Backed by / affiliated with (Y Combinator, Hack Club HQ)
6. CTA: Join us

---

### `/events`

**Hero:** "Something's always happening." — Events listing page hero.  
**Sections:**
1. Upcoming events grid (card per event: date, title, location, register button)
2. Past events gallery (masonry or grid of screenshots/photos)
3. Hackathons we've run / attended
4. "Host your own" CTA section
5. Newsletter signup strip

---

### `/workshops`

**Hero:** "Learn something new every week." — Workshops showcase page.  
**Sections:**
1. Featured workshop spotlight (large card, 1–2 items — e.g. "Build a Personal Site in 1 Hour")
2. Workshops grid (card: workshop title, description, difficulty badge, tech stack, duration, GitHub/Jams link)
3. Technologies covered (tech logo strip: React, Python, Rust, p5.js, etc.)
4. "Suggest a workshop" CTA

---

### `/join`

**Hero:** "Start your hacker journey." — Recruitment/onboarding page.  
**Sections:**
1. Step-by-step join process (numbered steps with icons)
2. FAQ accordion
3. What you'll get (benefits list as icon cards)
4. Slack community preview / invite widget
5. Final CTA: "I'm in" button

---

### `/blog` *(optional)*

**Hero:** "Dispatches from the club."  
**Sections:**
1. Featured post (large card)
2. All posts grid
3. Topics/tags filter strip

---

## ⚙️ Astro-Specific Conventions

### File & Folder Structure

```
src/
  components/
    Navbar.astro
    Footer.astro
    Hero.astro          ← reusable with props: title, subtitle, cta
    Card.astro
    Button.astro
    Badge.astro
    SectionHeader.astro ← eyebrow + heading + subtext
  layouts/
    BaseLayout.astro    ← global head, fonts, nav, footer
    PageLayout.astro    ← wraps BaseLayout with page-level padding
  pages/
    index.astro
    about.astro
    events.astro
    workshops.astro
    join.astro
    blog/
      index.astro
      [slug].astro
  styles/
    global.css          ← CSS vars, reset, base styles
    typography.css
  content/
    events/             ← Markdown/MDX content collections
    workshops/
    blog/
```

### Component Props Pattern

```astro
---
// Always type your props
interface Props {
  title: string;
  subtitle?: string;
  accent?: 'red' | 'green' | 'blue' | 'orange';
}
const { title, subtitle, accent = 'red' } = Astro.props;
---
```

### Content Collections

Use Astro Content Collections for events, workshops, and blog posts.  
Define schemas in `src/content/config.ts`.

---

## ✅ Pre-Commit Checklist (run through this before finishing any feature)

- [ ] "Hack Club" is spelled correctly everywhere (not hackclub/HackClub/etc.)
- [ ] All colors use `@hackclub/theme` CSS variables — no hardcoded hex values
- [ ] Buttons use `<button>` with theme classes (`.cta`, `.outline`, `.lg`) — no custom button CSS
- [ ] Cards use `.card`, `.card.interactive`, or `.card.sunken` — no custom card CSS
- [ ] Badges use `.pill` or `.outline-badge` — no custom badge CSS
- [ ] Layout uses `.container`, `.container.wide`, `.container.copy`, etc.
- [ ] Phantom Sans loaded from Hack Club CDN via `src/styles/fonts.css`
- [ ] `css.hackclub.com/theme.css` linked in `BaseLayout.astro` `<head>`
- [ ] Logo loaded from `assets.hackclub.com` CDN (not local)
- [ ] Page background overridden to `var(--darker)` in `global.css`
- [ ] Page has a hero section
- [ ] Page has 3+ sections below the hero
- [ ] All interactive elements have hover states
- [ ] Mobile responsive — test at 375px, 768px, 1280px breakpoints
- [ ] No `console.log` left in production code
- [ ] Semantic HTML used (proper heading hierarchy: h1 → h2 → h3)
- [ ] Images have `alt` text
- [ ] CTA buttons present on every page

---

## 🚫 Anti-Patterns — Never Do These

| ❌ Don't                                          | ✅ Do Instead                                        |
|--------------------------------------------------|-----------------------------------------------------|
| Write "hackclub" as one word                     | Always write "Hack Club"                            |
| Use hardcoded hex colors like `#ec3750`          | Use `var(--red)` or `var(--primary)` from theme     |
| Define custom color variables (`--my-bg`)        | Use `@hackclub/theme` variables exclusively         |
| Write custom `.btn-primary` / `.btn-ghost` CSS   | Use `<button>`, `<button class="cta">`, `<button class="outline">` |
| Write custom `.card { border-radius: ... }` CSS  | Use `.card`, `.card.interactive`, `.card.sunken`    |
| Write custom badge/pill CSS                      | Use `.pill` and `.outline-badge` from theme         |
| Use Inter, Roboto, or system-ui fonts            | Use Phantom Sans via CDN `@font-face`               |
| Host logo files locally                          | Load from `assets.hackclub.com`                     |
| Create pages without heroes                      | Every page needs a hero                             |
| Use purple gradient on white (generic AI look)   | Use `var(--darker)` bg with `var(--primary)` accent |
| Use generic icon libraries (FontAwesome)         | Use `@hackclub/icons`                               |
| Skip mobile responsiveness                       | Mobile-first, always                                |
| Invent new spacing values                        | Use `var(--spacing-1)` through `var(--spacing-8)`   |
| Add unnecessary JavaScript                       | Prefer CSS-only animations, Astro static output     |

---

## 🔗 External Resources

| Resource                  | URL                                                   |
|---------------------------|-------------------------------------------------------|
| Hack Club Brand Guide     | https://hackclub.com/brand                            |
| Hack Club Icons Explorer  | https://icons.hackclub.com                            |
| Hack Club Theme (CSS)     | https://theme.hackclub.com                            |
| Hack Club Theme on GitHub | https://github.com/hackclub/css                       |
| Hack Club Icons (npm)     | https://github.com/hackclub/icons                     |
| Assets CDN                | https://assets.hackclub.com                           |
| Hack Club Slack (join)    | https://hackclub.com/slack                            |
| Hack Club HQ              | https://hackclub.com                                  |

---

*Last updated: project kickoff. This file is authoritative — if you're unsure about a design decision, the answer is in here.*