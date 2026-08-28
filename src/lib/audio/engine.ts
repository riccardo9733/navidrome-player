import { Song } from "../subsonic/types";
import { subsonicClient } from "../subsonic/client";
import { getLocalBlobUrl } from "../db/downloadManager";

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onTrackEnded: () => void;
  onBuffering: (isBuffering: boolean) => void;
  onError: (error: string) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export class AudioEngine {
  private primaryAudio: HTMLAudioElement | null = null;
  private preloadAudio: HTMLAudioElement | null = null;

  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private currentSong: Song | null = null;
  private isMuted = false;
  private volume = 1;
  private callbacks: AudioEngineCallbacks | null = null;
  private replayGainMode: "track" | "album" | "off" = "track";

  constructor() {
    if (typeof window !== "undefined") {
      this.primaryAudio = new Audio();
      this.primaryAudio.crossOrigin = "anonymous";
      this.primaryAudio.preload = "auto";

      this.preloadAudio = new Audio();
      this.preloadAudio.crossOrigin = "anonymous";
      this.preloadAudio.preload = "auto";

      this.setupListeners();
    }
  }

  public setCallbacks(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  private setupListeners() {
    if (!this.primaryAudio) return;

    this.primaryAudio.addEventListener("timeupdate", () => {
      if (this.primaryAudio && this.callbacks) {
        const cur = this.primaryAudio.currentTime;
        const dur = this.primaryAudio.duration || (this.currentSong?.duration || 0);
        this.callbacks.onTimeUpdate(cur, dur);
      }
    });

    this.primaryAudio.addEventListener("ended", () => {
      if (this.callbacks) {
        this.callbacks.onTrackEnded();
      }
    });

    this.primaryAudio.addEventListener("waiting", () => {
      if (this.callbacks) this.callbacks.onBuffering(true);
    });

    this.primaryAudio.addEventListener("playing", () => {
      if (this.callbacks) {
        this.callbacks.onBuffering(false);
        this.callbacks.onPlayStateChange(true);
      }
    });

    this.primaryAudio.addEventListener("pause", () => {
      if (this.callbacks) {
        this.callbacks.onPlayStateChange(false);
      }
    });

    this.primaryAudio.addEventListener("error", () => {
      if (this.callbacks) {
        const msg = this.primaryAudio?.error?.message || "Errore durante la riproduzione audio";
        this.callbacks.onError(msg);
        this.callbacks.onBuffering(false);
      }
    });
  }

  public initWebAudio() {
    if (typeof window === "undefined" || this.audioCtx || !this.primaryAudio) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.sourceNode = this.audioCtx.createMediaElementSource(this.primaryAudio);
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();

      // Create 10-band peaking filters
      this.eqFilters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.frequency.value = freq;
        if (i === 0) {
          filter.type = "lowshelf";
        } else if (i === EQ_FREQUENCIES.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4;
        }
        filter.gain.value = 0;
        return filter;
      });

      // Connect graph: Source -> Filter 0 -> Filter 1 -> ... -> Analyser -> Gain -> Destination
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn("[AudioEngine] Web Audio setup not allowed or failed:", err);
    }
  }

  public async playSong(
    song: Song,
    options?: {
      startTime?: number;
      bitrate?: number;
      format?: string;
    }
  ) {
    this.currentSong = song;

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    if (!this.audioCtx) {
      this.initWebAudio();
    }

    // Check if song has a local offline blob
    const localUrl = await getLocalBlobUrl(song.id);
    let targetSrc = localUrl;

    if (!targetSrc) {
      if (song.path && (song.path.startsWith("http://") || song.path.startsWith("https://"))) {
        targetSrc = song.path;
      } else {
        targetSrc = subsonicClient.getStreamUrl(song.id, {
          maxBitRate: (options?.bitrate as unknown as 0 | 128 | 192 | 256 | 320) || undefined,
        });
      }
    }

    if (this.primaryAudio) {
      if (this.primaryAudio.src !== targetSrc) {
        this.primaryAudio.src = targetSrc;
        this.primaryAudio.load();
      }

      this.applyVolume();

      if (options?.startTime && options.startTime > 0) {
        this.primaryAudio.currentTime = options.startTime;
      }

      try {
        await this.primaryAudio.play();
      } catch (err) {
        console.warn("[AudioEngine] Play was prevented / failed:", err);
      }
    }
  }

  public preloadNext(nextSong: Song) {
    if (!this.preloadAudio) return;
    getLocalBlobUrl(nextSong.id).then((localUrl) => {
      let src = localUrl;
      if (!src) {
        if (nextSong.path && (nextSong.path.startsWith("http://") || nextSong.path.startsWith("https://"))) {
          src = nextSong.path;
        } else {
          src = subsonicClient.getStreamUrl(nextSong.id);
        }
      }
      if (this.preloadAudio && src) {
        this.preloadAudio.src = src;
        this.preloadAudio.load();
      }
    });
  }

  public pause() {
    this.primaryAudio?.pause();
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    this.primaryAudio?.play();
  }

  public seek(seconds: number) {
    if (this.primaryAudio) {
      this.primaryAudio.currentTime = Math.max(0, seconds);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.applyVolume();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.applyVolume();
  }

  public setReplayGainMode(mode: "track" | "album" | "off") {
    this.replayGainMode = mode;
    this.applyVolume();
  }

  private applyVolume() {
    if (!this.primaryAudio) return;

    if (this.isMuted) {
      this.primaryAudio.volume = 0;
      return;
    }

    let finalVolume = this.volume;

    // Apply ReplayGain if available
    if (this.replayGainMode !== "off" && this.currentSong?.replayGain) {
      const gainDb =
        this.replayGainMode === "album"
          ? this.currentSong.replayGain.albumGain ?? this.currentSong.replayGain.trackGain
          : this.currentSong.replayGain.trackGain;

      if (gainDb !== undefined) {
        const gainMultiplier = Math.pow(10, gainDb / 20);
        finalVolume = Math.max(0, Math.min(1, this.volume * gainMultiplier));
      }
    }

    this.primaryAudio.volume = finalVolume;
  }

  public setEqualizerBands(gains: number[], enabled = true) {
    if (!this.eqFilters.length) return;
    this.eqFilters.forEach((filter, index) => {
      if (index < gains.length) {
        filter.gain.value = enabled ? gains[index] : 0;
      }
    });
  }

  public getVisualizerData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getCurrentTime(): number {
    return this.primaryAudio?.currentTime || 0;
  }

  public getDuration(): number {
    return this.primaryAudio?.duration || this.currentSong?.duration || 0;
  }
}

export const audioEngine = new AudioEngine();
