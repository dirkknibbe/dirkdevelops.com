# Tegaki Signature Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Pretext-animated "Dirk Knibbe" hero text with a Tegaki-powered handwritten signature that draws itself on mount and replays every time the hero scrolls back into view.

**Architecture:** Pre-generated Tegaki bundle for the "Nothing You Could Do" Google Font (already produced by the user, sitting at `/Users/dirkknibbe/Desktop/dirkdevelops.com/nothing-you-could-do.zip`) is dropped into `site/src/fonts/` and consumed by a new `SignatureHero.tsx` React component that wraps Tegaki's React `TegakiRenderer`. The component mounts as an Astro client island (`client:load`), using an `IntersectionObserver` to remount the renderer each time the hero re-enters the viewport (fresh remount = fresh animation).

**Tech Stack:** Astro 6, React 19, TypeScript (strict), Tegaki 0.15.x, `pnpm`. No test framework in the project — verification is `pnpm exec tsc --noEmit`, `pnpm build`, and manual browser checks.

**Source spec:** `docs/superpowers/specs/2026-04-21-tegaki-signature-hero-design.md`

---

## File Structure

**Create:**
- `site/src/fonts/nothing-you-could-do/bundle.ts` — generator-produced bundle entry (imports TTF + JSON)
- `site/src/fonts/nothing-you-could-do/glyphData.json` — generator-produced stroke data
- `site/src/fonts/nothing-you-could-do/nothing-you-could-do.ttf` — TTF referenced by bundle for text layout
- `site/src/components/SignatureHero.tsx` — wrapper component with replay-on-scrollback logic

**Modify:**
- `site/package.json` — add `tegaki` dependency
- `site/src/components/HeroSection.astro` — swap `PretextHero` → `SignatureHero`
- `site/src/styles/global.css` — add Tegaki-specific sizing rule (leave `.hero-name` rule alone; add a nested rule for the rendered SVG)

**Keep (do not delete):**
- `site/src/components/PretextHero.tsx` — untouched; acts as a one-line revert path in `HeroSection.astro`

---

## Task 1: Install Tegaki

**Files:**
- Modify: `site/package.json`
- Modify: `site/pnpm-lock.yaml` (auto-generated; treat as modified)

- [ ] **Step 1: Install tegaki from the `site/` workspace**

Run from `/Users/dirkknibbe/Desktop/dirkdevelops.com/site`:

```bash
pnpm add tegaki
```

Expected: installs `tegaki@0.15.x` (or newer) into `site/package.json` and updates the lockfile. If a lockfile isn't already present (the project currently has `package-lock.json`, not `pnpm-lock.yaml`), pnpm will create `pnpm-lock.yaml`. Either is fine — keep whichever pnpm produces.

- [ ] **Step 2: Verify install**

Run from `site/`:

```bash
pnpm ls tegaki
```

Expected output contains a line like `tegaki 0.15.0` (version may be newer; any 0.15+ is fine).

- [ ] **Step 3: Quick type-import sanity check**

Run from `site/`:

```bash
pnpm exec tsc --noEmit
```

Expected: zero errors. (This just proves the new dependency hasn't broken the existing tree — we haven't imported anything from it yet.)

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/package.json site/pnpm-lock.yaml site/package-lock.json 2>/dev/null || true
git commit -m "$(cat <<'EOF'
chore: add tegaki dependency for signature hero

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add the Nothing You Could Do font bundle

**Files:**
- Create: `site/src/fonts/nothing-you-could-do/bundle.ts`
- Create: `site/src/fonts/nothing-you-could-do/glyphData.json`
- Create: `site/src/fonts/nothing-you-could-do/nothing-you-could-do.ttf`

- [ ] **Step 1: Create the target directory**

```bash
mkdir -p /Users/dirkknibbe/Desktop/dirkdevelops.com/site/src/fonts/nothing-you-could-do
```

- [ ] **Step 2: Unzip the user-supplied bundle into the target directory**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
unzip -o nothing-you-could-do.zip -d /tmp/nycd-unzipped
cp /tmp/nycd-unzipped/nothing-you-could-do/bundle.ts \
   /tmp/nycd-unzipped/nothing-you-could-do/glyphData.json \
   /tmp/nycd-unzipped/nothing-you-could-do/nothing-you-could-do.ttf \
   site/src/fonts/nothing-you-could-do/
