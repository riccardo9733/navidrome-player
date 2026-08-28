import { ThemeColor, ThemeMode } from "../../store/useSettingsStore";

export interface ColorThemeOption {
  id: ThemeColor;
  name: string;
  hex: string;
  tailwindClass: string;
  badgeBg: string;
  badgeText: string;
}

export const SHADCN_COLOR_THEMES: ColorThemeOption[] = [
  { id: "neutral", name: "Neutral", hex: "#737373", tailwindClass: "bg-neutral-500", badgeBg: "bg-neutral-500/20", badgeText: "text-neutral-300" },
  { id: "zinc", name: "Zinc", hex: "#71717a", tailwindClass: "bg-zinc-500", badgeBg: "bg-zinc-500/20", badgeText: "text-zinc-300" },
  { id: "slate", name: "Slate", hex: "#64748b", tailwindClass: "bg-slate-500", badgeBg: "bg-slate-500/20", badgeText: "text-slate-300" },
  { id: "stone", name: "Stone", hex: "#78716c", tailwindClass: "bg-stone-500", badgeBg: "bg-stone-500/20", badgeText: "text-stone-300" },
  { id: "gray", name: "Gray", hex: "#6b7280", tailwindClass: "bg-gray-500", badgeBg: "bg-gray-500/20", badgeText: "text-gray-300" },
  { id: "amber", name: "Amber", hex: "#f59e0b", tailwindClass: "bg-amber-500", badgeBg: "bg-amber-500/20", badgeText: "text-amber-300" },
  { id: "blue", name: "Blue", hex: "#3b82f6", tailwindClass: "bg-blue-500", badgeBg: "bg-blue-500/20", badgeText: "text-blue-300" },
  { id: "cyan", name: "Cyan", hex: "#06b6d4", tailwindClass: "bg-cyan-500", badgeBg: "bg-cyan-500/20", badgeText: "text-cyan-300" },
  { id: "emerald", name: "Emerald", hex: "#10b981", tailwindClass: "bg-emerald-500", badgeBg: "bg-emerald-500/20", badgeText: "text-emerald-300" },
  { id: "fuchsia", name: "Fuchsia", hex: "#d946ef", tailwindClass: "bg-fuchsia-500", badgeBg: "bg-fuchsia-500/20", badgeText: "text-fuchsia-300" },
  { id: "green", name: "Green", hex: "#22c55e", tailwindClass: "bg-green-500", badgeBg: "bg-green-500/20", badgeText: "text-green-300" },
  { id: "indigo", name: "Indigo", hex: "#6366f1", tailwindClass: "bg-indigo-500", badgeBg: "bg-indigo-500/20", badgeText: "text-indigo-300" },
  { id: "lime", name: "Lime", hex: "#84cc16", tailwindClass: "bg-lime-500", badgeBg: "bg-lime-500/20", badgeText: "text-lime-300" },
  { id: "orange", name: "Orange", hex: "#f97316", tailwindClass: "bg-orange-500", badgeBg: "bg-orange-500/20", badgeText: "text-orange-300" },
  { id: "pink", name: "Pink", hex: "#ec4899", tailwindClass: "bg-pink-500", badgeBg: "bg-pink-500/20", badgeText: "text-pink-300" },
  { id: "rose", name: "Rose", hex: "#f43f5e", tailwindClass: "bg-rose-500", badgeBg: "bg-rose-500/20", badgeText: "text-rose-300" },
  { id: "violet", name: "Violet", hex: "#8b5cf6", tailwindClass: "bg-violet-500", badgeBg: "bg-violet-500/20", badgeText: "text-violet-300" },
  { id: "yellow", name: "Yellow", hex: "#eab308", tailwindClass: "bg-yellow-500", badgeBg: "bg-yellow-500/20", badgeText: "text-yellow-300" },
];

export interface ThemeModeOption {
  id: ThemeMode;
  name: string;
  description: string;
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  { id: "light", name: "Chiaro", description: "Design moderno ad alto contrasto per ambienti luminosi" },
  { id: "dark", name: "Scuro", description: "Design scuro rilassante per gli occhi in notturna" },
  { id: "oled", name: "OLED (Nero Puro)", description: "Nero assoluto #000000 per massimizzare la batteria su schermi OLED" },
  { id: "system", name: "Sistema", description: "Sincronizza automaticamente con le preferenze del dispositivo" },
];
