"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, Sparkles, Check, Palette, ChevronDown } from "lucide-react";
import { useSettingsStore, ThemeMode } from "../../store/useSettingsStore";
import { SHADCN_COLOR_THEMES, THEME_MODE_OPTIONS } from "../../lib/theme/themeConfig";

export function QuickThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const themeColor = useSettingsStore((s) => s.themeColor);
  const setThemeColor = useSettingsStore((s) => s.setThemeColor);

  const currentTheme = SHADCN_COLOR_THEMES.find((t) => t.id === themeColor) || SHADCN_COLOR_THEMES[11];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getModeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case "light":
        return <Sun size={15} />;
      case "dark":
        return <Moon size={15} />;
      case "oled":
        return <Sparkles size={15} />;
      case "system":
        return <Laptop size={15} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground/80 hover:text-foreground flex items-center justify-center transition-all shadow-xs active:scale-95 group relative"
        title="Personalizza Tema e Colori"
      >
        <Palette size={17} className="transition-transform group-hover:rotate-12" />
        {/* Active Color Dot */}
        <span
          className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-background shadow-xs"
          style={{ backgroundColor: currentTheme.hex }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-h-[85vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* Mode Switcher */}
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">
              Modalità
            </span>
            <div className="grid grid-cols-4 gap-1 bg-secondary/60 p-1 rounded-xl">
              {THEME_MODE_OPTIONS.map((opt) => {
                const isActive = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setThemeMode(opt.id)}
                    title={opt.name}
                    className={`flex items-center justify-center p-1.5 rounded-lg text-xs transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    {getModeIcon(opt.id)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Themes List */}
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">
              Colore Tema Shadcn
            </span>
            <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1">
              {SHADCN_COLOR_THEMES.map((theme) => {
                const isSelected = themeColor === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setThemeColor(theme.id);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      isSelected
                        ? "bg-primary/15 text-primary font-bold"
                        : "text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: theme.hex }}
                      />
                      <span className="truncate">{theme.name}</span>
                    </div>
                    {isSelected && <Check size={13} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
