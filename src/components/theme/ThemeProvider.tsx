"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { SHADCN_COLOR_THEMES } from "../../lib/theme/themeConfig";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    function applyTheme() {
      let effectiveMode = themeMode;
      if (themeMode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        effectiveMode = prefersDark ? "dark" : "light";
      }

      // Remove existing mode classes
      root.classList.remove("light", "dark", "oled");

      if (effectiveMode === "oled") {
        root.classList.add("dark", "oled");
        root.style.colorScheme = "dark";
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#000000");
      } else if (effectiveMode === "dark") {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#090a0f");
      } else {
        root.classList.add("light");
        root.style.colorScheme = "light";
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#ffffff");
      }

      // Set active color theme
      root.setAttribute("data-theme", themeColor || "indigo");

      // Set dynamic primary rgb / color variable for glows & shadows
      const currentThemeObj = SHADCN_COLOR_THEMES.find((t) => t.id === themeColor);
      if (currentThemeObj) {
        root.style.setProperty("--current-theme-hex", currentThemeObj.hex);
      }
    }

    applyTheme();

    // Listen to system preference changes if in system mode
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeMode, themeColor]);

  return <>{children}</>;
}
