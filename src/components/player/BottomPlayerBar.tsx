"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
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
  FileText,
  ListMusic,
  Sliders,
  Maximize2,
  Heart,
  Download,
  Check,
} from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { subsonicClient } from "../../lib/subsonic/client";
import { formatDuration } from "../../lib/utils/formatters";
import { downloadTrack, isTrackDownloaded, deleteDownloadedTrack } from "../../lib/db/downloadManager";

export function BottomPlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
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

  const isFullscreenOpen = usePlayerStore((s) => s.isFullscreenOpen);
  const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);
  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);
  const isEqualizerOpen = usePlayerStore((s) => s.isEqualizerOpen);
  const setEqualizerOpen = usePlayerStore((s) => s.setEqualizerOpen);

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
    ? subsonicClient.getCoverArtUrl(currentSong.coverArt, 150)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80";

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
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-24 glass-player z-40 px-6 items-center justify-between border-t border-border select-none shadow-2xl transition-colors duration-200">
      {/* 1. Track Info & Actions (Left) */}
      <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
        <div
          onClick={() => setFullscreenOpen(true)}
          className="relative w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0 cursor-pointer group shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 size={16} className="text-white" />
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span
            onClick={() => setFullscreenOpen(true)}
            className="text-sm font-semibold text-foreground truncate cursor-pointer hover:underline"
          >
            {currentSong.title}
          </span>
          <span className="text-xs text-muted-foreground truncate hover:text-foreground">
            {currentSong.artistId ? (
              <Link href={`/artists/${currentSong.artistId}`} className="hover:underline">
                {currentSong.artist || "Artista Sconosciuto"}
              </Link>
            ) : (
              currentSong.artist || "Artista Sconosciuto"
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={handleStarToggle}
            className={`p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer ${
              isStarred ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart size={18} className={isStarred ? "fill-current" : ""} />
          </button>

          <button
            onClick={handleDownloadToggle}
            className={`p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer ${
              isDownloaded
                ? "text-primary"
                : downloading
                ? "text-primary animate-pulse"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isDownloaded ? <Check size={18} /> : <Download size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Central Player Controls & Seekbar (Center) */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-2/4 px-4">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isShuffled ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Riproduzione casuale"
          >
            <Shuffle size={17} />
          </button>

          <button
            onClick={previousTrack}
            className="text-foreground/80 hover:text-foreground transition-colors p-1 cursor-pointer"
            title="Precedente"
          >
            <SkipBack size={20} className="fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={isPlaying ? "Pausa" : "Riproduci"}
          >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="ml-0.5 fill-current" />}
          </button>

          <button
            onClick={nextTrack}
            className="text-foreground/80 hover:text-foreground transition-colors p-1 cursor-pointer"
            title="Successivo"
          >
            <SkipForward size={20} className="fill-current" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              repeatMode !== "off" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            }`}
            title={`Ripeti: ${repeatMode}`}
          >
            {repeatMode === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}
          </button>
        </div>

        {/* Seekbar */}
        <div className="flex items-center gap-3 w-full text-xs font-mono text-muted-foreground">
          <span className="w-10 text-right">{formatDuration(currentTime)}</span>

          <div className="relative flex-1 flex items-center group py-1">
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all rounded-full"
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

          <span className="w-10">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* 3. Extra Tools & Volume (Right) */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[220px]">
        <button
          onClick={() => setLyricsOpen(!isLyricsOpen)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isLyricsOpen ? "text-primary bg-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title="Testi sincronizzati"
        >
          <FileText size={18} />
        </button>

        <button
          onClick={() => setQueueOpen(!isQueueOpen)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isQueueOpen ? "text-primary bg-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title="Coda di riproduzione"
        >
          <ListMusic size={18} />
        </button>

        <button
          onClick={() => setEqualizerOpen(!isEqualizerOpen)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isEqualizerOpen ? "text-primary bg-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title="Equalizzatore"
        >
          <Sliders size={18} />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 w-28 group">
          <button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={18} />
            ) : volume < 0.5 ? (
              <Volume1 size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

          <div className="relative flex-1 flex items-center py-1">
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 group-hover:bg-primary transition-all rounded-full"
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

        <button
          onClick={() => setFullscreenOpen(!isFullscreenOpen)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          title="A tutto schermo"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
}
