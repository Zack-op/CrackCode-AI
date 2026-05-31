"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  /** Whether the waveform should actively animate (AI is speaking) */
  isActive: boolean;
  /** Accent colour for the bars – defaults to cyan */
  color?: string;
  bars?: number;
}

/**
 * Animated audio-waveform visualiser.
 * When isActive=true the bars animate like a live EQ meter.
 * When isActive=false they collapse to a flat idle line.
 */
export default function Waveform({
  isActive,
  color = "#22d3ee", // cyan-400
  bars = 5,
}: WaveformProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isActive) {
      // Reset all bars to flat
      barRefs.current.forEach((bar) => {
        if (bar) {
          bar.style.height    = "4px";
          bar.style.opacity   = "0.25";
          bar.style.transform = "scaleY(1)";
        }
      });
      return;
    }

    // Randomised bounce loop for each bar
    const intervals: ReturnType<typeof setInterval>[] = [];

    barRefs.current.forEach((bar, i) => {
      if (!bar) return;

      const interval = setInterval(() => {
        const minH  = 4;
        const maxH  = 24 + Math.sin(i * 1.3) * 8; // each bar has a different ceiling
        const h     = Math.random() * (maxH - minH) + minH;
        bar.style.height  = `${h}px`;
        bar.style.opacity = `${0.5 + (h / maxH) * 0.5}`;
      }, 80 + i * 20); // slight stagger so bars don't all move together

      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [isActive]);

  return (
    <div
      className="flex items-end gap-[3px]"
      aria-hidden="true"
      style={{ height: 32 }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barRefs.current[i] = el; }}
          style={{
            width:            4,
            height:           4,
            backgroundColor:  color,
            borderRadius:     2,
            opacity:          0.25,
            transition:       "height 80ms ease, opacity 80ms ease",
          }}
        />
      ))}
    </div>
  );
}
