"use client";

import { useEffect, useRef } from "react";
import { audioEngine } from "../../lib/audio/engine";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { SHADCN_COLOR_THEMES } from "../../lib/theme/themeConfig";

interface VisualizerCanvasProps {
  className?: string;
  barColor?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex, 16) || 0;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export function VisualizerCanvas({ className = "", barColor }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const themeColor = useSettingsStore((s) => s.themeColor);

  const matchedTheme = SHADCN_COLOR_THEMES.find((t) => t.id === themeColor);
  const primaryHex = barColor || matchedTheme?.hex || "#6366f1";
  const { r, g, b } = hexToRgb(primaryHex);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const data = audioEngine.getVisualizerData();

      if (!data || !isPlaying) {
        // Resting animation bars when paused in theme color
        const barCount = 32;
        const barWidth = width / barCount - 2;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;

        for (let i = 0; i < barCount; i++) {
          const h = 4;
          const x = i * (barWidth + 2);
          const y = height - h;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, 2);
          ctx.fill();
        }
        return;
      }

      const barCount = Math.min(data.length, 32);
      const barWidth = (width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const percent = data[i] / 255;
        const barHeight = Math.max(4, percent * height);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Dynamic theme gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, y);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.75)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 1)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, r, g, b]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className={`w-full h-12 pointer-events-none ${className}`}
    />
  );
}
