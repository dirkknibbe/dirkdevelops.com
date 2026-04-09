# dirkdevelops.com Portfolio Revamp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the outdated HTML5UP portfolio with a modern Astro site featuring Pretext.js hero animation, editorial cinematic scroll, and content from the Kalos resume.

**Architecture:** Astro static site at project root (new `site/` directory), single-page continuous scroll with 5 sections, React island for Pretext hero animation, CSS-only scroll reveals via IntersectionObserver, future-ready routing for blog and project deep-dives.

**Tech Stack:** Astro 5, React 19, Pretext.js (`@chenglou/pretext`), vanilla CSS with custom properties, Google Fonts (Inter + Playfair Display), Vercel deployment.

**Spec:** `docs/superpowers/specs/2026-04-09-portfolio-revamp-design.md`

---

## File Structure

```
site/                              # New Astro project root
├── astro.config.mjs               # Astro config with React integration + Vercel adapter
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── public/
│   ├── favicon.svg                # Simple DK monogram favicon
│   └── og-image.png               # OpenGraph image (placeholder, replace later)
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro       # HTML shell: meta, fonts, global CSS, nav, dot-nav
│   ├── pages/
│   │   └── index.astro            # Main scroll page — assembles all sections
│   ├── components/
│   │   ├── Nav.astro              # Top navigation bar
│   │   ├── DotNav.astro           # Fixed dot scroll indicator
│   │   ├── HeroSection.astro      # Hero section wrapper
│   │   ├── PretextHero.tsx        # React island — Pretext.js name animation
│   │   ├── ProjectsSection.astro  # Section 01 — project cards
│   │   ├── ExperienceSection.astro # Section 02 — work history + tech stack
│   │   ├── AboutSection.astro     # Section 03 — about text
│   │   ├── ContactSection.astro   # Section 04 — contact links
│   │   └── ScrollReveal.astro     # Reusable wrapper that adds reveal animation classes
│   └── styles/
│       └── global.css             # All CSS: custom properties, typography, layout, animations, responsive
```

---

### Task 1: Scaffold Astro Project

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`

- [ ] **Step 1: Create the Astro project**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
npm create astro@latest site -- --template minimal --no-install --no-git --typescript strict
```

- [ ] **Step 2: Add React integration and Vercel adapter**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
npx astro add react --yes
npx astro add vercel --yes
```

- [ ] **Step 3: Install Pretext**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
npm install @chenglou/pretext
```

- [ ] **Step 4: Install all dependencies**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
npm install
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
npx astro dev --port 4321
```

Expected: Server starts at `http://localhost:4321`, shows default Astro page.

- [ ] **Step 6: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/
git commit -m "feat: scaffold Astro project with React + Vercel + Pretext"
```

---

### Task 2: Global CSS and Custom Properties

**Files:**
- Create: `site/src/styles/global.css`

- [ ] **Step 1: Write the complete global stylesheet**

Create `site/src/styles/global.css` with this content:

```css
/* ===== Reset ===== */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

/* ===== Custom Properties ===== */
:root {
  --bg: #09090b;
  --surface: #111113;
  --border: #1a1a1e;
  --text-primary: #fafafa;
  --text-secondary: #71717a;
  --text-muted: #3f3f46;
  --text-dim: #27272a;
  --accent: #a1a1aa;

  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-mono: ui-monospace, 'SF Mono', Monaco, Consolas, monospace;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== Base ===== */
html {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--text-muted) var(--bg);
}

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 15px;
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== Grid Background ===== */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  pointer-events: none;
  z-index: 0;
}

/* ===== Typography ===== */
h1, h2, h3 {
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

a {
  color: inherit;
  text-decoration: none;
}

/* ===== Sections ===== */
section {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  padding: 80px 40px 80px 80px;
  z-index: 1;
}

.section-num {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 96px;
  font-weight: 200;
  color: var(--text-dim);
  font-family: var(--font-serif);
  line-height: 1;
  opacity: 0;
  transition: opacity 0.8s var(--ease-out);
  user-select: none;
}

section.visible .section-num {
  opacity: 1;
}

.accent-line {
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(transparent 15%, var(--border) 40%, var(--border) 60%, transparent 85%);
}

.section-content {
  margin-left: 60px;
}

.section-label {
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 24px;
}

/* ===== Scroll Reveal ===== */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out);
}

