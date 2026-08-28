"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Music2,
  WifiOff,
  Play,
  Shuffle,
  Search,
  ArrowDownAZ,
  User,
  Clock,
  X,
} from "lucide-react";
import { Song } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { TrackRow } from "../../components/shared/TrackRow";
import { getOfflineTracks, isBrowserOffline } from "../../lib/db/offlineProvider";
import { usePlayerStore } from "../../store/usePlayerStore";
import { formatDuration } from "../../lib/utils/formatters";

type SongSortMode = "alphabetical" | "artist" | "duration" | "recent";

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [songSort, setSongSort] = useState<SongSortMode>("alphabetical");
  const [searchQuery, setSearchQuery] = useState("");

  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      setIsOffline(true);
      getOfflineTracks()
        .then(setSongs)
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getSongs(500)
      .then((data) => {
        setSongs(data);
        setIsOffline(false);
      })
      .catch(async (err) => {
        console.warn("Online songs failed, fallback to offline:", err);
        setIsOffline(true);
        const offTracks = await getOfflineTracks();
        setSongs(offTracks);
      })
      .finally(() => setLoading(false));
  }, []);

  const processedSongs = useMemo(() => {
    let list = [...songs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q)) ||
          (s.album && s.album.toLowerCase().includes(q))
      );
    }

    if (songSort === "alphabetical") {
      list.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
          numeric: true,
        })
      );
    } else if (songSort === "artist") {
      list.sort((a, b) => {
        const comp = (a.artist || "").localeCompare(b.artist || "", undefined, {
          sensitivity: "base",
          numeric: true,
        });
        if (comp !== 0) return comp;
        return (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
          numeric: true,
        });
      });
    } else if (songSort === "duration") {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    } else if (songSort === "recent") {
      list.sort((a, b) => {
        if (a.created && b.created) {
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        }
        return 0;
      });
    }

    return list;
  }, [songs, songSort, searchQuery]);

  const songsByLetter = useMemo(() => {
    if (songSort !== "alphabetical" || searchQuery.trim()) return null;

    const groups: { [key: string]: Song[] } = {};
    for (const song of processedSongs) {
      const firstChar = (song.title || "#")[0].toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    }
    return groups;
  }, [processedSongs, songSort, searchQuery]);

  const availableLetters = useMemo(() => {
    if (!songsByLetter) return [];
    return Object.keys(songsByLetter).sort((a, b) => {
      if (a === "#") return -1;
      if (b === "#") return 1;
      return a.localeCompare(b);
    });
  }, [songsByLetter]);

  const totalDuration = useMemo(() => {
    return processedSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  }, [processedSongs]);

  const handlePlayAll = () => {
    if (processedSongs.length > 0) {
      playSong(processedSongs[0], processedSongs, 0);
    }
  };

  const handleShuffle = () => {
    if (processedSongs.length > 0) {
      const shuffled = [...processedSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`songs-letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Music2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Brani</h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <WifiOff size={11} /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOffline
                ? "Tutti i brani disponibili offline sul tuo dispositivo"
                : "Tutta la tua collezione musicale brano per brano"}
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayAll}
            disabled={processedSongs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play size={14} className="fill-current" /> Riproduci Tutto
          </button>
          <button
            onClick={handleShuffle}
            disabled={processedSongs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold transition-colors cursor-pointer"
          >
            <Shuffle size={13} /> Casuale
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Sort Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 md:p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{processedSongs.length} brani</span>
          <span>•</span>
          <span>{formatDuration(totalDuration)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtra brani o artisti..."
              className="w-full pl-8 pr-7 py-1.5 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort Modes */}
          <div className="flex items-center bg-secondary/70 p-0.5 rounded-xl border border-border text-xs">
            <button
              onClick={() => setSongSort("alphabetical")}
              title="Ordine Alfabetico (A-Z)"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                songSort === "alphabetical"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownAZ size={13} />
              <span>A-Z</span>
            </button>
            <button
              onClick={() => setSongSort("artist")}
              title="Ordina per Artista"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                songSort === "artist"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User size={13} />
              <span>Artista</span>
            </button>
            <button
              onClick={() => setSongSort("duration")}
              title="Ordina per Durata"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                songSort === "duration"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock size={13} />
              <span>Durata</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Alphabetical Index Jumper (when in A-Z mode) */}
      {songsByLetter && availableLetters.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto py-1 px-2 scrollbar-none bg-card/60 rounded-xl border border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase px-1 shrink-0">
            Indice:
          </span>
          {availableLetters.map((l) => (
            <button
              key={l}
              onClick={() => scrollToLetter(l)}
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Songs List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : processedSongs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Music2 size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-foreground">
            {searchQuery ? `Nessun brano trovato con "${searchQuery}"` : "Nessun brano trovato"}
          </p>
        </div>
      ) : songsByLetter ? (
        <div className="space-y-6">
          {availableLetters.map((letter) => {
            const letterSongs = songsByLetter[letter];
            return (
              <div
                key={letter}
                id={`songs-letter-${letter}`}
                className="space-y-1.5 scroll-mt-20"
              >
                <div className="sticky top-14 z-10 py-1 px-3 bg-background/90 backdrop-blur-md flex items-center gap-2 border-b border-border/50">
                  <span className="text-sm font-black text-primary w-5">{letter}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({letterSongs.length} {letterSongs.length === 1 ? "brano" : "brani"})
                  </span>
                </div>
                <div className="space-y-1">
                  {letterSongs.map((song) => {
                    const overallIndex = processedSongs.findIndex((s) => s.id === song.id);
                    return (
                      <TrackRow
                        key={song.id}
                        song={song}
                        index={overallIndex >= 0 ? overallIndex : 0}
                        queueContext={processedSongs}
                        showCover
                        showAlbum
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {processedSongs.map((song, idx) => (
            <TrackRow
              key={song.id}
              song={song}
              index={idx}
              queueContext={processedSongs}
              showCover
              showAlbum
            />
          ))}
        </div>
      )}
    </div>
  );
}
