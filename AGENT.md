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
**Styling:** CSS custom properties + scoped component styles (no Tailwind unless already configured)  
**Icons:** `@hackclub/icons` (npm package) — always prefer these over any other icon library  
**Font:** Phantom Sans (Hack Club brand font — see font imports below)  
**Deployment target:** Vercel or Netlify (static output)

---

## 🎨 Brand & Design System

### ⚠️ CRITICAL RULES — CHECK THESE EVERY TIME YOU CREATE A COMPONENT

1. **Never write "hackclub", "Hackclub", "HackClub", or "hackClub"** — always `Hack Club` (two words, both capitalized).
2. **The Orpheus dinosaur logo must appear on every page** — use the flag SVG in the nav.
3. **All colors must use CSS variables** from the palette below — no hardcoded hex values in components.
4. **Phantom Sans is the primary typeface** — load it via the `@font-face` declarations in the global layout.
5. **Dark background is the default theme** — the reference site (Framer.com) uses a deep black (`#0a0a0a`) base. Match this energy.
6. **Every page needs its own hero section** — no page should begin without a full-width hero.
7. **Every page must have multiple content sections** — minimum 3 sections below the hero.

---

### 🎨 Color Palette

```css
:root {
  /* Hack Club Official Brand Colors */
  --color-red:     #ec3750;
  --color-orange:  #ff8c37;
  --color-yellow:  #f1c40f;
  --color-green:   #33d6a6;
  --color-cyan:    #5bc0de;
  --color-blue:    #338eda;
  --color-purple:  #a633d6;
  --color-muted:   #8492a6;

  /* Site Layout Colors */
  --bg-primary:    #0a0a0a;   /* Main page background — deep black */
  --bg-secondary:  #111111;   /* Card / section backgrounds */
  --bg-surface:    #1a1a1a;   /* Elevated surfaces, modals, tooltips */
  --border-color:  #2a2a2a;   /* Subtle borders */

  /* Text */
  --text-primary:  #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted:    #555555;

  /* Accent — the primary call-to-action color */
  --accent:        #ec3750;   /* Hack Club Red — use for CTAs, highlights, hover states */
  --accent-hover:  #d42d43;
}
```

**Usage rules:**
- Primary CTAs → `--accent` (red) with white text
- Secondary CTAs → transparent/outline with `--accent` border
- Section accent lines, underlines, highlights → any brand color, vary per section
- Never use more than 2 brand colors in a single component
- Gradient accents: `linear-gradient(135deg, var(--color-red), var(--color-orange))` for hero elements

---

### 🔤 Typography

**Primary font:** Phantom Sans (Hack Club brand font)  
**Fallback stack:** `'Phantom Sans', 'Helvetica Neue', Arial, sans-serif`

**Step 1 — Declare `@font-face` in `src/styles/fonts.css` using Hack Club's CDN:**

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

---

**Step 2 — Import in `src/styles/global.css` and set as base font:**

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

---

**Step 3 — Register in `tailwind.config.mjs` so `font-sans` and `prose` inherit it:**

```js
// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // Overrides Tailwind's default sans → font-sans class now uses Phantom Sans
        sans: ['Phantom Sans', ...defaultTheme.fontFamily.sans],
      },
      // Extend typography plugin so prose blocks use Phantom Sans too
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            fontFamily: theme('fontFamily.sans').join(', '),
          },
        },
      }),
    },
  },
  plugins: [typography],
}
```

---

**Result:** After this setup —
- `font-sans` Tailwind class → Phantom Sans
- `prose` / `prose-invert` (from `@tailwindcss/typography`) → Phantom Sans
- All body text → Phantom Sans via the `@layer base` rule

**Type scale — use Tailwind's built-in `text-*` classes:**

| Tailwind Class | Size     | Usage                                  |
|----------------|----------|----------------------------------------|
| `text-xs`      | 0.75rem  | Labels, badges, captions               |
| `text-sm`      | 0.875rem | Secondary body, metadata               |
| `text-base`    | 1rem     | Primary body text                      |
| `text-lg`      | 1.125rem | Subheadings, lead paragraphs           |
| `text-xl`      | 1.25rem  | Card headings                          |
| `text-2xl`     | 1.5rem   | Section headings (mobile)              |
| `text-3xl`     | 1.875rem | Section headings (desktop)             |
| `text-4xl`     | 2.25rem  | Page headings                          |
| `text-5xl`     | 3rem     | Hero headlines (medium)                |
| `text-6xl`     | 4rem     | Hero headlines (large screens)         |
| `text-[clamp(3rem,8vw,6rem)]` | fluid | Full-width hero display text — use Tailwind's arbitrary value syntax |

For Markdown/MDX content blocks (blog posts, workshop descriptions), wrap in `prose prose-invert` — this will automatically apply Phantom Sans and sensible typographic styles via `@tailwindcss/typography`.

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

**Hero background technique (CSS):**
```css
.hero {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(236, 55, 80, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(51, 214, 166, 0.06) 0%, transparent 50%),
    var(--bg-primary);
}
/* Optional dot grid overlay */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #333 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.15;
  pointer-events: none;
}
```

### Card / Bento Grid Rules

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: border-color 0.2s, transform 0.2s;
}
.card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}
```

Bento grids should use `display: grid` with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`.  
Feature bento: Use asymmetric grids where one card spans 2 columns for visual hierarchy.

### Button System

```css
/* Primary CTA */
.btn-primary {
  background: var(--accent);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-family: 'Phantom Sans', sans-serif;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

/* Ghost/Secondary */
.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-family: 'Phantom Sans', sans-serif;
  transition: border-color 0.2s;
}
.btn-ghost:hover {
  border-color: var(--text-primary);
}
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
- [ ] All colors use CSS variables, no hardcoded hex
- [ ] Phantom Sans is loaded and applied to all text
- [ ] Logo loaded from `assets.hackclub.com` CDN (not local)
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

| ❌ Don't                                      | ✅ Do Instead                                   |
|----------------------------------------------|------------------------------------------------|
| Write "hackclub" as one word                 | Always write "Hack Club"                       |
| Use hardcoded `#ec3750` in component CSS     | Use `var(--accent)` or `var(--color-red)`      |
| Use Inter, Roboto, or system-ui fonts        | Use Phantom Sans                               |
| Host logo files locally                      | Load from `assets.hackclub.com`                |
| Create pages without heroes                  | Every page needs a hero                        |
| Use purple gradient on white (generic AI look) | Use dark bg with red accent                  |
| Use generic icon libraries (FontAwesome)     | Use `@hackclub/icons`                          |
| Skip mobile responsiveness                   | Mobile-first, always                           |
| Invent new color variables                   | Extend the existing palette only              |
| Add unnecessary JavaScript                   | Prefer CSS-only animations, Astro static output|

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