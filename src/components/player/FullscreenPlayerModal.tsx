"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  Download,
  Check,
  FileText,
  ListMusic,
  Sliders,
  Disc3,
  Sparkles,
  Trash2,
} from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { subsonicClient } from "../../lib/subsonic/client";
import { formatDuration } from "../../lib/utils/formatters";
import { downloadTrack, isTrackDownloaded, deleteDownloadedTrack } from "../../lib/db/downloadManager";
import { SyncedLyrics } from "./SyncedLyrics";
import { VisualizerCanvas } from "../audio/VisualizerCanvas";
import { DEFAULT_EQ_PRESETS, useSettingsStore } from "../../store/useSettingsStore";

type PlayerTab = "player" | "lyrics" | "queue" | "equalizer";

export function FullscreenPlayerModal() {
  const isFullscreenOpen = usePlayerStore((s) => s.isFullscreenOpen);
  const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const previousTrack = usePlayerStore((s) => s.previousTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);
  const activeColor = usePlayerStore((s) => s.activeColor);
  const playSong = usePlayerStore((s) => s.playSong);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  // Equalizer store bindings
  const equalizerEnabled = useSettingsStore((s) => s.equalizerEnabled);
  const setEqualizerEnabled = useSettingsStore((s) => s.setEqualizerEnabled);
  const equalizerPreset = useSettingsStore((s) => s.equalizerPreset);
  const setEqualizerPreset = useSettingsStore((s) => s.setEqualizerPreset);
  const equalizerGains = useSettingsStore((s) => s.equalizerGains);
  const setEqualizerBandGain = useSettingsStore((s) => s.setEqualizerBandGain);

  const [activeTab, setActiveTab] = useState<PlayerTab>("player");
  const [isStarred, setIsStarred] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (currentSong) {
      setIsStarred(Boolean(currentSong.starred));
      isTrackDownloaded(currentSong.id).then(setIsDownloaded);
    }
  }, [currentSong?.id, currentSong?.starred]);

  if (!currentSong) return null;

  const coverUrl = currentSong.coverArt
    ? subsonicClient.getCoverArtUrl(currentSong.coverArt, 600)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

  const handleStarToggle = async () => {
    const nextStarred = !isStarred;
    setIsStarred(nextStarred);
    try {
      if (nextStarred) {
        await subsonicClient.star(currentSong.id, "song");
      } else {
        await subsonicClient.unstar(currentSong.id, "song");
      }
    } catch {
      setIsStarred(!nextStarred);
    }
  };

  const handleDownloadToggle = async () => {
    if (downloading) return;
    if (isDownloaded) {
      await deleteDownloadedTrack(currentSong.id);
      setIsDownloaded(false);
    } else {
      setDownloading(true);
      try {
        await downloadTrack(currentSong, true);
        setIsDownloaded(true);
      } catch (err) {
        console.error("Failed to download track:", err);
      } finally {
        setDownloading(false);
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Drawer.Root
      open={isFullscreenOpen}
      onOpenChange={setFullscreenOpen}
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96vh] h-full flex flex-col z-50 bg-background text-foreground rounded-t-[36px] outline-none overflow-hidden shadow-2xl border-t border-border">
          {/* Dynamic Ambient Background Glow */}
          <div className="ambient-glow" />

          {/* Drawer Handle (Mobile) */}
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 shrink-0" />

          {/* Top Bar / Navigation */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setFullscreenOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <ChevronDown size={22} />
            </button>

            {/* Tab Selector */}
            <div className="flex items-center gap-1 bg-secondary/80 backdrop-blur-md p-1 rounded-full border border-border">
              <button
                onClick={() => setActiveTab("player")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "player"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Disc3 size={14} /> Brano
              </button>
              <button
                onClick={() => setActiveTab("lyrics")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "lyrics"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText size={14} /> Testo
              </button>
              <button
                onClick={() => setActiveTab("queue")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "queue"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListMusic size={14} /> Coda
              </button>
              <button
                onClick={() => setActiveTab("equalizer")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "equalizer"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders size={14} /> EQ
              </button>
            </div>

            <div className="w-9" /> {/* Spacer */}
          </div>

          {/* Main Body per Active Tab */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 py-2 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            {/* TAB 1: NOW PLAYING VIEW */}
            {activeTab === "player" && (
              <div className="flex flex-col items-center w-full max-w-md my-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Artwork */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl bg-secondary border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Track Details & Favorite */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col min-w-0 pr-4">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">
                      {currentSong.title}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground truncate mt-0.5">
                      {currentSong.artistId ? (
                        <Link
                          href={`/artists/${currentSong.artistId}`}
                          onClick={() => setFullscreenOpen(false)}
                          className="hover:underline hover:text-foreground text-foreground/80 font-medium"
                        >
                          {currentSong.artist || "Artista Sconosciuto"}
                        </Link>
                      ) : (
                        <span>{currentSong.artist || "Artista Sconosciuto"}</span>
                      )}
                      {" — "}
                      {currentSong.albumId ? (
                        <Link
                          href={`/albums/${currentSong.albumId}`}
                          onClick={() => setFullscreenOpen(false)}
                          className="hover:underline hover:text-foreground"
                        >
                          {currentSong.album || "Album Sconosciuto"}
                        </Link>
                      ) : (
                        <span>{currentSong.album || "Album Sconosciuto"}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {currentSong.bitRate && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono text-muted-foreground border border-border">
                          {currentSong.bitRate} kbps
                        </span>
                      )}
                      {currentSong.suffix && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono uppercase text-muted-foreground border border-border">
                          {currentSong.suffix}
                        </span>
                      )}
                      {isDownloaded && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
                          <Check size={10} /> Offline
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadToggle}
                      className={`p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer border border-border ${
                        isDownloaded ? "text-primary" : downloading ? "text-primary animate-pulse" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isDownloaded ? <Check size={20} /> : <Download size={20} />}
                    </button>

                    <button
                      onClick={handleStarToggle}
                      className={`p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer border border-border ${
                        isStarred ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart size={20} className={isStarred ? "fill-current" : ""} />
                    </button>
                  </div>
                </div>

                {/* Seekbar */}
                <div className="w-full space-y-1.5">
                  <div className="relative flex items-center group py-2">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => seek(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>

                {/* Main Transport Controls */}
                <div className="flex items-center justify-between w-full px-4">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 transition-colors cursor-pointer ${
                      isShuffled ? "text-primary bg-primary/10 rounded-xl" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Shuffle size={20} />
                  </button>

                  <button
                    onClick={previousTrack}
                    className="p-2 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <SkipBack size={28} className="fill-current" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="ml-1 fill-current" />}
                  </button>

                  <button
                    onClick={nextTrack}
                    className="p-2 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <SkipForward size={28} className="fill-current" />
                  </button>

                  <button
                    onClick={cycleRepeatMode}
                    className={`p-2 transition-colors cursor-pointer ${
                      repeatMode !== "off" ? "text-primary bg-primary/10 rounded-xl" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {repeatMode === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
                  </button>
                </div>

                {/* Volume Slider & Visualizer */}
                <div className="flex items-center gap-3 w-full px-2">
                  <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                  </button>
                  <div className="relative flex-1 flex items-center">
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>
                </div>

                {/* Live Realtime Visualizer */}
                <VisualizerCanvas className="opacity-70 h-8" />
              </div>
            )}

            {/* TAB 2: SYNCED LYRICS */}
            {activeTab === "lyrics" && (
              <div className="w-full h-full flex flex-col animate-in fade-in duration-300">
                <SyncedLyrics song={currentSong} className="flex-1 max-h-[65vh]" />
              </div>
            )}

            {/* TAB 3: QUEUE */}
            {activeTab === "queue" && (
              <div className="w-full h-full flex flex-col animate-in fade-in duration-300 max-h-[65vh] overflow-y-auto space-y-2 pr-1">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prossimi in Coda ({queue.length})
                  </span>
                  <span className="text-xs text-primary font-medium">
                    {isShuffled ? "Riproduzione Casuale Attiva" : "Ordine Normale"}
                  </span>
                </div>

                {queue.map((track, idx) => {
                  const isCur = idx === queueIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playSong(track, queue, idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                        isCur
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "hover:bg-secondary text-foreground/90"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground w-5 text-center">
                          {isCur ? "▶" : idx + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <p className={`text-sm font-semibold truncate ${isCur ? "text-primary" : "text-foreground"}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDuration(track.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(idx);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: EQUALIZER */}
            {activeTab === "equalizer" && (
              <div className="w-full flex flex-col space-y-6 animate-in fade-in duration-300 max-w-lg">
                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-primary" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Elaborazione Audio</h4>
                      <p className="text-xs text-muted-foreground">Attiva o disattiva i filtri BiQuad</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={equalizerEnabled}
                    onChange={(e) => setEqualizerEnabled(e.target.checked)}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_EQ_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setEqualizerPreset(preset.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        equalizerPreset === preset.name
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* 10 Sliders */}
                <div
                  className={`grid grid-cols-10 gap-1 py-4 px-2 bg-card rounded-2xl border border-border ${
                    equalizerEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
                  }`}
                >
                  {["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"].map((label, index) => {
                    const gain = equalizerGains[index] || 0;
                    return (
                      <div key={label} className="flex flex-col items-center gap-2 h-44 justify-between">
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {gain > 0 ? `+${gain}` : gain}
                        </span>
                        <div className="relative flex items-center justify-center flex-1 w-full">
                          <input
                            type="range"
                            min={-12}
                            max={12}
                            step={1}
                            value={gain}
                            onChange={(e) => setEqualizerBandGain(index, parseFloat(e.target.value))}
                            className="h-28 -rotate-90 w-28 accent-primary cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 shrink-0" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
