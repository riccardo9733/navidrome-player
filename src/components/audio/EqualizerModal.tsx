"use client";

import { Sliders, X, RotateCcw } from "lucide-react";
import { DEFAULT_EQ_PRESETS, useSettingsStore } from "../../store/useSettingsStore";
import { usePlayerStore } from "../../store/usePlayerStore";

const BAND_LABELS = ["32Hz", "64Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"];

export function EqualizerModal() {
  const isEqualizerOpen = usePlayerStore((s) => s.isEqualizerOpen);
  const setEqualizerOpen = usePlayerStore((s) => s.setEqualizerOpen);

  const equalizerEnabled = useSettingsStore((s) => s.equalizerEnabled);
  const setEqualizerEnabled = useSettingsStore((s) => s.setEqualizerEnabled);
  const equalizerPreset = useSettingsStore((s) => s.equalizerPreset);
  const setEqualizerPreset = useSettingsStore((s) => s.setEqualizerPreset);
  const equalizerGains = useSettingsStore((s) => s.equalizerGains);
  const setEqualizerBandGain = useSettingsStore((s) => s.setEqualizerBandGain);

  if (!isEqualizerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Equalizzatore a 10 Bande</h2>
              <p className="text-xs text-zinc-400">Modella il profilo sonoro in tempo reale con Web Audio API</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-300">
              <span>{equalizerEnabled ? "Attivo" : "Disattivato"}</span>
              <input
                type="checkbox"
                checked={equalizerEnabled}
                onChange={(e) => setEqualizerEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 relative"></div>
            </label>

            <button
              onClick={() => setEqualizerOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Preset Sonori</span>
            <button
              onClick={() => setEqualizerPreset("Piatto (Flat)")}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-indigo-400 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_EQ_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setEqualizerPreset(preset.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  equalizerPreset === preset.name
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Sliders */}
        <div
          className={`grid grid-cols-10 gap-2 py-4 px-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80 transition-opacity ${
            equalizerEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
          }`}
        >
          {BAND_LABELS.map((label, index) => {
            const gain = equalizerGains[index] || 0;
            return (
              <div key={label} className="flex flex-col items-center gap-3 h-56 justify-between">
                <span className="text-[10px] font-mono text-zinc-400">
                  {gain > 0 ? `+${gain}` : gain}dB
                </span>

                <div className="relative flex items-center justify-center flex-1 w-full">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => setEqualizerBandGain(index, parseFloat(e.target.value))}
                    className="h-36 -rotate-90 w-36 accent-indigo-500"
                  />
                </div>

                <span className="text-[10px] font-medium text-zinc-400">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setEqualizerOpen(false)}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
