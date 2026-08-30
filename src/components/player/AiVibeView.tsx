"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Key,
  RotateCw,
  Search,
  ListPlus,
  Loader2,
  AlertCircle,
  Lightbulb,
  Radio,
  Check,
  Disc,
  Compass,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { Song } from "../../lib/subsonic/types";
import { useSettingsStore } from "../../store/useSettingsStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useAiSessionStore } from "../../store/useAiSessionStore";
import { subsonicClient } from "../../lib/subsonic/client";
import {
  fetchTrackTrivia,
  fetchSimilarSongs,
  recommendNextTracks,
  SimilarSongRecommendation,
} from "../../lib/ai/openRouterClient";
import { fetchSongPreview, TrackPreviewInfo } from "../../lib/utils/previewClient";

interface AiVibeViewProps {
  currentSong: Song;
  onCloseFullscreen: () => void;
}

export function AiVibeView({ currentSong, onCloseFullscreen }: AiVibeViewProps) {
  const openRouterApiKey = useSettingsStore((s) => s.openRouterApiKey);
  const openRouterModel = useSettingsStore((s) => s.openRouterModel);
  const openRouterBaseUrl = useSettingsStore((s) => s.openRouterBaseUrl);

  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const isMainPlaying = usePlayerStore((s) => s.isPlaying);
  const pauseMain = usePlayerStore((s) => s.pause);

  // Session Store Cache bindings
  const sessionData = useAiSessionStore((s) => (currentSong ? s.cache[currentSong.id] : undefined));
  const setTrivia = useAiSessionStore((s) => s.setTrivia);
  const setSimilar = useAiSessionStore((s) => s.setSimilar);
  const setTriviaLoading = useAiSessionStore((s) => s.setTriviaLoading);
  const setSimilarLoading = useAiSessionStore((s) => s.setSimilarLoading);
  const setTriviaError = useAiSessionStore((s) => s.setTriviaError);
  const setSimilarError = useAiSessionStore((s) => s.setSimilarError);
  const invalidateSongCache = useAiSessionStore((s) => s.invalidateSongCache);

  // Smart Queue Local State
  const [isExtendingQueue, setIsExtendingQueue] = useState(false);
  const [queueSuccessMsg, setQueueSuccessMsg] = useState<string | null>(null);

  // Audio Preview State
  const [previewDataMap, setPreviewDataMap] = useState<Record<number, TrackPreviewInfo | null>>({});
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);
  const [loadingPreviewIndex, setLoadingPreviewIndex] = useState<number | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isLoadingTrivia = Boolean(sessionData?.isLoadingTrivia);
  const isLoadingSimilar = Boolean(sessionData?.isLoadingSimilar);
  const triviaResult = sessionData?.trivia;
  const similarSongs = sessionData?.similar || [];
  const triviaError = sessionData?.triviaError;
  const similarError = sessionData?.similarError;

  // Cleanup audio preview on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Fetch previews metadata for similar songs
  useEffect(() => {
    if (similarSongs.length > 0) {
      similarSongs.forEach((song, idx) => {
        fetchSongPreview(song.title, song.artist).then((info) => {
          setPreviewDataMap((prev) => ({ ...prev, [idx]: info }));
        });
      });
    }
  }, [similarSongs]);

  // Handle Play/Pause Preview
  const handleTogglePreview = async (index: number, song: SimilarSongRecommendation) => {
    // If clicking on currently playing preview, pause/stop it
    if (activePreviewIndex === index) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setActivePreviewIndex(null);
      setPreviewProgress(0);
      return;
    }

    // Stop existing preview if playing another one
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    setLoadingPreviewIndex(index);

    try {
      let previewInfo = previewDataMap[index];
      if (!previewInfo) {
        previewInfo = await fetchSongPreview(song.title, song.artist);
        if (previewInfo) {
          setPreviewDataMap((prev) => ({ ...prev, [index]: previewInfo }));
        }
      }

      if (!previewInfo?.previewUrl) {
        alert("Anteprima audio non disponibile per questo brano.");
        setLoadingPreviewIndex(null);
        return;
      }

      // If main music player is running, pause it gracefully
      if (isMainPlaying) {
        pauseMain();
      }

      const audio = new Audio(previewInfo.previewUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setActivePreviewIndex(null);
        setPreviewProgress(0);
      };

      audio.onerror = () => {
        setActivePreviewIndex(null);
        setLoadingPreviewIndex(null);
      };

      await audio.play();
      setActivePreviewIndex(index);
    } catch (err) {
      console.warn("Failed to play preview:", err);
      setActivePreviewIndex(null);
    } finally {
      setLoadingPreviewIndex(null);
    }
  };

  // 1. Fetch Track Trivia
  const handleFetchTrivia = useCallback(
    async (force = false) => {
      if (!openRouterApiKey || !currentSong) return;
      const curData = useAiSessionStore.getState().cache[currentSong.id];
      if (!force && (curData?.trivia || curData?.isLoadingTrivia)) return;

      setTriviaLoading(currentSong.id, true);
      try {
        const res = await fetchTrackTrivia({
          song: currentSong,
          apiKey: openRouterApiKey,
          model: openRouterModel,
          baseUrl: openRouterBaseUrl,
        });
        setTrivia(currentSong.id, res);
      } catch (err: unknown) {
        setTriviaError(currentSong.id, err instanceof Error ? err.message : "Impossibile recuperare aneddoti.");
      }
    },
    [currentSong, openRouterApiKey, openRouterModel, openRouterBaseUrl, setTriviaLoading, setTrivia, setTriviaError]
  );

  // 2. Fetch Similar Songs
  const handleFetchSimilar = useCallback(
    async (force = false) => {
      if (!openRouterApiKey || !currentSong) return;
      const curData = useAiSessionStore.getState().cache[currentSong.id];
      if (!force && (curData?.similar || curData?.isLoadingSimilar)) return;

      setSimilarLoading(currentSong.id, true);
      try {
        const res = await fetchSimilarSongs({
          song: currentSong,
          apiKey: openRouterApiKey,
          model: openRouterModel,
          baseUrl: openRouterBaseUrl,
        });
        setSimilar(currentSong.id, res);
      } catch (err: unknown) {
        setSimilarError(currentSong.id, err instanceof Error ? err.message : "Impossibile recuperare brani simili.");
      }
    },
    [currentSong, openRouterApiKey, openRouterModel, openRouterBaseUrl, setSimilarLoading, setSimilar, setSimilarError]
  );

  // 3. Extend Queue with AI
  const handleSmartQueueExtend = async () => {
    if (!openRouterApiKey || !currentSong || isExtendingQueue) return;
    setIsExtendingQueue(true);
    setQueueSuccessMsg(null);

    try {
      let candidates = await subsonicClient.getRandomSongs(35, currentSong.genre);
      if (!candidates || candidates.length < 5) {
        candidates = await subsonicClient.getRandomSongs(40);
      }

      const currentQueueIds = new Set(queue.map((q) => q.id));
      currentQueueIds.add(currentSong.id);
      const filteredCandidates = candidates.filter((c) => !currentQueueIds.has(c.id));
      const candidatePool = filteredCandidates.length >= 3 ? filteredCandidates : candidates;
      const recentSongs = queue.slice(Math.max(0, queueIndex - 2), queueIndex + 1);

      const recommended = await recommendNextTracks({
        currentTrack: currentSong,
        recentTracks: recentSongs,
        candidates: candidatePool,
        apiKey: openRouterApiKey,
        model: openRouterModel,
        baseUrl: openRouterBaseUrl,
      });

      if (recommended.length > 0) {
        addToQueue(recommended);
        setQueueSuccessMsg(`Aggiunti ${recommended.length} brani armonici in coda!`);
        setTimeout(() => setQueueSuccessMsg(null), 4000);
      }
    } catch (err: unknown) {
      console.error("Smart queue failed:", err);
    } finally {
      setIsExtendingQueue(false);
    }
  };

  // Trigger when entering tab for the current song if not already cached
  useEffect(() => {
    if (openRouterApiKey && currentSong) {
      const curData = useAiSessionStore.getState().cache[currentSong.id];
      if (!curData?.trivia && !curData?.isLoadingTrivia) {
        handleFetchTrivia();
      }
      if (!curData?.similar && !curData?.isLoadingSimilar) {
        handleFetchSimilar();
      }
    }
  }, [currentSong?.id, openRouterApiKey, handleFetchTrivia, handleFetchSimilar]);

  // If no API key configured, show setup banner
  if (!openRouterApiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-lg">
          <Sparkles size={28} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">Attiva le Funzionalità AI</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configura la tua API Key OpenRouter nelle impostazioni per sbloccare micro-curiosità storiche, brani simili con anteprima audio di 30s e continuazione intelligente della coda.
          </p>
        </div>

        <Link
          href="/settings"
          onClick={onCloseFullscreen}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          <Key size={14} />
          <span>Configura OpenRouter nelle Impostazioni</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Mini Current Track Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/80 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Radio size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">AI Vibe & Discovery</p>
            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
              {currentSong.title} <span className="font-normal text-muted-foreground">— {currentSong.artist}</span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              if (currentSong) {
                invalidateSongCache(currentSong.id);
                if (previewAudioRef.current) {
                  previewAudioRef.current.pause();
                }
                setActivePreviewIndex(null);
                handleFetchTrivia(true);
                handleFetchSimilar(true);
              }
            }}
            disabled={isLoadingTrivia || isLoadingSimilar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all cursor-pointer disabled:opacity-50"
            title="Rigenera analisi per questo brano"
          >
            <RotateCw size={12} className={isLoadingTrivia || isLoadingSimilar ? "animate-spin text-primary" : ""} />
            <span className="hidden sm:inline">Rigenera</span>
          </button>
        </div>
      </div>

      {/* 1. Behind the Track (Micro-Trivia) Card */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Lightbulb size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Dietro il Brano</h3>
              <p className="text-[11px] text-muted-foreground">Curiosità e retroscena fulminei</p>
            </div>
          </div>

          <button
            onClick={() => handleFetchTrivia(true)}
            disabled={isLoadingTrivia}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
            title="Rigenera curiosità"
          >
            <RotateCw size={13} className={isLoadingTrivia ? "animate-spin text-primary" : ""} />
          </button>
        </div>

        {/* Trivia Content */}
        {isLoadingTrivia ? (
          <div className="space-y-2.5 py-2">
            <div className="h-4 bg-muted/60 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-muted/60 rounded-md animate-pulse w-5/6" />
            <div className="h-4 bg-muted/40 rounded-md animate-pulse w-4/6" />
          </div>
        ) : triviaError ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            <AlertCircle size={14} className="shrink-0" />
            <span>{triviaError}</span>
          </div>
        ) : triviaResult ? (
          <div className="space-y-3">
            <ul className="space-y-2">
              {triviaResult.trivia.map((t, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed p-2 rounded-xl bg-secondary/30 border border-border/40"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            {triviaResult.artistBioSnippet && (
              <p className="text-[11px] text-muted-foreground italic px-1 pt-1 border-t border-border/50 flex items-center gap-1.5">
                <Sparkles size={11} className="text-primary shrink-0" />
                <span>{triviaResult.artistBioSnippet}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nessuna informazione disponibile.</p>
        )}
      </div>

      {/* 2. Global Similar Songs Discovery Card */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Compass size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Brani Simili Consigliati
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  Preview 30s
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground">Ascolta un assaggio audio e scopri nuove gemme affini</p>
            </div>
          </div>

          <button
            onClick={() => handleFetchSimilar(true)}
            disabled={isLoadingSimilar}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
            title="Rigenera raccomandazioni"
          >
            <RotateCw size={13} className={isLoadingSimilar ? "animate-spin text-primary" : ""} />
          </button>
        </div>

        {/* Similar Songs List */}
        {isLoadingSimilar ? (
          <div className="space-y-2.5 py-2">
            <div className="h-16 bg-muted/60 rounded-xl animate-pulse w-full" />
            <div className="h-16 bg-muted/60 rounded-xl animate-pulse w-full" />
            <div className="h-16 bg-muted/40 rounded-xl animate-pulse w-full" />
          </div>
        ) : similarError ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            <AlertCircle size={14} className="shrink-0" />
            <span>{similarError}</span>
          </div>
        ) : similarSongs.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {similarSongs.map((rec, idx) => {
              const isPlayingPreview = activePreviewIndex === idx;
              const isLoadingPreview = loadingPreviewIndex === idx;
              const previewInfo = previewDataMap[idx];

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden flex flex-col p-3 rounded-2xl border transition-all ${
                    isPlayingPreview
                      ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30"
                      : "bg-secondary/40 hover:bg-secondary/70 border-border/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Cover or Disc Icon + Play Button */}
                    <div className="relative group shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-background border border-border/70 flex items-center justify-center shadow-xs">
                      {previewInfo?.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewInfo.artworkUrl}
                          alt={rec.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <Disc size={18} className="text-muted-foreground" />
                      )}

                      {/* Play / Pause Overlay Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(idx, rec)}
                        disabled={isLoadingPreview}
                        className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${
                          isPlayingPreview
                            ? "bg-primary/80 text-primary-foreground opacity-100"
                            : "bg-black/40 text-white opacity-90 group-hover:opacity-100 hover:bg-black/60"
                        }`}
                        title={isPlayingPreview ? "Pausa anteprima" : "Ascolta anteprima 30s"}
                      >
                        {isLoadingPreview ? (
                          <Loader2 size={16} className="animate-spin text-white" />
                        ) : isPlayingPreview ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Song Details & Reason */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {rec.title}
                        </h4>
                        {isPlayingPreview && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary animate-pulse shrink-0">
                            <Volume2 size={11} />
                            <span>Preview</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {rec.artist}
                      </p>
                      <p className="text-[10px] text-primary/85 font-medium mt-0.5 line-clamp-2">
                        💡 {rec.reason}
                      </p>
                    </div>

                    {/* Actions: Search Navidrome */}
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <Link
                        href={`/search?q=${encodeURIComponent(rec.title)}`}
                        onClick={onCloseFullscreen}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-background hover:bg-primary hover:text-primary-foreground text-foreground text-[11px] font-semibold border border-border transition-all cursor-pointer shadow-xs"
                        title="Cerca nella tua libreria Navidrome"
                      >
                        <Search size={12} />
                        <span className="hidden sm:inline">Cerca</span>
                      </Link>
                    </div>
                  </div>

                  {/* Playing Progress Bar */}
                  {isPlayingPreview && (
                    <div className="w-full bg-primary/20 h-1 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-150"
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nessuna raccomandazione disponibile al momento.</p>
        )}
      </div>

      {/* 3. Smart Queue Extension Action Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Sparkles size={15} className="text-primary" />
            Continua il Vibe nella Coda
          </h3>
          <p className="text-xs text-muted-foreground">
            L&apos;AI sceglie le migliori transizioni dalla tua libreria Navidrome e le accoda automaticamente.
          </p>
        </div>

        <button
          onClick={handleSmartQueueExtend}
          disabled={isExtendingQueue}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isExtendingQueue ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Analisi Vibe...</span>
            </>
          ) : (
            <>
              <ListPlus size={14} />
              <span>Aggiungi Brani Vibe</span>
            </>
          )}
        </button>
      </div>

      {/* Success Notification */}
      {queueSuccessMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/15 text-primary border border-primary/30 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Check size={15} className="shrink-0" />
          <span>{queueSuccessMsg}</span>
        </div>
      )}
    </div>
  );
}
