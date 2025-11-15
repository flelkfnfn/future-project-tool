'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useMotionPreference } from './MotionPreferenceProvider';

interface ClickSparkProps {
  sparkColor?: string; // Optional override. If unset, uses theme-based color.
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  extraScale?: number;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

const ClickSpark = ({
  // When sparkColor is undefined, pick by theme: light => navy, dark => amber-ish
  sparkColor,
  sparkSize = 5,
  sparkRadius = 10,
  sparkCount = 7,
  duration = 300,
  easing = 'ease-out',
  extraScale = 1.0,
}: ClickSparkProps) => {
  const { resolved } = useMotionPreference();
  const reducedMotion = resolved === 'reduced';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const animIdRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case 'linear':
          return t;
        case 'ease-in':
          return t * t;
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark: Spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        // Resolve color on each frame so theme toggles apply immediately.
        // Light theme: navy, Dark theme: amber-like (original default)
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        const colorResolved = sparkColor ?? (isDark ? '#ffd900a1' : '#1e3a8a');
        ctx.strokeStyle = colorResolved;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      if (sparksRef.current.length > 0 && !document.hidden) {
        animIdRef.current = requestAnimationFrame(draw);
      } else {
        // Stop loop when idle to save CPU/GPU
        runningRef.current = false;
        animIdRef.current = null;
        startTimeRef.current = null;
      }
    };

    const start = () => {
      if (runningRef.current) return;
      if (document.hidden) return;
      runningRef.current = true;
      animIdRef.current = requestAnimationFrame(draw);
    };

    // Kick off only when there are existing sparks (should be none initially)
    if (sparksRef.current.length > 0) start();

    const onVis = () => {
      if (document.hidden && animIdRef.current != null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
        runningRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', onVis);

    // Expose start via ref to be used by click handler
    (canvas as unknown as { __start?: () => void }).__start = start;

    return () => {
      if (animIdRef.current != null) cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
      runningRef.current = false;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale, reducedMotion]);

  const handleClick = useCallback((e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;

    const now = performance.now();
    const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now
    }));

    sparksRef.current.push(...newSparks);
    const canvas = canvasRef.current as (HTMLCanvasElement & { __start?: () => void }) | null;
    canvas?.__start?.();
  }, [sparkCount]);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    document.body.addEventListener('mousedown', handleClick);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.body.removeEventListener('mousedown', handleClick);
    };
  }, [handleClick, reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default ClickSpark;