.reveal.show {
  opacity: 1;
  transform: translateY(0);
}

.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }

/* ===== Hero ===== */
.hero-section {
  padding-left: 40px;
}

.hero-label {
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-bottom: 20px;
}

.hero-name {
  font-size: clamp(44px, 8vw, 72px);
  font-weight: 200;
  letter-spacing: -3px;
  line-height: 1;
  margin-bottom: 8px;
  min-height: 1.2em;
}

.hero-rule {
  width: 48px;
  height: 1px;
  background: var(--text-dim);
  margin: 24px 0;
}

.hero-desc {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  max-width: 440px;
  font-weight: 300;
}

.scroll-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: pulse 2s ease-in-out infinite;
}

.scroll-hint .line {
  width: 1px;
  height: 32px;
  background: linear-gradient(transparent, var(--text-muted));
}

.scroll-hint span {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ===== Project Cards ===== */
.project-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 20px;
  max-width: 560px;
  transition: border-color 0.3s;
}

.project-card:hover {
  border-color: var(--text-muted);
}

.project-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.project-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.project-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
}

.project-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.project-tags span {
  font-size: 10px;
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 3px 8px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

/* ===== Experience ===== */
.exp-block {
  max-width: 520px;
  margin-bottom: 32px;
}

.exp-role {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.5px;
}

.exp-company {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 12px;
}

.exp-detail {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  padding-left: 12px;
  border-left: 1px solid var(--border);
  margin-bottom: 8px;
}

/* ===== About ===== */
.about-text {
  font-size: 18px;
  line-height: 1.8;
  font-weight: 300;
  max-width: 520px;
  color: var(--accent);
}

.about-text em {
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--text-primary);
}

/* ===== Contact ===== */
.contact-link {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  transition: color 0.3s, padding-left 0.3s;
  max-width: 400px;
}

.contact-link:hover {
  color: var(--text-primary);
  padding-left: 8px;
}

.contact-arrow {
  color: var(--text-muted);
  transition: color 0.3s;
}

.contact-link:hover .contact-arrow {
  color: var(--text-primary);
}

