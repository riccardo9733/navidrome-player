"use client";

import { useEffect, useRef, useState } from "react";
import { Song, LyricsLine } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { findActiveLyricIndex, parseLRC } from "../../lib/utils/lrcParser";
import { usePlayerStore } from "../../store/usePlayerStore";
import { FileText, Loader2, Music2 } from "lucide-react";

interface SyncedLyricsProps {
  song: Song | null;
  className?: string;
  onSeek?: (seconds: number) => void;
}

export function SyncedLyrics({ song, className = "", onSeek }: SyncedLyricsProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const seek = usePlayerStore((s) => s.seek);

  const [loading, setLoading] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [hasNoLyrics, setHasNoLyrics] = useState(false);

  const activeIndex = findActiveLyricIndex(lyrics, currentTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!song) {
      setLyrics([]);
      setPlainLyrics(null);
      setHasNoLyrics(true);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setHasNoLyrics(false);
    setLyrics([]);
    setPlainLyrics(null);

    subsonicClient
      .getLyrics(song.id)
      .then((res) => {
        if (!isMounted) return;
        if (res.syncedLyrics) {
          const parsed = parseLRC(res.syncedLyrics);
          if (parsed.length > 0) {
            setLyrics(parsed);
            setPlainLyrics(null);
          } else {
            setPlainLyrics(res.syncedLyrics);
          }
        } else if (res.plainLyrics) {
          setPlainLyrics(res.plainLyrics);
        } else {
          setHasNoLyrics(true);
        }
      })
      .catch(() => {
        if (isMounted) setHasNoLyrics(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [song?.id]);

  // Smooth scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  const handleLineClick = (lineTime: number) => {
    if (onSeek) {
      onSeek(lineTime);
    } else {
      seek(lineTime);
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-muted-foreground gap-3 ${className}`}>
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm">Caricamento testo in corso...</p>
      </div>
    );
  }

  if (hasNoLyrics || (!lyrics.length && !plainLyrics)) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-muted-foreground gap-3 text-center ${className}`}>
        <div className="p-4 rounded-2xl bg-secondary text-muted-foreground">
          <Music2 size={36} />
        </div>
        <p className="text-base font-semibold text-foreground">Nessun testo disponibile</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Il server Navidrome non ha restituito testi sincronizzati o file LRC per questo brano.
        </p>
      </div>
    );
  }

  if (plainLyrics) {
    return (
      <div
        ref={containerRef}
        className={`overflow-y-auto px-6 py-8 text-center text-foreground/90 whitespace-pre-wrap leading-relaxed ${className}`}
      >
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText size={14} /> Testo Non Sincronizzato
        </div>
        <p className="text-lg font-medium select-text">{plainLyrics}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto px-4 py-16 space-y-6 text-center scroll-smooth mask-fade ${className}`}
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;

        return (
          <p
            key={`${line.time}-${index}`}
            ref={isActive ? activeLineRef : null}
            onClick={() => handleLineClick(line.time)}
            className={`lyric-line cursor-pointer font-bold select-none transition-all duration-300 py-1.5 px-4 rounded-xl ${
              isActive
                ? "text-2xl md:text-3xl text-foreground font-extrabold scale-105 bg-primary/10 drop-shadow-sm"
                : isPast
                ? "text-lg md:text-xl text-muted-foreground/60 hover:text-foreground opacity-60"
                : "text-lg md:text-xl text-muted-foreground/80 hover:text-foreground opacity-70"
            }`}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
