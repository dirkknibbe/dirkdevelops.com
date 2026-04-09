# dirkdevelops.com Portfolio Revamp — Design Spec

## Overview

Full revamp of dirkdevelops.com from an outdated HTML5UP template to a modern Astro-based portfolio and developer hub. Content sourced from the Kalos Health resume (April 2026). Visual direction: quiet precision meets editorial cinematic — near-black, numbered sections, Pretext.js hero animation, continuous scroll with cinematic pacing.

## Goals

1. **Professional portfolio** — updated identity as Software Engineer (not Web Developer), current projects and experience
2. **Developer hub** — home base with room for future blog posts and project deep-dives
3. **Technical showcase** — the site itself demonstrates engineering craft (Pretext.js, Astro, performance)
4. **Impression targets** — "sharp, inventive, technical" within 30 seconds of landing

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Astro** | Static-first, great SEO, supports React islands for interactivity, built-in routing for sub-pages |
| Text Animation | **Pretext.js** (`@chenglou/pretext`) | 60fps DOM-free text layout — hero signature animation + subtle scroll touches |
| Styling | **Vanilla CSS** with CSS custom properties | No framework overhead, full control over the aesthetic, performant |
| Fonts | **Inter** (body) + **Playfair Display** (serif accents) via Google Fonts | Clean sans-serif with editorial serif contrast |
| Icons | Minimal — no icon library. SVG inline for GitHub/LinkedIn only | Keeps bundle tiny, avoids icon-heavy AI look |
| Deployment | **Vercel** | Existing familiarity, great Astro support, instant deploys |
| Content | Markdown/MDX for future blog posts | Astro content collections, easy to author |

## Site Architecture

### Main Scroll Experience (`/`)

Single continuous top-to-bottom scroll. Five sections with cinematic pacing:

**Hero (no number)**
- Pretext.js signature animation: "Dirk Knibbe" rendered with fluid character-level physics on load
- Subtitle: "Software Engineer"
- One-line positioning statement
- Subtle grid texture background
- Scroll hint at bottom

**01 — Selected Work**
- 3 project cards: UIPE, Morning Brief, Nachalah
- Each card: label, title, description, tech tags
- Cards link to deep-dive sub-pages (future)
- Staggered scroll reveal

**02 — Experience**
- Bass Pro Shops role with 4 key bullet points
- Tech stack tag cloud
- Education: BloomTech

**03 — About**
- 2 paragraphs with serif italic emphasis on key phrases
- Personal positioning: full-stack, AI-forward, fast learner, end-to-end ownership

**04 — Contact**
- "Looking for my next challenge. Let's talk."
- Email, LinkedIn, GitHub as hover-animated links

### Sub-Pages (future-ready)

- `/projects/uipe` — deep-dive on UIPE
- `/projects/morning-brief` — deep-dive on Morning Brief
- `/projects/nachalah` — deep-dive on Nachalah
- `/blog` — index of technical posts (content collection)
- `/blog/[slug]` — individual post

Sub-pages share the nav and footer but are standard page layouts, not scroll-driven.

## Visual Design

### Color Palette

```
--bg:             #09090b    (near-black)
--surface:        #111113    (card backgrounds)
--border:         #1a1a1e    (subtle borders)
--text-primary:   #fafafa    (headings, key text)
--text-secondary: #71717a    (body copy)
--text-muted:     #3f3f46    (labels, section numbers)
--text-dim:       #27272a    (very subtle elements)
--accent:         #a1a1aa    (about text, hover states)
```

No brand color. Monochromatic zinc scale only. Color comes from project screenshots, not the chrome.

### Typography

- **Body:** Inter, 300/400/500/600 weights, 13-15px
- **Hero name:** Inter 200, 72px desktop / 44px mobile, -3px letter-spacing
- **Section numbers:** Playfair Display 200, 96px, `var(--text-dim)`
- **Serif accents:** Playfair Display italic for emphasis within about text
- **Labels:** Monospace (system), 10-11px, uppercase, 2-3px letter-spacing
- **Scale:** Modular, fluid with clamp() for responsive sizing

### Layout

- Subtle grid texture background (80px cells, 2% white opacity)
- Vertical accent line (left side) on sections 01-04
- Dot navigation (right side, fixed) showing current section
- Top nav: "DK" logo left, section links right, blur backdrop
- Content max-width ~560px for readability, left-aligned
- Generous vertical spacing between sections (full viewport height per section)

### Motion & Animation

**Pretext Hero (signature moment):**
- On page load, "Dirk Knibbe" characters animate in with fluid physics — not a typewriter effect, but characters settling into position with natural deceleration
- Uses Pretext's `prepare()` + `layout()` for per-frame measurement
- Renders to DOM spans with transform positioning
- Duration: ~1.2s total, staggered per character

