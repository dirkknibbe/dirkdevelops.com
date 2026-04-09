import { useEffect, useRef, useState, useCallback } from 'react';
// ---- Configuration ----
const COLS = 72;
const ROWS = 22;
const PARTICLE_COUNT = 90;
const DAMPING = 0.97;
const JITTER = 0.3;
const BRIGHTNESS_DECAY = 0.82;
const GAUSSIAN_RADIUS = 3;
const NAME_BRIGHTNESS = 0.35;
const ATTRACTOR_STRENGTH = 0.015;
const PARTICLE_STAMP_INTENSITY = 0.6;
const ATTRACTOR_STAMP_INTENSITY = 0.9;

// Printable ASCII palette (sorted by visual weight later)
const PALETTE_CHARS = ' .`\'-,:;!~+<>=?*^"/\\|(){}[]#$@%&';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ---- Utility: measure character brightness via offscreen canvas ----
function measureCharBrightness(
  char: string,
  font: string,
  size: number,
): number {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.fillText(char, 0, 0);
  const data = ctx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) {
    sum += data[i];
  }
  return sum / (size * size * 255);
}

// ---- Build brightness-sorted palette ----
function buildPalette(): { char: string; brightness: number }[] {
  const size = 16;
  const font = `500 ${size}px ui-monospace, "SF Mono", Monaco, Consolas, monospace`;
  const entries: { char: string; brightness: number }[] = [];

  for (const ch of PALETTE_CHARS) {
    const b = measureCharBrightness(ch, font, size);
    entries.push({ char: ch, brightness: b });
  }

  entries.sort((a, b) => a.brightness - b.brightness);
  return entries;
}

