import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();

export interface ExtractedColor {
  hex: string;
  rgb: string;
  isDark: boolean;
  rgba: (alpha: number) => string;
}

const DEFAULT_COLOR: ExtractedColor = {
  hex: "#4f46e5",
  rgb: "rgb(79, 70, 229)",
  isDark: true,
  rgba: (alpha: number) => `rgba(79, 70, 229, ${alpha})`,
};

export async function extractColorFromImage(imageUrl?: string): Promise<ExtractedColor> {
  if (!imageUrl) return DEFAULT_COLOR;

  try {
    const color = await fac.getColorAsync(imageUrl, {
      algorithm: "dominant",
      crossOrigin: "anonymous",
    });

    const [r, g, b] = color.value;
    return {
      hex: color.hex,
      rgb: color.rgb,
      isDark: color.isDark,
      rgba: (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
    };
  } catch {
    return DEFAULT_COLOR;
  }
}
