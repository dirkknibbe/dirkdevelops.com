/**
 * Full-page ASCII particle background.
 * Renders a muted, living ASCII texture behind all content.
 * Scroll position drives the attractor, creating subtle movement as you navigate.
 */

// ---- Config ----
const CHAR_W = 6.2; // approximate width of a monospace char at 9px
const CHAR_H = 10;  // line-height
const PARTICLE_COUNT = 120;
const DAMPING = 0.97;
const JITTER = 0.4;
const BRIGHTNESS_DECAY = 0.78;
const GAUSSIAN_RADIUS = 3;
const ATTRACTOR_STRENGTH = 0.005; // weaker — particles spread more
const PARTICLE_STAMP_INTENSITY = 0.4;
const ATTRACTOR_STAMP_INTENSITY = 0.5;

const PALETTE_CHARS = ' .`\'-,:;!~+<>=?*^"/\\|(){}[]#$@%&';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function measureCharBrightness(char: string, font: string, size: number): number {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.fillText(char, 0, 0);
  const data = ctx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i];
  return sum / (size * size * 255);
}

function buildPalette(): { char: string; brightness: number }[] {
  const size = 14;
  const font = `400 ${size}px ui-monospace, "SF Mono", Monaco, Consolas, monospace`;
  const entries: { char: string; brightness: number }[] = [];
  for (const ch of PALETTE_CHARS) {
    entries.push({ char: ch, brightness: measureCharBrightness(ch, font, size) });
  }
  entries.sort((a, b) => a.brightness - b.brightness);
  return entries;
}

function buildLookupTable(palette: { char: string; brightness: number }[]): string[] {
  const table: string[] = new Array(256);
  for (let i = 0; i < 256; i++) {
    const target = i / 255;
    let best = 0;
    let bestDist = Infinity;
    for (let j = 0; j < palette.length; j++) {
      const dist = Math.abs(palette[j].brightness - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = j;
      }
    }
    table[i] = palette[best].char;
  }
  return table;
}

function splatGaussian(
  field: Float32Array, cols: number, rows: number,
  cx: number, cy: number, radius: number, intensity: number,
) {
  const r = Math.ceil(radius * 2);
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(cols - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(rows - 1, Math.ceil(cy + r));
  const invR2 = 1 / (radius * radius);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const g = Math.exp(-(dx * dx + dy * dy) * invR2) * intensity;
      field[y * cols + x] = Math.min(1, field[y * cols + x] + g);
    }
  }
}

function init() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || window.innerWidth < 768) return;

  // Compute grid to fill viewport
  const COLS = Math.floor(window.innerWidth / CHAR_W);
  const ROWS = Math.floor(window.innerHeight / CHAR_H);

  const palette = buildPalette();
  const lookup = buildLookupTable(palette);
  let field = new Float32Array(COLS * ROWS);

  // Create particles spread across the full grid
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * COLS,
      y: Math.random() * ROWS,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    });
  }

  // Create the background container
  const bg = document.createElement('div');
  bg.className = 'ascii-bg';
  bg.setAttribute('aria-hidden', 'true');

  // Create cell grid filling the viewport
  const cells: HTMLSpanElement[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'ascii-bg-row';
    const rowCells: HTMLSpanElement[] = [];
    for (let c = 0; c < COLS; c++) {
      const span = document.createElement('span');
      span.textContent = '\u00A0';
      rowDiv.appendChild(span);
      rowCells.push(span);
    }
    bg.appendChild(rowDiv);
    cells.push(rowCells);
  }

  document.body.appendChild(bg);

  // Track scroll
  let scrollProgress = 0;
  const updateScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  let t = 0;

  function animate() {
    t += 0.016;

    // Decay
    for (let i = 0; i < field.length; i++) field[i] *= BRIGHTNESS_DECAY;

    // 4 attractors spread across the grid, orbiting on different paths
    // Scroll shifts their vertical positions
    const scrollOffset = scrollProgress * ROWS * 0.5;
    const attractors = [
      {
        x: (Math.sin(t * 0.4) * 0.3 + 0.25) * COLS,
        y: ((Math.sin(t * 0.6) * 0.3 + 0.3) * ROWS + scrollOffset) % ROWS,
      },
      {
        x: (Math.cos(t * 0.3) * 0.3 + 0.75) * COLS,
        y: ((Math.cos(t * 0.5 + 1) * 0.3 + 0.7) * ROWS + scrollOffset * 0.7) % ROWS,
      },
      {
        x: (Math.sin(t * 0.25 + 3) * 0.4 + 0.5) * COLS,
        y: ((Math.sin(t * 0.35 + 2) * 0.35 + 0.5) * ROWS + scrollOffset * 1.2) % ROWS,
      },
      {
        x: (Math.cos(t * 0.5 + 5) * 0.35 + 0.5) * COLS,
        y: ((Math.cos(t * 0.45 + 4) * 0.25 + 0.15) * ROWS + scrollOffset * 0.4) % ROWS,
      },
    ];

    // Update particles — each attracted to nearest attractor
    for (const p of particles) {
      let nearDist = Infinity;
      let ax = p.x, ay = p.y;
      for (const a of attractors) {
        const d = (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
        if (d < nearDist) { nearDist = d; ax = a.x; ay = a.y; }
      }

      const dx = ax - p.x;
      const dy = ay - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      p.vx += (dx / dist) * ATTRACTOR_STRENGTH * dist;
      p.vy += (dy / dist) * ATTRACTOR_STRENGTH * dist;
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.vx += (Math.random() - 0.5) * JITTER;
      p.vy += (Math.random() - 0.5) * JITTER;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < 0) p.x += COLS;
      if (p.x >= COLS) p.x -= COLS;
      if (p.y < 0) p.y += ROWS;
      if (p.y >= ROWS) p.y -= ROWS;

      splatGaussian(field, COLS, ROWS, p.x, p.y, GAUSSIAN_RADIUS, PARTICLE_STAMP_INTENSITY);
    }

    // Splat attractors
    for (const a of attractors) {
      splatGaussian(field, COLS, ROWS, a.x, a.y, GAUSSIAN_RADIUS * 1.5, ATTRACTOR_STAMP_INTENSITY);
    }

    // Render
    for (let r = 0; r < ROWS; r++) {
      const rowCells = cells[r];
      if (!rowCells) continue;
      for (let c = 0; c < COLS; c++) {
        const b = field[r * COLS + c];
        const span = rowCells[c];
        if (!span) continue;

        if (b < 0.02) {
          if (span.textContent !== '\u00A0') span.textContent = '\u00A0';
        } else {
          const idx = Math.min(255, Math.floor(b * 255));
          const char = lookup[idx];
          const displayed = char === ' ' ? '\u00A0' : char;
          if (span.textContent !== displayed) span.textContent = displayed;
        }
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
