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
