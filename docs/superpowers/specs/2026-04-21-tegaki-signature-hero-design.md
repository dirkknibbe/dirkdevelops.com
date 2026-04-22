# Tegaki signature hero — design

**Date:** 2026-04-21
**Status:** Awaiting user review

## Problem

The hero of `dirkdevelops.com` currently renders "Dirk Knibbe" as stylized text via `PretextHero.tsx`. Replace it with a handwritten signature that draws itself stroke-by-stroke on load and on every subsequent scroll back to the hero. The ASCII particle background and the rest of the hero layout (label, rule, description, scroll hint) are unchanged.

## Solution summary

Use the [Tegaki](https://gkurt.com/tegaki) library with a user-generated font bundle for **Nothing You Could Do** (Google Fonts). Tegaki's generator (run once, externally) extracts stroke skeletons from the font outlines and ships them as a TypeScript bundle; the runtime `TegakiRenderer` component plays the strokes sequentially.

We're shipping Tegaki's React adapter mounted as an Astro client island — same integration pattern as the existing `PretextHero`.

## Files

### New

- `site/src/fonts/nothing-you-could-do/bundle.ts` — Tegaki bundle entry point (generator output).
- `site/src/fonts/nothing-you-could-do/glyphData.json` — per-glyph stroke data (~50 KB, generator output).
- `site/src/fonts/nothing-you-could-do/nothing-you-could-do.ttf` — underlying TTF referenced by the bundle for text layout (~27 KB, generator output).
- `site/src/components/SignatureHero.tsx` — React component that wraps `<TegakiRenderer>`, handles viewport-intersection replay, and exposes a `replay()` surface.

### Modified

- `site/src/components/HeroSection.astro` — swap `<PretextHero client:load />` for `<SignatureHero client:load />`.
- `site/package.json` — add `tegaki` dependency.

### Kept, not deleted

- `site/src/components/PretextHero.tsx` — kept in the tree so a one-line revert in `HeroSection.astro` restores the old behavior. Delete in a follow-up commit once the new hero is accepted.

## Bundle placement and import shape

The generator output is three files that belong together. Co-locate under `site/src/fonts/nothing-you-could-do/`. The bundle's `bundle.ts` uses ES module import attributes (`with { type: 'url' }` for the TTF, `with { type: 'json' }` for glyph data) — both are supported by Vite/Astro's module graph. No bundler config changes needed.

Import site:

```ts
import signatureBundle from '@/fonts/nothing-you-could-do/bundle';
```

Path alias `@/` is assumed to exist (common Astro convention). If it does not, fall back to relative import. Verify before coding.

## `SignatureHero.tsx` behavior

```tsx
import { TegakiRenderer } from 'tegaki/react';
import signatureBundle from '../fonts/nothing-you-could-do/bundle';
```

**Props:** none. The component is self-contained — text, font, speed, effects, size are all baked in. This matches the simplicity of the current `PretextHero`.

**Configuration:**

| Option            | Value                                            |
| ----------------- | ------------------------------------------------ |
| `text`            | `"Dirk Knibbe"`                                  |
| `font`            | imported bundle                                  |
| `time.mode`       | `uncontrolled`                                   |
| `time.speed`      | `1.8`                                            |
| `time.loop`       | `false`                                          |
| `style.fontSize`  | `140px` on desktop, responsive scaling on mobile |
| `effects`         | *(empty — no pressure / taper / glow / wobble)*  |

**Replay on scroll back:**

Use a single `IntersectionObserver` watching the hero section. Each time the hero transitions from not-intersecting → intersecting, remount the Tegaki engine (same destroy-and-recreate pattern used in the preview). Threshold `0.5` — hero must be at least half visible before replay fires. This prevents replay from firing on tiny scroll jiggles.

Initial mount also counts as an intersection event, so a single code path handles both first-load animation and subsequent replays.

**Mobile sizing:**

140px is hero-scale for desktop. "Dirk Knibbe" at that size overflows narrow viewports, so scale with `fontSize: clamp(56px, 12vw, 140px)` — fluid between a mobile floor (56px) and the desktop target. Match the existing hero's responsive breakpoints (check `HeroSection.astro` / `global.css` during implementation to align exactly).

## Accessibility note — deliberate `prefers-reduced-motion` override

**The signature animates regardless of `prefers-reduced-motion`.** This is a considered choice — the animation is the feature. Honoring the media query here would silently collapse the feature for a subset of users, which defeats the exercise.

Tradeoff: users with vestibular sensitivities who have the OS preference set will see the animation. The movement is localized (a small area in the viewport, no full-screen motion, no parallax, no looping), so the impact is limited. If a user complains, we can revisit (e.g. shorter animation duration, or fall back to a pre-drawn static SVG) without redesigning.

## ASCII background

Unchanged. `ascii-background.ts` continues to render in its own layer behind the hero. The new component occupies the same DOM slot as the old `PretextHero` and does not overlap the background layer's z-index.

## Not in scope

- Deleting `PretextHero.tsx` — revert path stays open until the user accepts.
- Honoring `prefers-reduced-motion` — deliberately overridden (see above).
- Interactive replay button / click-to-replay — replay-on-scrollback covers the use case.
- Caching bundle output across builds — the generator is external, run once; no build-time concern.
- Animation on other text sections (nav, section headers). Hero only.
- Server-side pre-rendering of the Tegaki output. Client island is sufficient — the hero is above the fold, JS payload is small (~90 KB bundle + ~50 KB glyph data), no SSR complexity needed for a single element.

## Verification checklist

Before claiming complete:

1. Dev server (`pnpm dev` from `site/`) shows hero with Nothing You Could Do signature animating on load, at approximately 1.8× speed.
2. Scroll down past the hero, then back up — animation replays once the hero is ≥50% visible.
3. Resize viewport below 720px — signature scales down without overflowing.
4. `pnpm exec tsc --noEmit` passes.
5. `pnpm build` succeeds and the built site renders identically in `pnpm preview`.
6. Network tab: TTF and JSON are loaded as assets by Vite, not fetched inline.
7. No console errors.
