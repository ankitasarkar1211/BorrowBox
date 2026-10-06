import React, { useEffect, useRef } from 'react';
import { animateCounter } from '@/lib/animations';

export default function AnimatedCounter({
  value = 0,
  duration = 800,
  prefix = '',
  suffix = '',
  className = '',
  formatFn,
}) {
  const spanRef = useRef(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const start = prevValueRef.current;
    const end = Number(value) || 0;

    const defaultFormat = (n) => `${prefix}${Math.round(n)}${suffix}`;
    const formatter = formatFn || defaultFormat;

    const anim = animateCounter(el, start, end, duration, formatter);
    prevValueRef.current = end;

    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause();
      }
    };
  }, [value, duration, prefix, suffix, formatFn]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}{value}{suffix}
    </span>
  );
}
