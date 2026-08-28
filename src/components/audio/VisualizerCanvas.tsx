"use client";

import { useEffect, useRef } from "react";
import { audioEngine } from "../../lib/audio/engine";
import { usePlayerStore } from "../../store/usePlayerStore";

interface VisualizerCanvasProps {
  className?: string;
  barColor?: string;
}

export function VisualizerCanvas({ className = "", barColor }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const activeColor = usePlayerStore((s) => s.activeColor);

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
        // Subtle resting animation when paused
        const barCount = 32;
        const barWidth = width / barCount - 2;
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";

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

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        const topColor = barColor || activeColor?.hex || "#6366f1";
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
        gradient.addColorStop(0.6, topColor);
        gradient.addColorStop(1, "#a855f7");

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
  }, [isPlaying, barColor, activeColor]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className={`w-full h-12 pointer-events-none ${className}`}
    />
  );
}
