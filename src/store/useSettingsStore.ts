import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BitrateOption, TranscodingFormat } from "../lib/subsonic/types";

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 10 bands: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
}

export const DEFAULT_EQ_PRESETS: EqualizerPreset[] = [
  { name: "Piatto (Flat)", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Bass Boost", gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: "Rock", gains: [4, 3, 2, 0, -1, 0, 2, 3, 4, 4] },
  { name: "Pop", gains: [-1, 1, 3, 4, 3, 1, 0, 1, 2, 3] },
  { name: "Vocale", gains: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1] },
  { name: "Elettronica", gains: [5, 4, 2, 0, -1, 2, 1, 3, 4, 5] },
  { name: "Acoustic", gains: [3, 2, 1, 1, 2, 2, 3, 3, 2, 1] },
];

interface SettingsState {
  bitrate: BitrateOption;
  format: TranscodingFormat;
  gaplessEnabled: boolean;
  replayGainMode: "track" | "album" | "off";
  autoScrobble: boolean;
  autoCacheStreamed: boolean;
  maxCacheSizeGB: number;
  equalizerEnabled: boolean;
  equalizerPreset: string;
  equalizerGains: number[]; // 10 values (-12dB to +12dB)
  themeMode: "dark" | "oled" | "system";

  // Actions
  setBitrate: (bitrate: BitrateOption) => void;
  setFormat: (format: TranscodingFormat) => void;
  setGaplessEnabled: (enabled: boolean) => void;
  setReplayGainMode: (mode: "track" | "album" | "off") => void;
  setAutoScrobble: (enabled: boolean) => void;
  setAutoCacheStreamed: (enabled: boolean) => void;
  setMaxCacheSizeGB: (size: number) => void;
  setEqualizerEnabled: (enabled: boolean) => void;
  setEqualizerPreset: (presetName: string) => void;
  setEqualizerBandGain: (bandIndex: number, gain: number) => void;
  setThemeMode: (theme: "dark" | "oled" | "system") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bitrate: 0, // Raw by default
      format: "raw",
      gaplessEnabled: true,
      replayGainMode: "track",
      autoScrobble: true,
      autoCacheStreamed: false,
      maxCacheSizeGB: 2,
      equalizerEnabled: false,
      equalizerPreset: "Piatto (Flat)",
      equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      themeMode: "dark",

      setBitrate: (bitrate) => set({ bitrate }),
      setFormat: (format) => set({ format }),
      setGaplessEnabled: (gaplessEnabled) => set({ gaplessEnabled }),
      setReplayGainMode: (replayGainMode) => set({ replayGainMode }),
      setAutoScrobble: (autoScrobble) => set({ autoScrobble }),
      setAutoCacheStreamed: (autoCacheStreamed) => set({ autoCacheStreamed }),
      setMaxCacheSizeGB: (maxCacheSizeGB) => set({ maxCacheSizeGB }),
      setEqualizerEnabled: (equalizerEnabled) => set({ equalizerEnabled }),
      setEqualizerPreset: (presetName) => {
        const found = DEFAULT_EQ_PRESETS.find((p) => p.name === presetName);
        if (found) {
          set({ equalizerPreset: presetName, equalizerGains: [...found.gains] });
        } else {
          set({ equalizerPreset: presetName });
        }
      },
      setEqualizerBandGain: (bandIndex, gain) =>
        set((state) => {
          const updated = [...state.equalizerGains];
          updated[bandIndex] = gain;
          return { equalizerGains: updated, equalizerPreset: "Personalizzato" };
        }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: "navidrome-settings-storage",
    }
  )
);
