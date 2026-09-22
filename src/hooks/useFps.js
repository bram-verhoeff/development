import { useState, useEffect, useRef } from 'react';

/**
 * Lightweight, high-precision FPS & Frametime tracker.
 * Samples frames using requestAnimationFrame and throttles state updates
 * to ~300ms for stable, legible readouts with zero rendering overhead.
 */
export function useFps() {
  const [fpsData, setFpsData] = useState({ fps: 60, frametime: 16.6 });
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const rafId = useRef(null);

  useEffect(() => {
    const loop = (now) => {
      frameCount.current += 1;
      const elapsed = now - lastTime.current;

      // Update readout every 250ms for snappy, precise updates
      if (elapsed >= 250) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        const currentFrametime = Number((elapsed / frameCount.current).toFixed(1));

        setFpsData({
          fps: Math.min(999, Math.max(1, currentFps)),
          frametime: currentFrametime,
        });

        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return fpsData;
}
