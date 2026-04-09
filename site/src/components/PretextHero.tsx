import { useEffect, useRef, useState } from 'react';

export default function PretextHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  const text = 'Dirk Knibbe';
  const chars = text.split('').map((char, index) => ({ char, index }));

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
      {chars.map(({ char, index }) => (
        <span
          key={index}
          style={{
            display: 'inline-block',
            opacity: prefersReducedMotion || animated ? 1 : 0,
            transform:
              prefersReducedMotion || animated
                ? 'translateY(0)'
                : 'translateY(40px)',
            transition: prefersReducedMotion
              ? 'none'
              : `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + index * 0.045}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + index * 0.045}s`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}
