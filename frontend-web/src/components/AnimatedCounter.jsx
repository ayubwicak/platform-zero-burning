import { useEffect, useState } from 'react';

/**
 * Komponen animasi angka hitung yang menghormati prefers-reduced-motion
 * dan memformat angka sesuai standar bahasa Indonesia (titik sebagai pemisah ribuan).
 */
export default function AnimatedCounter({ value, suffix = '', duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(target);
      return;
    }

    const startTime = performance.now();
    let frameId;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing out cubic: 1 - (1 - progress)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setDisplayValue(target);
      }
    };

    frameId = requestAnimationFrame(update);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, duration]);

  const formatted = new Intl.NumberFormat('id-ID').format(displayValue);

  return (
    <span>
      {formatted}
      {suffix && ` ${suffix}`}
    </span>
  );
}
