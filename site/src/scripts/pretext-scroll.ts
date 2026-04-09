/**
 * Pretext-powered scroll effects + cursor-proximity weight shifting.
 * Uses Pretext's text measurement to compute per-character positioning,
 * then applies transforms on scroll/hover and cursor-proximity weight effects.
 */
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

// ---- Cursor proximity config ----
const PROXIMITY_RADIUS = 150; // px
const WEIGHT_DEFAULT = 400;
const WEIGHT_HEAVY = 700;
const OPACITY_DEFAULT = 0.7;
const OPACITY_HEAVY = 1.0;

interface CharElement {
  span: HTMLSpanElement;
  baseX: number;
  char: string;
  width: number;
  widthHeavy: number; // width at heavy weight
}

// Global mouse position
let globalMouseX = -9999;
let globalMouseY = -9999;

function splitIntoCharSpans(el: HTMLElement, measureBothWeights: boolean = false): CharElement[] {
  const text = el.textContent || '';
  if (!text.trim()) return [];

  const computedStyle = getComputedStyle(el);
  const fontSize = computedStyle.fontSize;
  const fontWeight = computedStyle.fontWeight;
  const fontFamily = computedStyle.fontFamily;
  const font = `${fontWeight} ${fontSize} ${fontFamily}`;
  const heavyFont = `${WEIGHT_HEAVY} ${fontSize} ${fontFamily}`;

  // Use Pretext to measure the full text and each character
  const prepared = prepareWithSegments(text, font);
  const containerWidth = el.clientWidth || 9999;
  const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(fontSize) * 1.4;
  const { lines } = layoutWithLines(prepared, containerWidth, lineHeight);

  if (lines.length === 0) return [];

  const chars: CharElement[] = [];
  const lineText = lines[0].text; // These are single-line labels

  // Measure each character individually with Pretext
  let xOffset = 0;
  for (let i = 0; i < lineText.length; i++) {
    const ch = lineText[i];
    const charPrepared = prepareWithSegments(ch === ' ' ? '\u00A0' : ch, font);
    const charLayout = layoutWithLines(charPrepared, 9999, lineHeight);
    const charWidth = charLayout.lines.length > 0 ? charLayout.lines[0].width : 0;

    let charWidthHeavy = charWidth;
    if (measureBothWeights) {
      const charPreparedHeavy = prepareWithSegments(ch === ' ' ? '\u00A0' : ch, heavyFont);
      const charLayoutHeavy = layoutWithLines(charPreparedHeavy, 9999, lineHeight);
      charWidthHeavy = charLayoutHeavy.lines.length > 0 ? charLayoutHeavy.lines[0].width : 0;
    }

    chars.push({
      span: document.createElement('span'),
      baseX: xOffset,
      char: ch,
      width: charWidth,
      widthHeavy: charWidthHeavy,
    });
    xOffset += charWidth;
  }

  // Replace element content with positioned spans
  const originalDisplay = computedStyle.display;
  el.textContent = '';
  el.style.position = 'relative';
  el.style.display = originalDisplay === 'inline' ? 'inline-block' : originalDisplay;
  el.style.whiteSpace = 'nowrap';

  // Store original text for accessibility
  el.setAttribute('aria-label', text);

  for (const c of chars) {
    c.span.textContent = c.char === ' ' ? '\u00A0' : c.char;
    c.span.style.display = 'inline-block';
    c.span.style.transition = 'font-weight 0.25s ease, opacity 0.25s ease';
    c.span.style.willChange = 'font-weight, opacity';
    el.appendChild(c.span);
  }

  return chars;
}

