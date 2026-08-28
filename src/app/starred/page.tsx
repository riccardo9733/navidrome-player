"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Heart,
  Disc3,
  Users,
  Music2,
  WifiOff,
  Play,
  Shuffle,
  Search,
  ArrowDownAZ,
  Clock,
  User,
  X,
} from "lucide-react";
import { Song, Album, Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { TrackRow } from "../../components/shared/TrackRow";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";
import {
  getOfflineAlbums,
  getOfflineArtists,
  getOfflineTracks,
  isBrowserOffline,
} from "../../lib/db/offlineProvider";
import { usePlayerStore } from "../../store/usePlayerStore";
import { formatDuration } from "../../lib/utils/formatters";

type StarredTab = "songs" | "albums" | "artists";
type SongSortMode = "alphabetical" | "artist" | "recent";

export default function StarredPage() {
  const [activeTab, setActiveTab] = useState<StarredTab>("songs");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Sorting & Filtering for Songs
  const [songSort, setSongSort] = useState<SongSortMode>("alphabetical");
  const [searchQuery, setSearchQuery] = useState("");

  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      setIsOffline(true);
      Promise.all([getOfflineTracks(), getOfflineAlbums(), getOfflineArtists()])
        .then(([allTracks, allAlbums, allArtists]) => {
          setSongs(allTracks.filter((t) => t.starred));
          setAlbums(allAlbums.filter((a) => a.starred));
          setArtists(allArtists.filter((a) => a.starred));
        })
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getStarred()
      .then((data) => {
        setSongs(data.song);
        setAlbums(data.album);
        setArtists(data.artist);
        setIsOffline(false);
      })
      .catch(async (err) => {
        console.warn("Online starred failed, fallback to offline:", err);
        setIsOffline(true);
        const [allTracks, allAlbums, allArtists] = await Promise.all([
          getOfflineTracks(),
          getOfflineAlbums(),
          getOfflineArtists(),
        ]);
        setSongs(allTracks.filter((t) => t.starred));
        setAlbums(allAlbums.filter((a) => a.starred));
        setArtists(allArtists.filter((a) => a.starred));
      })
      .finally(() => setLoading(false));
  }, []);

  // Processed and sorted songs
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
    } else if (songSort === "recent") {
      list.sort((a, b) => {
        if (a.starred && b.starred) {
          return new Date(b.starred).getTime() - new Date(a.starred).getTime();
        }
        return 0;
      });
    }

    return list;
  }, [songs, songSort, searchQuery]);

  // Group songs by letter when in alphabetical sort mode
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
    const el = document.getElementById(`letter-section-${letter}`);
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
            <Heart size={24} className="fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">I Tuoi Preferiti</h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <WifiOff size={11} /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOffline
                ? "Visualizzazione preferiti tra i brani salvati offline"
                : "Tutti i brani, album e artisti contrassegnati con la stella"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("songs")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "songs"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Music2 size={14} /> Brani ({songs.length})
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "albums"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Disc3 size={14} /> Album ({albums.length})
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "artists"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={14} /> Artisti ({artists.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === "songs" ? (
        songs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-base font-medium text-foreground">Nessun brano preferito al momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toolbar for Songs: Controls & Sort */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 md:p-4 rounded-2xl border border-border shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePlayAll}
                  disabled={processedSongs.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Play size={15} className="fill-current" /> Riproduci Tutto
                </button>
                <button
                  onClick={handleShuffle}
                  disabled={processedSongs.length === 0}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Shuffle size={14} /> Casuale
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground ml-2 pl-3 border-l border-border">
                  <span>{processedSongs.length} brani</span>
                  <span>•</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </div>

              {/* Search & Sort Filters */}
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
                    placeholder="Cerca tra i preferiti..."
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
                    onClick={() => setSongSort("recent")}
                    title="Aggiunti di Recente"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      songSort === "recent"
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock size={13} />
                    <span>Recenti</span>
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

            {/* Track List */}
            {processedSongs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">Nessun brano trovato con &quot;{searchQuery}&quot;</p>
              </div>
            ) : songsByLetter ? (
              <div className="space-y-6">
                {availableLetters.map((letter) => {
                  const letterSongs = songsByLetter[letter];
                  return (
                    <div key={letter} id={`letter-section-${letter}`} className="space-y-1.5 scroll-mt-20">
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
        )
      ) : activeTab === "albums" ? (
        albums.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-base font-medium text-foreground">Nessun album preferito al momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )
      ) : artists.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-base font-medium text-foreground">Nessun artista preferito al momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}