**Pretext Scroll Touches (subtle B-level integration):**
- Section labels ("Selected Work", "Experience", etc.) get a subtle character-spread animation on scroll enter — characters start slightly compressed then ease to natural spacing
- Project titles get a gentle weight shift on hover (Pretext recalculates layout at different weights)
- These are enhancement-only — content is fully readable without them

**CSS Scroll Reveals:**
- Elements fade in + translate up (24px) on intersection
- Staggered delays within sections (0.1s increments)
- Cubic-bezier easing: (0.16, 1, 0.3, 1) — quick start, smooth settle
- Section numbers fade in separately

**Dot Nav:**
- Active dot: white with subtle glow
- Inactive: muted zinc
- Transition: 0.4s with same cubic-bezier

**Scroll Hint:**
- Pulsing opacity animation on hero
- Fades out after first scroll

### Responsive Behavior

- **Desktop (>768px):** Full layout with section numbers, accent lines, dot nav
- **Mobile (<768px):** Section numbers and accent lines hidden, dot nav condensed, hero name scales down, content goes full-width with reduced padding
- No hamburger menu — nav links remain visible, font size reduces

## Content (from Kalos Resume)

### Hero
- Name: Dirk Knibbe
- Title: Software Engineer
- Tagline: "Building production systems at scale. Microservices, AI tooling, and end-to-end feature ownership from database design through deployment."

### Projects
1. **UIPE — UI Perception Engine** (MCP Server · Micro-SaaS)
   - Dependency-free MCP server giving AI agents temporal perception of web UIs via perceptual hash diffing, MutationObserver injection through CDP, and native Performance/Network APIs.
   - Tags: TypeScript, Node.js, Chrome DevTools Protocol, Perceptual Hashing

2. **Morning Brief** (Autonomous Pipeline)
   - Two-agent daily intelligence pipeline. Fetches ~45 signals from HN, Reddit, and GitHub, dedupes against MongoDB, synthesizes structured briefs, then auto-researches action items.
   - Tags: TypeScript, Bun, Claude Code, MongoDB, Telegram Bot API

3. **Nachalah** (Interactive Map · Deployed)
   - Interactive map application visualizing biblical tribal boundary data from Ezekiel 47–48. Full end-to-end ownership from GeoJSON data modeling through Vercel deployment.
   - Tags: React, Vite, Mapbox GL JS, GeoJSON

### Experience
- **Software Developer** at Bass Pro Shops, Springfield, MO (Feb 2023 – Present)
  - Push notification system for same-day pickup across 190+ locations
  - Spring Boot + Kafka microservices with idempotent consumer patterns
  - Technical presentation to CTO/CIO/ownership → POC expansion
  - IBM MQ + Apache Camel K iSeries integration

### Tech Stack
TypeScript, Java, React, Angular, Spring Boot, Node.js, Apache Kafka, PostgreSQL, MongoDB, Kubernetes, Docker, Claude Code, Anthropic API, MCP Servers

### About
Full-stack engineer with 3+ years shipping production systems. Builds things that work at scale — from event-driven microservices processing real-time inventory across 190 stores, to autonomous AI pipelines that run while he sleeps. Uses Claude Code daily as an integral part of architecture, prototyping, and shipping. Fast learner, clear communicator, thrives in small teams with end-to-end ownership.

### Contact
- Email: dirkjknibbe@gmail.com
- LinkedIn: linkedin.com/in/dirkknibbe
- GitHub: github.com/dirkknibbe

### Meta / SEO
- Title: "Dirk Knibbe — Software Engineer"
- Description: "Full-stack software engineer building production systems at scale. TypeScript, Java, Spring Boot, Kafka, AI tooling."
- OG Image: Generate from site screenshot or design a branded card

## Performance Targets

- Lighthouse: 95+ across all categories
- First Contentful Paint: <1s
- Total bundle: <50KB JS (Pretext is 15KB, rest is intersection observer + nav logic)
- Zero layout shift (Pretext renders after layout, doesn't cause CLS)
- Pretext animations respect `prefers-reduced-motion` — fall back to instant render

## Migration Plan

- Current site lives in `/portfolio/` — new site replaces it at project root
- Old `/portfolio/` directory archived or removed after launch
- Same domain (dirkdevelops.com), same Vercel project
- Git history preserved

## Out of Scope (for v1)

- Blog content (infrastructure is there, no posts yet)
- Project deep-dive sub-pages (cards link to GitHub for now)
- Dark/light theme toggle (dark only)
- Contact form (links only)
- Analytics
