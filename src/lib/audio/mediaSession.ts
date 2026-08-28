import { Song } from "../subsonic/types";
import { subsonicClient } from "../subsonic/client";

export function updateMediaSessionMetadata(song: Song) {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

  const artworkUrl = song.coverArt
    ? subsonicClient.getCoverArtUrl(song.coverArt, 512)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&auto=format&fit=crop&q=80";

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist || "Artista Sconosciuto",
    album: song.album || "Album Sconosciuto",
    artwork: [
      { src: artworkUrl, sizes: "96x96", type: "image/jpeg" },
      { src: artworkUrl, sizes: "128x128", type: "image/jpeg" },
      { src: artworkUrl, sizes: "192x192", type: "image/jpeg" },
      { src: artworkUrl, sizes: "256x256", type: "image/jpeg" },
      { src: artworkUrl, sizes: "384x384", type: "image/jpeg" },
      { src: artworkUrl, sizes: "512x512", type: "image/jpeg" },
    ],
  });
}

export function updateMediaSessionPlaybackState(state: "playing" | "paused" | "none") {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = state;
}

export function updateMediaSessionPositionState(duration: number, currentTime: number, playbackRate = 1) {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
  if ("setPositionState" in navigator.mediaSession && duration > 0 && !isNaN(duration)) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(duration, 0),
        playbackRate,
        position: Math.min(Math.max(currentTime, 0), duration),
      });
    } catch {
      // Ignore if state transition throws
    }
  }
}

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (position: number) => void;
}

export function setupMediaSessionActionHandlers(callbacks: MediaSessionCallbacks) {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

  try {
    navigator.mediaSession.setActionHandler("play", () => callbacks.onPlay());
    navigator.mediaSession.setActionHandler("pause", () => callbacks.onPause());
    navigator.mediaSession.setActionHandler("previoustrack", () => callbacks.onPrevious());
    navigator.mediaSession.setActionHandler("nexttrack", () => callbacks.onNext());
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const skip = details.seekOffset || 10;
      callbacks.onSeek(Math.max(0, -skip));
    });
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const skip = details.seekOffset || 10;
      callbacks.onSeek(skip);
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        callbacks.onSeek(details.seekTime);
      }
    });
  } catch (err) {
    console.warn("[MediaSession] Action handlers setup failed:", err);
  }
}