/* ===== Nav ===== */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  background: linear-gradient(var(--bg), transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.logo {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.nav-links {
  display: flex;
  gap: 24px;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.nav-links a {
  transition: color 0.3s;
}

.nav-links a:hover {
  color: var(--text-secondary);
}

/* ===== Dot Nav ===== */
.dot-nav {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.dot-nav a {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all 0.4s var(--ease-out);
  display: block;
}

.dot-nav a.active {
  background: var(--text-primary);
  box-shadow: 0 0 8px rgba(250, 250, 250, 0.15);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  section {
    padding: 60px 20px;
  }

  .section-num {
    display: none;
  }

  .accent-line {
    display: none;
  }

  .section-content {
    margin-left: 0;
  }

  .hero-section {
    padding-left: 20px;
  }

  .top-nav {
    padding: 16px 20px;
  }

  .dot-nav {
    right: 12px;
  }

  .project-card {
    padding: 24px;
  }
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .scroll-hint {
    animation: none;
    opacity: 0.6;
  }

  .hero-name .char {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

- [ ] **Step 2: Verify CSS is valid**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
# Quick check — no syntax errors by importing in a test HTML file
echo '<!DOCTYPE html><html><head><link rel="stylesheet" href="src/styles/global.css"></head><body>test</body></html>' > /tmp/css-test.html && echo "CSS file created successfully"
```

- [ ] **Step 3: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/styles/global.css
git commit -m "feat: add global CSS with design tokens, typography, layout, and responsive styles"
```

---

### Task 3: Base Layout and Navigation Components

**Files:**
- Create: `site/src/layouts/BaseLayout.astro`
- Create: `site/src/components/Nav.astro`
- Create: `site/src/components/DotNav.astro`
- Create: `site/public/favicon.svg`

- [ ] **Step 1: Create the favicon**

Create `site/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#09090b"/>
  <text x="16" y="22" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#fafafa" text-anchor="middle">DK</text>
</svg>
```

- [ ] **Step 2: Create the Nav component**

Create `site/src/components/Nav.astro`:

```astro
<nav class="top-nav">
  <a href="#hero" class="logo">DK</a>
  <div class="nav-links">
    <a href="#projects">Projects</a>
    <a href="#experience">Experience</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </div>
</nav>
```

- [ ] **Step 3: Create the DotNav component**

Create `site/src/components/DotNav.astro`:

```astro
<div class="dot-nav" id="dotNav">
  <a href="#hero" class="active" data-section="hero"></a>
  <a href="#projects" data-section="projects"></a>
  <a href="#experience" data-section="experience"></a>
  <a href="#about" data-section="about"></a>
  <a href="#contact" data-section="contact"></a>
</div>

<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.dot-nav a').forEach((dot) => {
            dot.classList.toggle('active', dot.dataset.section === id);
          });
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.3, rootMargin: '-10% 0px' }
  );

  document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));
</script>
```

- [ ] **Step 4: Create the BaseLayout**

Create `site/src/layouts/BaseLayout.astro`:

```astro
---
import Nav from '../components/Nav.astro';
import DotNav from '../components/DotNav.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://dirkdevelops.com" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&family=Playfair+Display:ital,wght@0,200;0,400;1,400&display=swap"
      rel="stylesheet"
    />
    <title>{title}</title>
  </head>
  <body>
    <Nav />
    <DotNav />
    <slot />
  </body>
</html>
```

- [ ] **Step 5: Verify layout renders**

Replace `site/src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Dirk Knibbe — Software Engineer" description="Full-stack software engineer building production systems at scale.">
  <section id="hero" class="hero-section">
    <div class="hero-content">
      <p class="hero-label">Software Engineer</p>
      <h1 class="hero-name">Dirk Knibbe</h1>
    </div>
  </section>
</BaseLayout>
```

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Page loads at `http://localhost:4321` with dark background, grid texture, nav bar, dot nav, and "Dirk Knibbe" heading.

- [ ] **Step 6: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/public/favicon.svg site/src/layouts/BaseLayout.astro site/src/components/Nav.astro site/src/components/DotNav.astro site/src/pages/index.astro
git commit -m "feat: add base layout, nav, dot nav, and favicon"
```

---

### Task 4: Hero Section with Pretext Animation

**Files:**
- Create: `site/src/components/HeroSection.astro`
- Create: `site/src/components/PretextHero.tsx`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Create the PretextHero React component**

Create `site/src/components/PretextHero.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { prepare, layout } from '@chenglou/pretext';

interface CharPosition {
  char: string;
  x: number;
  y: number;
}

export default function PretextHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<CharPosition[]>([]);
  const [animated, setAnimated] = useState(false);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const text = 'Dirk Knibbe';
    const fontSize = Math.min(72, window.innerWidth * 0.08);
    const fontStr = `200 ${fontSize}px Inter, system-ui, sans-serif`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prepared = prepare(ctx, text, {
      font: fontStr,
      letterSpacing: -3,
    });

    const containerWidth = container.offsetWidth;
    const result = layout(prepared, containerWidth);

    const finalPositions: CharPosition[] = [];
    for (const line of result.lines) {
      for (const seg of line.segments) {
        for (let i = 0; i < seg.text.length; i++) {
          finalPositions.push({
            char: seg.text[i],
            x: seg.x + (seg.width / seg.text.length) * i,
            y: line.y,
          });
        }
      }
    }

    setPositions(finalPositions);

    // Trigger animation after a brief delay
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      ref={containerRef}
      className="hero-name"
      aria-label="Dirk Knibbe"
      role="heading"
      aria-level={1}
    >
      {positions.map((pos, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: prefersReducedMotion || animated ? 1 : 0,
            transform:
              prefersReducedMotion || animated
                ? 'translateY(0)'
                : 'translateY(40px)',
            transition: prefersReducedMotion
              ? 'none'
              : `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.045}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.045}s`,
          }}
        >
          {pos.char === ' ' ? '\u00A0' : pos.char}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create the HeroSection wrapper**

Create `site/src/components/HeroSection.astro`:

```astro
---
import PretextHero from './PretextHero.tsx';
---

<section id="hero" class="hero-section">
  <div class="hero-content">
    <p class="hero-label reveal show">Software Engineer</p>
    <PretextHero client:load />
    <div class="hero-rule reveal reveal-delay-2 show"></div>
    <p class="hero-desc reveal reveal-delay-3 show">
      Building production systems at scale. Microservices, AI tooling, and
      end-to-end feature ownership from database design through deployment.
    </p>
  </div>
  <div class="scroll-hint">
    <div class="line"></div>
    <span>scroll</span>
  </div>
</section>

<script>
  let scrolled = false;
  window.addEventListener('scroll', () => {
    if (!scrolled && window.scrollY > 100) {
      scrolled = true;
      const hint = document.querySelector('.scroll-hint') as HTMLElement;
      if (hint) {
        hint.style.transition = 'opacity 0.5s';
        hint.style.opacity = '0';
      }
    }
  });
</script>
```

- [ ] **Step 3: Update index.astro to use HeroSection**

Replace `site/src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/HeroSection.astro';
---

<BaseLayout
  title="Dirk Knibbe — Software Engineer"
  description="Full-stack software engineer building production systems at scale. TypeScript, Java, Spring Boot, Kafka, AI tooling."
>
  <HeroSection />
</BaseLayout>
```

- [ ] **Step 4: Verify Pretext hero renders and animates**

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Page loads, "Dirk Knibbe" characters animate in one by one with staggered timing, settling into position with smooth deceleration. Scroll hint pulses at bottom.

- [ ] **Step 5: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/HeroSection.astro site/src/components/PretextHero.tsx site/src/pages/index.astro
git commit -m "feat: add hero section with Pretext.js character animation"
```

---

### Task 5: Projects Section (01)

**Files:**
- Create: `site/src/components/ProjectsSection.astro`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Create ProjectsSection component**

Create `site/src/components/ProjectsSection.astro`:

```astro
<section id="projects">
  <div class="accent-line"></div>
  <div class="section-num">01</div>
  <div class="section-content">
    <div class="section-label reveal">Selected Work</div>

    <div class="project-card reveal reveal-delay-1">
      <div class="project-label">MCP Server · Micro-SaaS</div>
      <div class="project-title">UIPE — UI Perception Engine</div>
      <div class="project-desc">
        Dependency-free MCP server giving AI agents temporal perception of web
        UIs via perceptual hash diffing, MutationObserver injection through CDP,
        and native Performance/Network APIs.
      </div>
      <div class="project-tags">
        <span>TypeScript</span>
        <span>Node.js</span>
        <span>Chrome DevTools Protocol</span>
        <span>Perceptual Hashing</span>
      </div>
    </div>

    <div class="project-card reveal reveal-delay-2">
      <div class="project-label">Autonomous Pipeline</div>
      <div class="project-title">Morning Brief</div>
      <div class="project-desc">
        Two-agent daily intelligence pipeline. Fetches ~45 signals from HN,
        Reddit, and GitHub, dedupes against MongoDB, synthesizes structured
        briefs, then auto-researches action items.
      </div>
      <div class="project-tags">
        <span>TypeScript</span>
        <span>Bun</span>
        <span>Claude Code</span>
        <span>MongoDB</span>
        <span>Telegram Bot API</span>
      </div>
    </div>

    <div class="project-card reveal reveal-delay-3">
      <div class="project-label">Interactive Map · Deployed</div>
      <div class="project-title">Nachalah</div>
      <div class="project-desc">
        Interactive map application visualizing biblical tribal boundary data
        from Ezekiel 47–48. Full end-to-end ownership from GeoJSON data modeling
        through Vercel deployment.
      </div>
      <div class="project-tags">
        <span>React</span>
        <span>Vite</span>
        <span>Mapbox GL JS</span>
        <span>GeoJSON</span>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add ProjectsSection to index.astro**

Update `site/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/HeroSection.astro';
import ProjectsSection from '../components/ProjectsSection.astro';
---

<BaseLayout
  title="Dirk Knibbe — Software Engineer"
  description="Full-stack software engineer building production systems at scale. TypeScript, Java, Spring Boot, Kafka, AI tooling."
>
  <HeroSection />
  <ProjectsSection />
</BaseLayout>
```

- [ ] **Step 3: Verify projects section renders with scroll reveal**

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Scroll past hero → section number "01" fades in, "Selected Work" label appears, three project cards stagger in. Dot nav updates to second dot.

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/ProjectsSection.astro site/src/pages/index.astro
git commit -m "feat: add projects section with three project cards"
```

---

### Task 6: Experience Section (02)

**Files:**
- Create: `site/src/components/ExperienceSection.astro`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Create ExperienceSection component**

Create `site/src/components/ExperienceSection.astro`:

```astro
<section id="experience">
  <div class="accent-line"></div>
  <div class="section-num">02</div>
  <div class="section-content">
    <div class="section-label reveal">Experience</div>

    <div class="exp-block reveal reveal-delay-1">
      <div class="exp-role">Software Developer</div>
      <div class="exp-company">
        Bass Pro Shops · Springfield, MO · Feb 2023 – Present
      </div>
      <div class="exp-detail">
        Built and deployed push notification system for same-day pickup across
        190+ retail locations
      </div>
      <div class="exp-detail">
        Designed Spring Boot + Kafka microservices with idempotent consumer
        patterns for real-time inventory
      </div>
      <div class="exp-detail">
        Led technical presentation to CTO, CIO, and ownership — resulted in
        proof-of-concept expansion
      </div>
      <div class="exp-detail">
        Contributed to IBM MQ + Apache Camel K iSeries integration, bridging
        legacy with modern architecture
      </div>
    </div>

    <div class="reveal reveal-delay-2" style="margin-top: 32px;">
      <div class="section-label" style="margin-bottom: 16px;">Tech Stack</div>
      <div class="project-tags" style="max-width: 480px;">
        <span>TypeScript</span>
        <span>Java</span>
        <span>React</span>
        <span>Angular</span>
        <span>Spring Boot</span>
        <span>Node.js</span>
        <span>Apache Kafka</span>
        <span>PostgreSQL</span>
        <span>MongoDB</span>
        <span>Kubernetes</span>
        <span>Docker</span>
        <span>Claude Code</span>
        <span>Anthropic API</span>
        <span>MCP Servers</span>
      </div>
    </div>

    <div class="reveal reveal-delay-3" style="margin-top: 32px;">
      <div class="section-label" style="margin-bottom: 8px;">Education</div>
      <div class="exp-company">
        Full-Stack Web Development · BloomTech (formerly Lambda School) · 2022
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add ExperienceSection to index.astro**

Update `site/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/HeroSection.astro';
import ProjectsSection from '../components/ProjectsSection.astro';
import ExperienceSection from '../components/ExperienceSection.astro';
---

<BaseLayout
  title="Dirk Knibbe — Software Engineer"
  description="Full-stack software engineer building production systems at scale. TypeScript, Java, Spring Boot, Kafka, AI tooling."
>
  <HeroSection />
  <ProjectsSection />
  <ExperienceSection />
</BaseLayout>
```

- [ ] **Step 3: Verify experience section renders**

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Scroll to section 02, role/company/bullets reveal with stagger, tech stack tags appear, education shows below.

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/ExperienceSection.astro site/src/pages/index.astro
git commit -m "feat: add experience section with role details and tech stack"
```

---

### Task 7: About Section (03)

**Files:**
- Create: `site/src/components/AboutSection.astro`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Create AboutSection component**

Create `site/src/components/AboutSection.astro`:

```astro
<section id="about">
  <div class="accent-line"></div>
  <div class="section-num">03</div>
  <div class="section-content">
    <div class="section-label reveal">About</div>
    <p class="about-text reveal reveal-delay-1">
      Full-stack engineer with 3+ years shipping production systems. I build
      things that <em>work at scale</em> — from event-driven microservices
      processing real-time inventory across 190 stores, to autonomous AI
      pipelines that run while I sleep.
    </p>
    <p class="about-text reveal reveal-delay-2" style="margin-top: 20px;">
      I use Claude Code daily — not as an autocomplete tool, but as an
      <em>integral part</em> of how I architect, prototype, and ship. I'm a fast
      learner, a clear communicator, and I thrive in small teams where everyone
      owns their work <em>end-to-end</em>.
    </p>
  </div>
</section>
```

- [ ] **Step 2: Add AboutSection to index.astro**

Update `site/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/HeroSection.astro';
import ProjectsSection from '../components/ProjectsSection.astro';
import ExperienceSection from '../components/ExperienceSection.astro';
import AboutSection from '../components/AboutSection.astro';
---

<BaseLayout
  title="Dirk Knibbe — Software Engineer"
  description="Full-stack software engineer building production systems at scale. TypeScript, Java, Spring Boot, Kafka, AI tooling."
>
  <HeroSection />
  <ProjectsSection />
  <ExperienceSection />
  <AboutSection />
</BaseLayout>
```

- [ ] **Step 3: Verify about section renders**

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Section 03 with serif italic emphasis on "work at scale", "integral part", and "end-to-end" standing out against the zinc body text.

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/AboutSection.astro site/src/pages/index.astro
git commit -m "feat: add about section with serif emphasis text"
```

---

### Task 8: Contact Section (04)

**Files:**
- Create: `site/src/components/ContactSection.astro`
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Create ContactSection component**

Create `site/src/components/ContactSection.astro`:

```astro
<section id="contact">
  <div class="accent-line"></div>
  <div class="section-num">04</div>
  <div class="section-content">
    <div class="section-label reveal">Get in Touch</div>
    <p
      class="reveal reveal-delay-1"
      style="color: var(--text-secondary); font-size: 15px; margin-bottom: 24px; max-width: 400px; line-height: 1.7;"
    >
      Looking for my next challenge. Let's talk.
    </p>
    <a
      class="contact-link reveal reveal-delay-2"
      href="mailto:dirkjknibbe@gmail.com"
    >
      <span class="contact-arrow">→</span>
      dirkjknibbe@gmail.com
    </a>
    <a
      class="contact-link reveal reveal-delay-3"
      href="https://linkedin.com/in/dirkknibbe"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="contact-arrow">→</span>
      LinkedIn
    </a>
    <a
      class="contact-link reveal reveal-delay-4"
      href="https://github.com/dirkknibbe"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="contact-arrow">→</span>
      GitHub
    </a>
  </div>
</section>

<div style="height: 20vh;"></div>
```

- [ ] **Step 2: Update index.astro with all sections**

Update `site/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/HeroSection.astro';
import ProjectsSection from '../components/ProjectsSection.astro';
import ExperienceSection from '../components/ExperienceSection.astro';
import AboutSection from '../components/AboutSection.astro';
import ContactSection from '../components/ContactSection.astro';
---

<BaseLayout
  title="Dirk Knibbe — Software Engineer"
  description="Full-stack software engineer building production systems at scale. TypeScript, Java, Spring Boot, Kafka, AI tooling."
>
  <HeroSection />
  <ProjectsSection />
  <ExperienceSection />
  <AboutSection />
  <ContactSection />
</BaseLayout>
```

- [ ] **Step 3: Verify complete scroll experience**

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Full top-to-bottom scroll through all 5 sections. Dot nav tracks position. Section numbers fade in. All reveals trigger on scroll. Contact links have hover animations.

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/ContactSection.astro site/src/pages/index.astro
git commit -m "feat: add contact section, complete main scroll experience"
```

---

### Task 9: Pretext Scroll Touches

**Files:**
- Modify: `site/src/components/DotNav.astro` (add reveal observer for `.reveal` elements)
- Modify: `site/src/styles/global.css` (add subtle letter-spacing animation for section labels)

- [ ] **Step 1: Add scroll-triggered reveal observer for all `.reveal` elements**

The DotNav component already has an IntersectionObserver for sections, but `.reveal` elements inside need their own observer. Update `site/src/components/DotNav.astro` — replace the entire `<script>` block:

```astro
<script>
  // Section-level observer: dot nav + section visibility
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.dot-nav a').forEach((dot) => {
            dot.classList.toggle('active', dot.dataset.section === id);
          });
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.3, rootMargin: '-10% 0px' }
  );

  document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));

  // Element-level observer: reveal animations
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.reveal:not(.show)').forEach((el) => revealObserver.observe(el));
</script>
```

- [ ] **Step 2: Add subtle letter-spacing animation to section labels**

Add to the end of `site/src/styles/global.css` (before the responsive media query):

```css
/* ===== Pretext-inspired scroll touches ===== */
.section-label {
  letter-spacing: 2px;
  transition: letter-spacing 0.8s var(--ease-out);
}

.section-label.show {
  letter-spacing: 3px;
}

.project-title {
  transition: letter-spacing 0.3s var(--ease-out);
}

.project-card:hover .project-title {
  letter-spacing: 0px;
}
```

- [ ] **Step 3: Verify scroll touches work**

Run: `cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site && npx astro dev --port 4321`

Expected: Section labels subtly expand letter-spacing as they appear. Project titles tighten letter-spacing on card hover. All reveals trigger independently.

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/DotNav.astro site/src/styles/global.css
git commit -m "feat: add scroll reveal observer and subtle letter-spacing animations"
```

---

### Task 10: Build, Test, and Deploy Setup

**Files:**
- Modify: `site/astro.config.mjs` (verify Vercel adapter config)
- Create: `site/.gitignore`

- [ ] **Step 1: Create site-level .gitignore**

Create `site/.gitignore`:

```
node_modules/
dist/
.astro/
```

- [ ] **Step 2: Verify Astro config has Vercel adapter**

Read `site/astro.config.mjs` and verify it includes:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  adapter: vercel(),
});
```

If it differs, update it to match.

- [ ] **Step 3: Run production build**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
npm run build
```

