import { useEffect, useRef, useState, useCallback } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

/**
 * Spring physics parameters for character animation.
 * Each character behaves like a damped spring settling into its Pretext-computed position.
 */
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 14;
const SPRING_MASS = 1;
const STAGGER_DELAY_MS = 55; // ms between each character's spring activation

interface CharState {
  // Current animated values
  x: number;
  y: number;
  opacity: number;
  // Velocity for spring physics
  vx: number;
  vy: number;
  vOpacity: number;
  // Target values (from Pretext layout)
  targetX: number;
  targetY: number;
  // When this char's spring should activate
  activateTime: number;
  // Is the spring at rest?
  settled: boolean;
}

function springStep(
  current: number,
  target: number,
  velocity: number,
  dt: number,
): { value: number; velocity: number; settled: boolean } {
  const displacement = current - target;
  const springForce = -SPRING_STIFFNESS * displacement;
  const dampingForce = -SPRING_DAMPING * velocity;
  const acceleration = (springForce + dampingForce) / SPRING_MASS;
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;
  const settled =
    Math.abs(displacement) < 0.5 && Math.abs(newVelocity) < 0.5;
  return {
    value: settled ? target : newValue,
    velocity: settled ? 0 : newVelocity,
    settled,
  };
}

export default function PretextHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const charStatesRef = useRef<CharState[]>([]);
  const startTimeRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  const text = 'Dirk Knibbe';

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const containerWidth = container.clientWidth;
    const computedStyle = getComputedStyle(container);
    const fontSize = computedStyle.fontSize; // e.g. "72px"
    const fontWeight = computedStyle.fontWeight || '200';
    const fontFamily = computedStyle.fontFamily || 'Inter, system-ui, sans-serif';
    const font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const fontSizeNum = parseFloat(fontSize);
    const lineHeight = fontSizeNum * 1; // line-height: 1
    const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0; // respects CSS letter-spacing: -3px

    // Prepare the full text with Pretext
    const prepared = prepareWithSegments(text, font);

    // Get lines from Pretext layout
    const { lines } = layoutWithLines(prepared, containerWidth, lineHeight);

    // Now measure each individual character's position using Pretext
    // We'll prepare each character individually to get exact widths
    const charPositions: { x: number; y: number; char: string; width: number }[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx].text;
      const lineY = lineIdx * lineHeight;
      let xOffset = 0;

      for (let i = 0; i < lineText.length; i++) {
        const ch = lineText[i];
        // Measure this character's width using Pretext
        const charPrepared = prepareWithSegments(ch === ' ' ? '\u00A0' : ch, font);
        const charLayout = layoutWithLines(charPrepared, 9999, lineHeight);
        const charWidth = charLayout.lines.length > 0 ? charLayout.lines[0].width : 0;

        charPositions.push({
          x: xOffset,
          y: lineY,
          char: ch,
          width: charWidth,
        });

        xOffset += charWidth + letterSpacing;
      }
    }

    // Set up canvas
    const dpr = window.devicePixelRatio || 1;
    const totalHeight = lines.length * lineHeight;
    canvas.width = containerWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    // Initialize char states
    const now = performance.now();
    startTimeRef.current = now;
    charStatesRef.current = charPositions.map((pos, i) => ({
      // Start from scattered positions — each char drops in from above with random horizontal offset
      x: pos.x + (Math.random() - 0.5) * fontSizeNum * 2,
      y: pos.y - fontSizeNum * 1.5 - Math.random() * fontSizeNum,
      opacity: 0,
      vx: 0,
      vy: 0,
      vOpacity: 0,
      targetX: pos.x,
      targetY: pos.y,
      activateTime: now + 300 + i * STAGGER_DELAY_MS,
      settled: false,
    }));

    setReady(true);
  }, [text, prefersReducedMotion]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const computedStyle = getComputedStyle(container);
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight || '200';
    const fontFamily = computedStyle.fontFamily || 'Inter, system-ui, sans-serif';
    const font = `${fontWeight} ${fontSize} ${fontFamily}`;
    const textColor = computedStyle.color || '#e8e6e3';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.textBaseline = 'top';

    const now = performance.now();
    const dt = 1 / 60; // Fixed timestep for stability
    let allSettled = true;

    for (const state of charStatesRef.current) {
      if (now < state.activateTime) {
        // Not yet activated — don't render
        allSettled = false;
        continue;
      }

      if (!state.settled) {
        // Spring physics for x
        const sx = springStep(state.x, state.targetX, state.vx, dt);
        state.x = sx.value;
        state.vx = sx.velocity;

        // Spring physics for y
        const sy = springStep(state.y, state.targetY, state.vy, dt);
        state.y = sy.value;
        state.vy = sy.velocity;

        // Spring physics for opacity (target = 1)
        const so = springStep(state.opacity, 1, state.vOpacity, dt);
        state.opacity = Math.min(1, Math.max(0, so.value));
        state.vOpacity = so.velocity;

        state.settled = sx.settled && sy.settled && so.settled;
        if (!state.settled) allSettled = false;
      }

      ctx.globalAlpha = state.opacity;
      ctx.fillStyle = textColor;
      // Render character with baseline offset to approximate top alignment
      ctx.fillText(
        state.char === ' ' ? '' : state.char,
        state.x,
        state.y,
      );
    }

    ctx.restore();

    if (!allSettled) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }
  }, []);

  useEffect(() => {
    computeLayout();

    const handleResize = () => {
      // On resize, recompute layout and snap to final positions
      computeLayout();
      // After recompute, if animation is done, snap chars to final
      const states = charStatesRef.current;
      for (const s of states) {
        s.x = s.targetX;
        s.y = s.targetY;
        s.opacity = 1;
        s.vx = 0;
        s.vy = 0;
        s.vOpacity = 0;
        s.settled = true;
      }
      renderFrame();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [computeLayout, renderFrame]);

  // Start animation loop once ready
  useEffect(() => {
    if (!ready) return;

    if (prefersReducedMotion) {
      // Snap to final positions immediately
      for (const s of charStatesRef.current) {
        s.x = s.targetX;
        s.y = s.targetY;
        s.opacity = 1;
        s.settled = true;
      }
      renderFrame();
      return;
    }

    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ready, prefersReducedMotion, renderFrame]);

  return (
    <div
      ref={containerRef}
      className="hero-name"
      aria-label="Dirk Knibbe"
      role="heading"
      aria-level={1}
      style={{ position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
      />
      {/* Hidden text for accessibility / SEO */}
      <span className="sr-only">{text}</span>
    </div>
  );
}