ls -la site/src/fonts/nothing-you-could-do/
```

Expected: three files present — `bundle.ts` (~480 bytes), `glyphData.json` (~50 KB), `nothing-you-could-do.ttf` (~27 KB).

- [ ] **Step 3: Verify the bundle typechecks as-is**

The generator-emitted `bundle.ts` uses import attributes (`with { type: 'url' }`, `with { type: 'json' }`). TypeScript strict mode + Astro's resolver should handle these. Run from `site/`:

```bash
pnpm exec tsc --noEmit
```

Expected: zero errors. If there are errors about the import attributes or module resolution, fix them before continuing — the rest of the plan assumes `bundle.ts` is importable as-is.

Common fix if TS complains about import attributes: ensure `tsconfig.json` has `"module": "ESNext"` or newer via `astro/tsconfigs/strict`. It already extends that config, so this should Just Work — but note the possibility.

- [ ] **Step 4: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/fonts/nothing-you-could-do/
git commit -m "$(cat <<'EOF'
feat: add Nothing You Could Do Tegaki bundle

Generated via Tegaki's web generator with default settings. Powers the
new handwritten signature hero.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `SignatureHero.tsx`

**Files:**
- Create: `site/src/components/SignatureHero.tsx`

- [ ] **Step 1: Write the component**

Create `site/src/components/SignatureHero.tsx` with this exact content:

```tsx
import { useEffect, useRef, useState } from 'react';
import { TegakiRenderer } from 'tegaki/react';
import bundle from '../fonts/nothing-you-could-do/bundle';

const SPEED = 1.8;
const INTERSECTION_THRESHOLD = 0.5;