Expected: Build succeeds with no errors. Output in `site/dist/`.

- [ ] **Step 4: Preview production build**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com/site
npm run preview
```

Expected: Site serves from `dist/`, all sections render, Pretext animation works, scroll reveals fire, dot nav tracks sections.

- [ ] **Step 5: Run Lighthouse audit**

Open Chrome DevTools → Lighthouse → Run audit on `http://localhost:4321` (or preview port).

Expected: 95+ Performance, 95+ Accessibility, 95+ Best Practices, 95+ SEO.

- [ ] **Step 6: Commit final state**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/.gitignore site/astro.config.mjs
git commit -m "feat: finalize build config and deployment setup"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Scaffold Astro project | `site/package.json`, `site/astro.config.mjs` |
| 2 | Global CSS and design tokens | `site/src/styles/global.css` |
| 3 | Base layout + navigation | `BaseLayout.astro`, `Nav.astro`, `DotNav.astro` |
| 4 | Hero with Pretext animation | `HeroSection.astro`, `PretextHero.tsx` |
| 5 | Projects section (01) | `ProjectsSection.astro` |
| 6 | Experience section (02) | `ExperienceSection.astro` |
| 7 | About section (03) | `AboutSection.astro` |
| 8 | Contact section (04) | `ContactSection.astro` |
| 9 | Pretext scroll touches | `DotNav.astro`, `global.css` |
| 10 | Build, test, deploy | `astro.config.mjs`, `.gitignore` |
