"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Check,
  ChevronDown,
  Palette,
  Play,
  Heart,
  Volume2,
} from "lucide-react";
import { useSettingsStore, ThemeMode, ThemeColor } from "../../store/useSettingsStore";
import { SHADCN_COLOR_THEMES, THEME_MODE_OPTIONS } from "../../lib/theme/themeConfig";

export function ThemeSelector() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const themeColor = useSettingsStore((s) => s.themeColor);
  const setThemeColor = useSettingsStore((s) => s.setThemeColor);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = SHADCN_COLOR_THEMES.find((t) => t.id === themeColor) || SHADCN_COLOR_THEMES[11]; // default Indigo

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getModeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case "light":
        return <Sun size={18} />;
      case "dark":
        return <Moon size={18} />;
      case "oled":
        return <Sparkles size={18} />;
      case "system":
        return <Laptop size={18} />;
    }
  };

  return (
    <section className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Palette size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Aspetto & Temi</h2>
          <p className="text-xs text-muted-foreground">
            Personalizza la modalità (Chiaro/Scuro/OLED) e scegli il tuo colore preferito tra i temi Shadcn
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        {/* 1. Theme Mode Switcher */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Modalità Visualizzazione
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEME_MODE_OPTIONS.map((opt) => {
              const isActive = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setThemeMode(opt.id)}
                  className={`flex flex-col items-center text-center p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-md shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-secondary/60 hover:bg-secondary border-border text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <div className="mb-2 p-2 rounded-lg bg-background shadow-xs">
                    {getModeIcon(opt.id)}
                  </div>
                  <span className="text-xs font-semibold">{opt.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {opt.id === "oled" ? "Nero #000000" : opt.id === "system" ? "Automatico" : opt.id === "light" ? "Luminoso" : "Notturno"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Color Themes Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Colore Tema Shadcn
              </label>
              <p className="text-xs text-muted-foreground">
                Scegli il colore di accento principale per pulsanti, controlli, badge e indicatori
              </p>
            </div>

            {/* Custom Dropdown matching the user's screenshot */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold shadow-xs min-w-[170px] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/20"
                    style={{ backgroundColor: currentTheme.hex }}
                  />
                  <span>{currentTheme.name}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-muted-foreground transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu List */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                    Seleziona Colore
                  </div>
                  {SHADCN_COLOR_THEMES.map((theme) => {
                    const isSelected = themeColor === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setThemeColor(theme.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-primary/15 text-primary font-bold"
                            : "text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: theme.hex }}
                          />
                          <span>{theme.name}</span>
                        </div>
                        {isSelected && <Check size={15} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Color Chips Palette Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-9 gap-2 pt-2">
            {SHADCN_COLOR_THEMES.map((theme) => {
              const isSelected = themeColor === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeColor(theme.id)}
                  title={theme.name}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30 scale-105"
                      : "border-border bg-secondary/40 hover:bg-secondary hover:border-border/80"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: theme.hex }}
                  >
                    {isSelected && <Check size={12} className="text-white drop-shadow-md" />}
                  </span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground font-medium mt-1 truncate max-w-full">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Live Interactive Theme Preview */}
        <div className="pt-4 border-t border-border space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Anteprima Tema in Tempo Reale
          </label>

          <div className="p-4 rounded-xl bg-background border border-border/80 shadow-inner flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                <Play size={20} className="fill-current ml-0.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  Navidrome Music Player
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                    {currentTheme.name}
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground">Anteprima dei componenti con il tema attivo</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                <Heart size={13} className="fill-current" />
                Pulsante Primario
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border text-xs font-semibold transition-all"
              >
                <Volume2 size={13} />
                Secondario
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