export default function SignatureHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let wasVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const isVisible =
            entry.isIntersecting &&
            entry.intersectionRatio >= INTERSECTION_THRESHOLD;
          if (isVisible && !wasVisible) {
            setMountKey((k) => k + 1);
          }
          wasVisible = isVisible;
        }
      },
      { threshold: [INTERSECTION_THRESHOLD] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-name"
      aria-label="Dirk Knibbe"
      role="heading"
      aria-level={1}
    >
      <TegakiRenderer
        key={mountKey}
        font={bundle}
        time={{ mode: 'uncontrolled', speed: SPEED, loop: false }}
        style={{ fontSize: 'inherit', color: 'inherit' }}
      >
        Dirk Knibbe
      </TegakiRenderer>
    </div>
  );
}
```

Why the `mountKey` pattern: Tegaki's `update({ time })` does not reset the internal clock once an animation completes. Changing the React `key` unmounts and remounts the component, which forces a fresh engine instance and a fresh animation. This is the same destroy-and-recreate pattern verified in the visual companion preview.

Why `wasVisible = true` initially: the initial TegakiRenderer mount (key=0) plays the first animation. We don't want the IntersectionObserver's first callback (which fires immediately after `observe()`) to *also* bump the key and cause a double-start flicker. Treating the initial state as "already visible" skips that redundant bump.

- [ ] **Step 2: Typecheck**

Run from `site/`:

```bash
pnpm exec tsc --noEmit
```

Expected: zero errors. If there are errors, they'll most likely be:
- `TegakiRenderer` not exported from `tegaki/react` — check the installed version. Docs show this import.
- Bundle type mismatch — check `bundle.ts` still exports `default` typed as `TegakiBundle`.

- [ ] **Step 3: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/SignatureHero.tsx
git commit -m "$(cat <<'EOF'
feat: add SignatureHero component

Wraps Tegaki's React renderer with IntersectionObserver-driven replay:
every time the hero re-enters the viewport at >=50% visibility, the
component remounts for a fresh animation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wire `SignatureHero` into `HeroSection.astro` and size it

**Files:**
- Modify: `site/src/components/HeroSection.astro`
- Modify: `site/src/styles/global.css`

- [ ] **Step 1: Update the Astro component**

Edit `site/src/components/HeroSection.astro`. Replace line 2:

```diff
- import PretextHero from './PretextHero.tsx';
+ import SignatureHero from './SignatureHero.tsx';
```

And line 8:

```diff
-     <PretextHero client:load />
+     <SignatureHero client:load />
```

All other lines in this file remain unchanged. `PretextHero.tsx` stays in the tree (revert path).

- [ ] **Step 2: Update `.hero-name` sizing for the signature**

The current `.hero-name` rule (line 147 of `site/src/styles/global.css`) clamps font-size to 44–72px. The signature looks right at a larger scale (140px desktop was user-validated). Change the `.hero-name` font-size rule:

Edit `site/src/styles/global.css`, lines 147–154 (find the `.hero-name {` block):

```diff
 .hero-name {
-  font-size: clamp(44px, 8vw, 72px);
+  font-size: clamp(56px, 11vw, 140px);
   font-weight: 200;
   letter-spacing: -3px;
   line-height: 1;
   margin-bottom: 8px;
   min-height: 1.2em;
 }
```

The `min-height: 1.2em` line stays — it prevents layout shift while the Tegaki SVG is still initializing on the client.

Also add a new rule immediately after the `.hero-name` block to constrain the SVG Tegaki injects (TegakiRenderer creates an SVG child whose width inherits from the container; we want it to not overflow horizontally on narrow screens):

```css
.hero-name svg {
  display: block;
  max-width: 100%;
  height: auto;
  overflow: visible;
}
```

- [ ] **Step 3: Start the dev server and visually verify**

Run from `site/`:

```bash
pnpm dev
```

Open the URL printed by Astro (typically `http://localhost:4321`). Check the following:

1. **On load:** the hero shows "Dirk Knibbe" drawing itself stroke-by-stroke.
2. **Speed feels close to 1.8×** (brisk but readable).
3. **No outline flash, no fade-in** — ink lays down as strokes.
4. **No console errors.**
5. **ASCII background still renders** behind the hero unchanged.
6. **The rule and description below the name appear** in their normal positions.
7. **Scroll past the hero, then back up** — the animation replays from scratch when the hero is ≥50% visible.
8. **Resize to narrow (~375px viewport)** — name scales down cleanly, no horizontal overflow.
9. **Resize to wide (~1600px viewport)** — name caps at 140px (clamp upper bound).

If any of these fail, fix before continuing. Keep the dev server running; re-hot-reloads on every edit.

- [ ] **Step 4: Run typecheck and build**

Stop (or leave running) dev server. Run from `site/`:

```bash
pnpm exec tsc --noEmit
```

Expected: zero errors.

Then:

```bash
pnpm build
```

Expected: build succeeds. Note any size warnings for the bundle (`glyphData.json` is ~50 KB, TTF ~27 KB — these will appear in the build output but are acceptable for a single hero).

- [ ] **Step 5: Verify the production build**

Run from `site/`:

```bash
pnpm preview
```

Open the preview URL (typically `http://localhost:4322`). Repeat checks 1, 2, 3, 5, 7 from Step 3. (The production build inlines and minifies differently than dev; this catches asset-path regressions.)

- [ ] **Step 6: Commit**

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add site/src/components/HeroSection.astro site/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat: swap Pretext hero for Tegaki signature

Nothing You Could Do, 1.8x speed, no effects. Replays whenever the
hero re-enters the viewport at >=50% visibility. PretextHero.tsx is
kept in-tree as a revert path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Cleanup and hand-off

**Files:**
- Delete: `/Users/dirkknibbe/Desktop/dirkdevelops.com/nothing-you-could-do.zip` (source bundle, now committed as extracted files)

- [ ] **Step 1: Remove the now-redundant zip from the repo root**

The zip lives at the repo root and isn't gitignored. Either delete it or gitignore it. Prefer delete — the extracted contents are now the canonical source.

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
rm nothing-you-could-do.zip
```

- [ ] **Step 2: Final verification**

Run from `site/`:

```bash
pnpm exec tsc --noEmit && pnpm build
```

Both must succeed.

- [ ] **Step 3: Final commit (if the zip was tracked)**

If `git status` shows the zip as removed (i.e. it was previously tracked), commit the removal:

```bash
cd /Users/dirkknibbe/Desktop/dirkdevelops.com
git add -A
git commit -m "$(cat <<'EOF'
chore: remove generator source zip; extracted bundle is canonical

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If `git status` is clean (zip was never tracked), skip this step.

---

## Verification summary

After Task 5 completes:
- `pnpm exec tsc --noEmit` passes.
- `pnpm build` succeeds with no errors.
- Dev server shows signature animating in place of the old Pretext text.
- Signature replays on scroll-back to hero.
- No console errors in browser.
- `PretextHero.tsx` untouched (revert path intact).
- ASCII background, nav, other hero content all unchanged visually.
