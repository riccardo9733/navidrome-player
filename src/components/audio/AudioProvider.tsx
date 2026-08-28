"use client";

import { useEffect } from "react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { audioEngine } from "../../lib/audio/engine";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const initializeEngine = usePlayerStore((s) => s.initializeEngine);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const toggleOfflineMode = useAuthStore((s) => s.toggleOfflineMode);
  const equalizerGains = useSettingsStore((s) => s.equalizerGains);
  const equalizerEnabled = useSettingsStore((s) => s.equalizerEnabled);
  const replayGainMode = useSettingsStore((s) => s.replayGainMode);

  useEffect(() => {
    // 1. Initialize Player Engine & MediaSession
    initializeEngine();

    // 2. Initialize Subsonic Auth & Ping
    initializeAuth();

    // 3. Register PWA Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
    }

    // 4. Listen for network changes
    const handleOnline = () => toggleOfflineMode(false);
    const handleOffline = () => toggleOfflineMode(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initializeEngine, initializeAuth, toggleOfflineMode]);

  // Sync EQ & ReplayGain changes to audio engine
  useEffect(() => {
    audioEngine.setEqualizerBands(equalizerGains, equalizerEnabled);
  }, [equalizerGains, equalizerEnabled]);

  useEffect(() => {
    audioEngine.setReplayGainMode(replayGainMode);
  }, [replayGainMode]);

  return <>{children}</>;
}
