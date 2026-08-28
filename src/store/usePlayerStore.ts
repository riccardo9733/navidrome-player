import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "../lib/subsonic/types";
import { audioEngine } from "../lib/audio/engine";
import {
  setupMediaSessionActionHandlers,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from "../lib/audio/mediaSession";
import { subsonicClient } from "../lib/subsonic/client";
import { autoCacheTrack, touchTrackPlayed } from "../lib/db/lruCache";
import { extractColorFromImage, ExtractedColor } from "../lib/utils/colorExtractor";
import { useSettingsStore } from "./useSettingsStore";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  originalQueue: Song[]; // Unshuffled copy
  isPlaying: boolean;
  isBuffering: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  playbackRate: number;

  // UI Panels
  isFullscreenOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isEqualizerOpen: boolean;
  activeColor: ExtractedColor | null;

  // Scrobble tracking
  hasScrobbledCurrent: boolean;

  // Actions
  playSong: (song: Song, queue?: Song[], index?: number) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setQueue: (queue: Song[], startIndex?: number) => void;
  addToQueue: (song: Song | Song[], next?: boolean) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;

  // UI state toggles
  setFullscreenOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setEqualizerOpen: (open: boolean) => void;

  // Internal lifecycle
  initializeEngine: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      queueIndex: -1,
      originalQueue: [],
      isPlaying: false,
      isBuffering: false,
      duration: 0,
      currentTime: 0,
      volume: 1,
      isMuted: false,
      repeatMode: "off",
      isShuffled: false,
      playbackRate: 1,

      isFullscreenOpen: false,
      isLyricsOpen: false,
      isQueueOpen: false,
      isEqualizerOpen: false,
      activeColor: null,
      hasScrobbledCurrent: false,

      initializeEngine: () => {
        if (typeof window === "undefined") return;

        // Connect audio engine callbacks
        audioEngine.setCallbacks({
          onTimeUpdate: (currentTime, duration) => {
            set({ currentTime, duration });
            updateMediaSessionPositionState(duration, currentTime, get().playbackRate);

            // Auto Scrobble check (trigger at 50% or 4 minutes)
            const { currentSong, hasScrobbledCurrent } = get();
            const { autoScrobble } = useSettingsStore.getState();

            if (
              autoScrobble &&
              currentSong &&
              !hasScrobbledCurrent &&
              duration > 0 &&
              (currentTime / duration >= 0.5 || currentTime >= 240)
            ) {
              set({ hasScrobbledCurrent: true });
              subsonicClient.scrobble(currentSong.id, Date.now() / 1000, true);
            }
          },
          onTrackEnded: () => {
            const { repeatMode, nextTrack } = get();
            if (repeatMode === "one") {
              const current = get().currentSong;
              if (current) {
                audioEngine.seek(0);
                audioEngine.resume();
              }
            } else {
              nextTrack();
            }
          },
          onBuffering: (isBuffering) => set({ isBuffering }),
          onError: (err) => {
            console.error("[PlayerStore] Audio error:", err);
            set({ isBuffering: false, isPlaying: false });
          },
          onPlayStateChange: (isPlaying) => {
            set({ isPlaying });
            updateMediaSessionPlaybackState(isPlaying ? "playing" : "paused");
          },
        });

        // Setup MediaSession action buttons
        setupMediaSessionActionHandlers({
          onPlay: () => get().resume(),
          onPause: () => get().pause(),
          onNext: () => get().nextTrack(),
          onPrevious: () => get().previousTrack(),
          onSeek: (seconds) => {
            if (seconds < 0) {
              get().seek(Math.max(0, get().currentTime + seconds));
            } else if (seconds > 0 && seconds <= 15) {
              get().seek(get().currentTime + seconds);
            } else {
              get().seek(seconds);
            }
          },
        });

        // Sync initial volume and settings
        audioEngine.setVolume(get().volume);
        audioEngine.setMuted(get().isMuted);

        const settings = useSettingsStore.getState();
        audioEngine.setReplayGainMode(settings.replayGainMode);
        audioEngine.setEqualizerBands(settings.equalizerGains, settings.equalizerEnabled);
      },

      playSong: async (song, newQueue, newIndex) => {
        let currentQueue = newQueue || get().queue;
        let index = newIndex !== undefined ? newIndex : currentQueue.findIndex((s) => s.id === song.id);

        if (index === -1) {
          currentQueue = [...currentQueue, song];
          index = currentQueue.length - 1;
        }

        set({
          currentSong: song,
          queue: currentQueue,
          originalQueue: newQueue ? [...newQueue] : get().originalQueue.length ? get().originalQueue : [...currentQueue],
          queueIndex: index,
          currentTime: 0,
          duration: song.duration || 0,
          isPlaying: true,
          hasScrobbledCurrent: false,
        });

        // Update Media Session
        updateMediaSessionMetadata(song);
        updateMediaSessionPlaybackState("playing");

        // Send now-playing scrobble
        subsonicClient.scrobble(song.id, undefined, false);

        // Track in history & auto-cache
        touchTrackPlayed(song.id);
        const { autoCacheStreamed, maxCacheSizeGB, bitrate } = useSettingsStore.getState();
        if (autoCacheStreamed) {
          autoCacheTrack(song, maxCacheSizeGB * 1024 * 1024 * 1024);
        }

        // Extract vibrant background color
        if (song.coverArt) {
          const coverUrl = subsonicClient.getCoverArtUrl(song.coverArt, 300);
          extractColorFromImage(coverUrl).then((color) => {
            set({ activeColor: color });
          });
        }

        // Start playback
        await audioEngine.playSong(song, {
          bitrate,
        });

        // Preload next track if available
        if (index + 1 < currentQueue.length) {
          audioEngine.preloadNext(currentQueue[index + 1]);
        }
      },

      togglePlay: () => {
        const { isPlaying, currentSong, queue } = get();
        if (!currentSong && queue.length > 0) {
          get().playSong(queue[0], queue, 0);
          return;
        }
        if (isPlaying) {
          audioEngine.pause();
          set({ isPlaying: false });
        } else {
          audioEngine.resume();
          set({ isPlaying: true });
        }
      },

      pause: () => {
        audioEngine.pause();
        set({ isPlaying: false });
      },

      resume: () => {
        audioEngine.resume();
        set({ isPlaying: true });
      },

      nextTrack: async () => {
        const { queue, queueIndex, repeatMode } = get();
        if (queue.length === 0) return;

        let nextIdx = queueIndex + 1;
        if (nextIdx >= queue.length) {
          if (repeatMode === "all") {
            nextIdx = 0;
          } else {
            set({ isPlaying: false });
            return;
          }
        }

        await get().playSong(queue[nextIdx], queue, nextIdx);
      },

      previousTrack: async () => {
        const { queue, queueIndex, currentTime } = get();
        if (queue.length === 0) return;

        // If played more than 3 seconds, restart current track
        if (currentTime > 3) {
          audioEngine.seek(0);
          set({ currentTime: 0 });
          return;
        }

        const prevIdx = queueIndex > 0 ? queueIndex - 1 : 0;
        await get().playSong(queue[prevIdx], queue, prevIdx);
      },

      seek: (seconds) => {
        audioEngine.seek(seconds);
        set({ currentTime: seconds });
      },

      setVolume: (volume) => {
        audioEngine.setVolume(volume);
        set({ volume, isMuted: false });
      },

      toggleMute: () => {
        const nextMuted = !get().isMuted;
        audioEngine.setMuted(nextMuted);
        set({ isMuted: nextMuted });
      },

      toggleShuffle: () => {
        const { isShuffled, queue, originalQueue, currentSong } = get();

        if (!isShuffled) {
          // Shuffle queue while keeping current song at top
          const remaining = queue.filter((s) => s.id !== currentSong?.id);
          for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          }
          const shuffled = currentSong ? [currentSong, ...remaining] : remaining;
          set({
            isShuffled: true,
            originalQueue: [...queue],
            queue: shuffled,
            queueIndex: currentSong ? 0 : -1,
          });
        } else {
          // Restore original order
          const restored = [...originalQueue];
          const newIdx = currentSong ? restored.findIndex((s) => s.id === currentSong.id) : 0;
          set({
            isShuffled: false,
            queue: restored,
            queueIndex: Math.max(0, newIdx),
          });
        }
      },

      cycleRepeatMode: () => {
        const modes: RepeatMode[] = ["off", "all", "one"];
        const nextMode = modes[(modes.indexOf(get().repeatMode) + 1) % modes.length];
        set({ repeatMode: nextMode });
      },

      setQueue: (newQueue, startIndex = 0) => {
        set({
          queue: newQueue,
          originalQueue: [...newQueue],
          queueIndex: startIndex,
          isShuffled: false,
        });
        if (newQueue.length > 0 && startIndex >= 0 && startIndex < newQueue.length) {
          get().playSong(newQueue[startIndex], newQueue, startIndex);
        }
      },

      addToQueue: (songs, next = false) => {
        const songList = Array.isArray(songs) ? songs : [songs];
        const { queue, queueIndex } = get();

        if (queue.length === 0) {
          get().setQueue(songList, 0);
          return;
        }

        const newQueue = [...queue];
        if (next) {
          newQueue.splice(queueIndex + 1, 0, ...songList);
        } else {
          newQueue.push(...songList);
        }

        set({ queue: newQueue });
      },

      removeFromQueue: (index) => {
        const { queue, queueIndex } = get();
        const updated = queue.filter((_, i) => i !== index);
        let newIndex = queueIndex;
        if (index < queueIndex) {
          newIndex--;
        } else if (index === queueIndex) {
          if (updated.length > 0) {
            newIndex = Math.min(queueIndex, updated.length - 1);
            get().playSong(updated[newIndex], updated, newIndex);
          } else {
            set({ currentSong: null, isPlaying: false, queue: [], queueIndex: -1 });
            return;
          }
        }
        set({ queue: updated, queueIndex: newIndex });
      },

      reorderQueue: (startIndex, endIndex) => {
        const { queue, queueIndex } = get();
        const result = Array.from(queue);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        let newCurrentIndex = queueIndex;
        if (startIndex === queueIndex) {
          newCurrentIndex = endIndex;
        } else if (startIndex < queueIndex && endIndex >= queueIndex) {
          newCurrentIndex--;
        } else if (startIndex > queueIndex && endIndex <= queueIndex) {
          newCurrentIndex++;
        }

        set({ queue: result, queueIndex: newCurrentIndex });
      },

      clearQueue: () => {
        audioEngine.pause();
        set({
          queue: [],
          originalQueue: [],
          currentSong: null,
          queueIndex: -1,
          isPlaying: false,
          currentTime: 0,
        });
      },

      setFullscreenOpen: (open) => set({ isFullscreenOpen: open }),
      setLyricsOpen: (open) => set({ isLyricsOpen: open }),
      setQueueOpen: (open) => set({ isQueueOpen: open }),
      setEqualizerOpen: (open) => set({ isEqualizerOpen: open }),
    }),
    {
      name: "navidrome-player-storage",
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
        currentSong: state.currentSong,
        queue: state.queue,
        queueIndex: state.queueIndex,
      }),
    }
  )
);
