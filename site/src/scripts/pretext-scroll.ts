/**
 * Pretext-powered scroll effects for section labels and project titles.
 * Uses Pretext's text measurement to compute per-character positioning,
 * then applies transforms on scroll/hover for physics-informed text effects.
 */
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

interface CharElement {
  span: HTMLSpanElement;
  baseX: number;
  char: string;
  width: number;
}

function splitIntoCharSpans(el: HTMLElement): CharElement[] {
  const text = el.textContent || '';
  if (!text.trim()) return [];

  const computedStyle = getComputedStyle(el);
  const fontSize = computedStyle.fontSize;
  const fontWeight = computedStyle.fontWeight;
  const fontFamily = computedStyle.fontFamily;
  const font = `${fontWeight} ${fontSize} ${fontFamily}`;

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

    chars.push({
      span: document.createElement('span'),
      baseX: xOffset,
      char: ch,
      width: charWidth,
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
    c.span.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    c.span.style.willChange = 'transform';
    el.appendChild(c.span);
  }

  return chars;
}

function initSectionLabels() {
  const labels = document.querySelectorAll<HTMLElement>('.section-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  labels.forEach((label) => {
    const chars = splitIntoCharSpans(label);
    if (chars.length === 0 || reducedMotion) return;

    // Initially compress characters slightly
    for (const c of chars) {
      c.span.style.transform = 'scaleX(0.92)';
      c.span.style.opacity = '0.7';
      c.span.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease';
    }

    // Observe when label scrolls into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger each character expanding to full width
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
  });
}

function initProjectTitles() {
  const cards = document.querySelectorAll<HTMLElement>('.project-card');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  cards.forEach((card) => {
    const title = card.querySelector<HTMLElement>('.project-title');
    if (!title || reducedMotion) return;

    const chars = splitIntoCharSpans(title);
    if (chars.length === 0) return;

    // On hover, use Pretext-measured widths to apply subtle per-character compression
    // Characters at the center compress more than edges, creating a "squeeze" effect
    card.addEventListener('mouseenter', () => {
      const mid = chars.length / 2;
      chars.forEach((c, i) => {
        const distFromCenter = Math.abs(i - mid) / mid; // 0 at center, 1 at edges
        const squeeze = 0.96 + distFromCenter * 0.04; // center: 0.96, edges: 1.0
        const shift = (1 - squeeze) * c.width * -0.5;
        c.span.style.transform = `scaleX(${squeeze}) translateX(${shift}px)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      chars.forEach((c) => {
        c.span.style.transform = 'scaleX(1) translateX(0px)';
      });
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSectionLabels();
    initProjectTitles();
  });
} else {
  initSectionLabels();
  initProjectTitles();
}