function initSectionLabels() {
  const labels = document.querySelectorAll<HTMLElement>('.section-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  labels.forEach((label) => {
    const chars = splitIntoCharSpans(label, !reducedMotion);
    if (chars.length === 0) return;

    if (!reducedMotion) {
      // Initially compress characters slightly
      for (const c of chars) {
        c.span.style.transform = 'scaleX(0.92)';
        c.span.style.opacity = '0.7';
        c.span.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, font-weight 0.25s ease';
      }

      // Observe when label scrolls into view
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              chars.forEach((c, i) => {
                setTimeout(() => {
                  c.span.style.transform = 'scaleX(1)';
                  c.span.style.opacity = '1';
                }, i * 30);
              });
              observer.unobserve(label);
            }
          });
        },
        { threshold: 0.5 },
      );
      observer.observe(label);

      // Register for cursor proximity updates
      registerProximityTarget(label, chars);
    }
  });
}

function initProjectTitles() {
  const cards = document.querySelectorAll<HTMLElement>('.project-card');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  cards.forEach((card) => {
    const title = card.querySelector<HTMLElement>('.project-title');
    if (!title) return;

    const chars = splitIntoCharSpans(title, !reducedMotion);
    if (chars.length === 0) return;

    if (!reducedMotion) {
      // On hover, use Pretext-measured widths to apply subtle per-character compression
      card.addEventListener('mouseenter', () => {
        const mid = chars.length / 2;
        chars.forEach((c, i) => {
          const distFromCenter = Math.abs(i - mid) / mid;
          const squeeze = 0.96 + distFromCenter * 0.04;
          const shift = (1 - squeeze) * c.width * -0.5;
          c.span.style.transform = `scaleX(${squeeze}) translateX(${shift}px)`;
        });
      });

      card.addEventListener('mouseleave', () => {
        chars.forEach((c) => {
          c.span.style.transform = 'scaleX(1) translateX(0px)';
        });
      });

      // Register for cursor proximity updates
      registerProximityTarget(title, chars);
    }
  });
}

// ---- Cursor Proximity System ----

interface ProximityTarget {
  el: HTMLElement;
  chars: CharElement[];
}

const proximityTargets: ProximityTarget[] = [];

function registerProximityTarget(el: HTMLElement, chars: CharElement[]) {
  proximityTargets.push({ el, chars });
}

function updateProximityEffects() {
  for (const target of proximityTargets) {
    const rect = target.el.getBoundingClientRect();

    for (const c of target.chars) {
      // Get the center of this character in viewport coords
      const charRect = c.span.getBoundingClientRect();
      const charCenterX = charRect.left + charRect.width / 2;
      const charCenterY = charRect.top + charRect.height / 2;

      const dx = globalMouseX - charCenterX;
      const dy = globalMouseY - charCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PROXIMITY_RADIUS) {
        // Proximity factor: 1 at cursor, 0 at edge of radius
        const factor = 1 - dist / PROXIMITY_RADIUS;
        // Ease the factor for smoother falloff
        const eased = factor * factor;

        const weight = Math.round(WEIGHT_DEFAULT + (WEIGHT_HEAVY - WEIGHT_DEFAULT) * eased);
        const opacity = OPACITY_DEFAULT + (OPACITY_HEAVY - OPACITY_DEFAULT) * eased;

        c.span.style.fontWeight = String(weight);
        c.span.style.opacity = String(opacity);

        // Compensate for width change to prevent layout shift
        const widthDiff = (c.widthHeavy - c.width) * eased;
        if (Math.abs(widthDiff) > 0.1) {
          c.span.style.letterSpacing = `${-widthDiff}px`;
        }
      } else {
        c.span.style.fontWeight = '';
        c.span.style.opacity = '';
        c.span.style.letterSpacing = '';
      }
    }
  }
}

let proximityRafId: number | null = null;

function proximityLoop() {
  updateProximityEffects();
  proximityRafId = requestAnimationFrame(proximityLoop);
}

function initCursorProximity() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  document.addEventListener('mousemove', (e) => {
    globalMouseX = e.clientX;
    globalMouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    globalMouseX = -9999;
    globalMouseY = -9999;
  });

  // Start the proximity update loop
  proximityLoop();
}

// Initialize when DOM is ready
function initAll() {
  initSectionLabels();
  initProjectTitles();
  initCursorProximity();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