// ---- Build 256-entry lookup table ----
function buildLookupTable(
  palette: { char: string; brightness: number }[],
): string[] {
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

// ---- Render name as brightness target field ----
function renderNameTarget(
  cols: number,
  rows: number,
): Float32Array {
  const canvas = new OffscreenCanvas(cols, rows);
  const ctx = canvas.getContext('2d')!;

  const fontSize = Math.floor(rows * 0.65);
  ctx.font = `200 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText('Dirk Knibbe', cols / 2, rows / 2);

  const data = ctx.getImageData(0, 0, cols, rows).data;
  const field = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    field[i] = data[i * 4 + 3] / 255;
  }
  return field;
}

// ---- Gaussian stamp ----
function splatGaussian(
  field: Float32Array,
  cols: number,
  rows: number,
  cx: number,
  cy: number,
  radius: number,
  intensity: number,
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
      const d2 = dx * dx + dy * dy;
      const g = Math.exp(-d2 * invR2) * intensity;
      field[y * cols + x] = Math.min(1, field[y * cols + x] + g);
    }
  }
}

// ---- Safely escape a character for text node insertion ----
function safeChar(ch: string): string {
  return ch === ' ' ? '\u00A0' : ch;
}

export default function PretextHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  const text = 'Dirk Knibbe';

  // Refs for simulation state
  const paletteRef = useRef<{ char: string; brightness: number }[]>([]);
  const lookupRef = useRef<string[]>([]);
  const nameFieldRef = useRef<Float32Array>(new Float32Array(0));
  const brightnessFieldRef = useRef<Float32Array>(new Float32Array(0));
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });
  const timeRef = useRef(0);
  const colsRef = useRef(COLS);
  const rowsRef = useRef(ROWS);
  // 2D array of span elements for each cell
  const cellsRef = useRef<HTMLSpanElement[][]>([]);
  const initedRef = useRef(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check mobile
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Initialize simulation
  const init = useCallback(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    const cols = colsRef.current;
    const rows = rowsRef.current;

    // Build palette and lookup
    paletteRef.current = buildPalette();
    lookupRef.current = buildLookupTable(paletteRef.current);

    // Build name target field
    nameFieldRef.current = renderNameTarget(cols, rows);

    // Init brightness field
    brightnessFieldRef.current = new Float32Array(cols * rows);

    // Init particles
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * cols,
        y: Math.random() * rows,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }
    particlesRef.current = particles;

    // Create cell elements using DOM API (no innerHTML)
    const grid = gridRef.current;
    if (grid) {
      grid.textContent = '';
      const cells: HTMLSpanElement[][] = [];
      for (let r = 0; r < rows; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'ascii-row';
        const rowCells: HTMLSpanElement[] = [];
        for (let c = 0; c < cols; c++) {
          const span = document.createElement('span');
          span.className = 'w3 a1';
          span.textContent = ' ';
          rowDiv.appendChild(span);
          rowCells.push(span);
        }
        grid.appendChild(rowDiv);
        cells.push(rowCells);
      }
      cellsRef.current = cells;
    }
  }, []);

  // Weight class from brightness
  const getWeightClass = (b: number): string => {
    if (b > 0.6) return 'w8';
    if (b > 0.3) return 'w5';
    return 'w3';
  };

  // Opacity level from brightness (1-10)
  const getOpacityLevel = (b: number): number => {
    return Math.max(1, Math.min(10, Math.ceil(b * 10)));
  };

  // Animation loop
  const animate = useCallback(() => {
    const cols = colsRef.current;
    const rows = rowsRef.current;
    const field = brightnessFieldRef.current;
    const nameField = nameFieldRef.current;
    const particles = particlesRef.current;
    const lookup = lookupRef.current;
    const cells = cellsRef.current;
    const mouse = mouseRef.current;

    if (!field.length || !lookup.length || !cells.length) return;

    timeRef.current += 0.016;
    const t = timeRef.current;

    // --- Decay brightness field ---
    for (let i = 0; i < field.length; i++) {
      field[i] *= BRIGHTNESS_DECAY;
    }

    // --- Lissajous attractor ---
    const lx = (Math.sin(t * 0.7) * 0.4 + 0.5) * cols;
    const ly = (Math.sin(t * 1.1 + 1.3) * 0.35 + 0.5) * rows;

    // --- Mouse attractor position in grid coords ---
    const mx = mouse.x * cols;
    const my = mouse.y * rows;

    // --- Update particles ---
    for (const p of particles) {
      let ax = lx,
        ay = ly;
      if (mouse.active) {
        const dMouse =
          (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my);
        const dLiss =
          (p.x - lx) * (p.x - lx) + (p.y - ly) * (p.y - ly);
        if (dMouse < dLiss) {
          ax = mx;
          ay = my;
        }
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

      if (p.x < 0) p.x += cols;
      if (p.x >= cols) p.x -= cols;
      if (p.y < 0) p.y += rows;
      if (p.y >= rows) p.y -= rows;

      splatGaussian(
        field,
        cols,
        rows,
        p.x,
        p.y,
        GAUSSIAN_RADIUS,
        PARTICLE_STAMP_INTENSITY,
      );
    }

    // Splat attractors
    splatGaussian(field, cols, rows, lx, ly, GAUSSIAN_RADIUS * 1.5, ATTRACTOR_STAMP_INTENSITY);
    if (mouse.active) {
      splatGaussian(field, cols, rows, mx, my, GAUSSIAN_RADIUS * 2, ATTRACTOR_STAMP_INTENSITY);
    }

    // --- Add name target field ---
    for (let i = 0; i < field.length; i++) {
      const nameVal = nameField[i] * NAME_BRIGHTNESS;
      if (nameVal > field[i]) {
        field[i] = nameVal;
      }
    }

    // --- Render to DOM using pre-created span elements ---
    for (let r = 0; r < rows; r++) {
      const rowCells = cells[r];
      if (!rowCells) continue;
      for (let c = 0; c < cols; c++) {
        const b = field[r * cols + c];
        const span = rowCells[c];
        if (!span) continue;

        if (b < 0.01) {
          if (span.textContent !== ' ') {
            span.textContent = ' ';
            span.className = 'w3 a1';
          }
        } else {
          const idx = Math.min(255, Math.floor(b * 255));
          const char = lookup[idx];
          const displayed = safeChar(char);
          const wc = getWeightClass(b);
          const al = getOpacityLevel(b);
          const cls = `${wc} a${al}`;

          if (span.textContent !== displayed) {
            span.textContent = displayed;
          }
          if (span.className !== cls) {
            span.className = cls;
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Mouse tracking
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isMobile, prefersReducedMotion]);

  // Start/stop animation
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    init();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isMobile, prefersReducedMotion, init, animate]);

  // Adjust cols on resize
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const onResize = () => {
      initedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const container = containerRef.current;
      if (container) {
        const width = container.clientWidth;
        colsRef.current = Math.max(40, Math.min(100, Math.floor(width / 9)));
        rowsRef.current = Math.max(14, Math.min(28, Math.floor(colsRef.current * 0.3)));
      }

      init();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [isMobile, prefersReducedMotion, init, animate]);

  if (isMobile || prefersReducedMotion) {
    return (
      <div
        className="hero-name"
        aria-label="Dirk Knibbe"
        role="heading"
        aria-level={1}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="ascii-hero-container"
      aria-label="Dirk Knibbe"
      role="heading"
      aria-level={1}
    >
      <div ref={gridRef} className="ascii-grid" />
      <span className="sr-only">{text}</span>
    </div>
  );
}
