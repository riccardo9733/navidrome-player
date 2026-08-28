"use client";

import { Play, Pause, SkipForward } from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { subsonicClient } from "../../lib/subsonic/client";

export function MiniPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const activeColor = usePlayerStore((s) => s.activeColor);

  if (!currentSong) return null;

  const coverUrl = currentSong.coverArt
    ? subsonicClient.getCoverArtUrl(currentSong.coverArt, 120)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80";

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="md:hidden fixed bottom-[calc(70px+env(safe-area-inset-bottom,0px))] left-3 right-3 z-30">
      <div
        onClick={() => setFullscreenOpen(true)}
        className="relative overflow-hidden rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-transform"
        style={{
          boxShadow: activeColor
            ? `0 10px 30px -10px ${activeColor.rgba(0.4)}`
            : "0 10px 30px -10px rgba(0,0,0,0.5)",
        }}
      >
        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/10">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Cover Art */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
          <p className="text-xs text-zinc-400 truncate">{currentSong.artist || "Artista Sconosciuto"}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 pr-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="ml-0.5 fill-current" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextTrack();
            }}
            className="p-2 text-zinc-300 hover:text-white active:scale-95 transition-transform"
          >
            <SkipForward size={20} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
