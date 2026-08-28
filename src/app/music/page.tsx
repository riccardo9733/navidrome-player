"use client";

import { useState, useEffect, useTransition, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Disc3,
  Users,
  ListMusic,
  Heart,
  Download,
  Filter,
  Search,
  Music2,
  Loader2,
  WifiOff,
  Play,
  Shuffle,
  ArrowDownAZ,
  User,
  Clock,
  X,
} from "lucide-react";
import { Album, Artist, Playlist, Song } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";
import { PlaylistCard } from "../../components/shared/PlaylistCard";
import { TrackRow } from "../../components/shared/TrackRow";
import {
  getOfflineAlbums,
  getOfflineArtists,
  getOfflinePlaylists,
  getOfflineTracks,
  isBrowserOffline,
} from "../../lib/db/offlineProvider";
import { usePlayerStore } from "../../store/usePlayerStore";
import { formatDuration } from "../../lib/utils/formatters";

type MusicTab = "songs" | "albums" | "artists" | "playlists";
type SongSort = "alphabetical" | "artist" | "duration" | "recent";

function MusicPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as MusicTab) || "songs";
  const [activeTab, setActiveTab] = useState<MusicTab>(initialTab);
  const [, startTransition] = useTransition();
  const [isOffline, setIsOffline] = useState(false);

  const playSong = usePlayerStore((s) => s.playSong);

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab") as MusicTab;
    if (tabFromUrl && ["songs", "albums", "artists", "playlists"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: MusicTab) => {
    setActiveTab(tab);
    startTransition(() => {
      router.replace(`/music?tab=${tab}`, { scroll: false });
    });
  };

  // State for Songs Tab
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [songSort, setSongSort] = useState<SongSort>("alphabetical");
  const [songFilter, setSongFilter] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);

  // State for Albums Tab
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumSort, setAlbumSort] = useState<"recent" | "frequent" | "newest" | "alphabeticalByName">("recent");
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // State for Artists Tab
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistFilter, setArtistFilter] = useState("");
  const [loadingArtists, setLoadingArtists] = useState(false);

  // State for Playlists Tab
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Lazy-load data when active tab changes
  useEffect(() => {
    if (isBrowserOffline()) {
      setIsOffline(true);
      if (activeTab === "songs" && allSongs.length === 0) {
        setLoadingSongs(true);
        getOfflineTracks().then((tracks) => {
          setAllSongs(tracks);
          setLoadingSongs(false);
        });
      } else if (activeTab === "albums") {
        setLoadingAlbums(true);
        getOfflineAlbums().then((offAlbums) => {
          setAlbums(offAlbums);
          setLoadingAlbums(false);
        });
      } else if (activeTab === "artists") {
        setLoadingArtists(true);
        getOfflineArtists().then((offArtists) => {
          setArtists(offArtists);
          setLoadingArtists(false);
        });
      } else if (activeTab === "playlists") {
        setLoadingPlaylists(true);
        getOfflinePlaylists().then((offPlaylists) => {
          setPlaylists(offPlaylists);
          setLoadingPlaylists(false);
        });
      }
      return;
    }

    if (activeTab === "songs" && allSongs.length === 0) {
      setLoadingSongs(true);
      subsonicClient
        .getSongs(500)
        .then((data) => {
          setAllSongs(data);
          setIsOffline(false);
        })
        .catch(async (err) => {
          console.warn("Online songs failed, fallback to offline:", err);
          setIsOffline(true);
          const offTracks = await getOfflineTracks();
          setAllSongs(offTracks);
        })
        .finally(() => setLoadingSongs(false));
    } else if (activeTab === "albums") {
      setLoadingAlbums(true);
      subsonicClient
        .getAlbumList(albumSort, 48)
        .then((data) => {
          setAlbums(data);
          setIsOffline(false);
        })
        .catch(async (err) => {
          console.warn("Online albums failed, fallback to offline:", err);
          setIsOffline(true);
          const offAlbums = await getOfflineAlbums();
          setAlbums(offAlbums);
        })
        .finally(() => setLoadingAlbums(false));
    } else if (activeTab === "artists" && artists.length === 0) {
      setLoadingArtists(true);
      subsonicClient
        .getArtists()
        .then((data) => {
          setArtists(data);
          setIsOffline(false);
        })
        .catch(async (err) => {
          console.warn("Online artists failed, fallback to offline:", err);
          setIsOffline(true);
          const offArtists = await getOfflineArtists();
          setArtists(offArtists);
        })
        .finally(() => setLoadingArtists(false));
    } else if (activeTab === "playlists" && playlists.length === 0) {
      setLoadingPlaylists(true);
      subsonicClient
        .getPlaylists()
        .then((data) => {
          setPlaylists(data);
          setIsOffline(false);
        })
        .catch(async (err) => {
          console.warn("Online playlists failed, fallback to offline:", err);
          setIsOffline(true);
          const offPlaylists = await getOfflinePlaylists();
          setPlaylists(offPlaylists);
        })
        .finally(() => setLoadingPlaylists(false));
    }
  }, [activeTab, albumSort, allSongs.length, artists.length, playlists.length]);

  // Processed Songs for the "Brani" tab
  const processedSongs = useMemo(() => {
    let list = [...allSongs];

    if (songFilter.trim()) {
      const q = songFilter.toLowerCase().trim();
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
  }, [allSongs, songSort, songFilter]);

  // Alphabetical groups for songs
  const songsByLetter = useMemo(() => {
    if (songSort !== "alphabetical" || songFilter.trim()) return null;

    const groups: { [key: string]: Song[] } = {};
    for (const song of processedSongs) {
      const firstChar = (song.title || "#")[0].toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    }
    return groups;
  }, [processedSongs, songSort, songFilter]);

  const availableLetters = useMemo(() => {
    if (!songsByLetter) return [];
    return Object.keys(songsByLetter).sort((a, b) => {
      if (a === "#") return -1;
      if (b === "#") return 1;
      return a.localeCompare(b);
    });
  }, [songsByLetter]);

  const totalSongsDuration = useMemo(() => {
    return processedSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  }, [processedSongs]);

  const handlePlayAllSongs = () => {
    if (processedSongs.length > 0) {
      playSong(processedSongs[0], processedSongs, 0);
    }
  };

  const handleShuffleSongs = () => {
    if (processedSongs.length > 0) {
      const shuffled = [...processedSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`music-letter-section-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredArtists = artistFilter.trim()
    ? artists.filter((a) => a.name.toLowerCase().includes(artistFilter.toLowerCase()))
    : artists;

  const tabs: { id: MusicTab; label: string; icon: React.ElementType }[] = [
    { id: "songs", label: "Brani", icon: Music2 },
    { id: "albums", label: "Album", icon: Disc3 },
    { id: "artists", label: "Artisti", icon: Users },
    { id: "playlists", label: "Playlist", icon: ListMusic },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Header & Segmented Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Musica
              </h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <WifiOff size={11} /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOffline
                ? "Visualizzazione contenuti scaricati sul dispositivo"
                : "Esplora la tua libreria di brani, album, artisti e playlist"}
            </p>
          </div>

          {/* Quick links to Starred & Offline */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/starred"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-all"
            >
              <Heart size={14} className="fill-current" /> Preferiti
            </Link>
            <Link
              href="/downloads"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-all"
            >
              <Download size={14} /> Offline & Download
            </Link>
          </div>
        </div>

        {/* Tab Switcher - Horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/80 rounded-2xl border border-border overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BRANI (SONGS) */}
      {activeTab === "songs" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Controls & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 md:p-4 rounded-2xl border border-border shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePlayAllSongs}
                disabled={processedSongs.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Play size={14} className="fill-current" /> Riproduci Tutto
              </button>
              <button
                onClick={handleShuffleSongs}
                disabled={processedSongs.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold transition-colors cursor-pointer"
              >
                <Shuffle size={13} /> Casuale
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground ml-2 pl-3 border-l border-border">
                <span>{processedSongs.length} brani</span>
                <span>•</span>
                <span>{formatDuration(totalSongsDuration)}</span>
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
                  value={songFilter}
                  onChange={(e) => setSongFilter(e.target.value)}
                  placeholder="Filtra brani o artisti..."
                  className="w-full pl-8 pr-7 py-1.5 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                {songFilter && (
                  <button
                    onClick={() => setSongFilter("")}
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

          {/* Songs List Content */}
          {loadingSongs ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : processedSongs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Music2 size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground">
                {songFilter ? `Nessun brano trovato con "${songFilter}"` : "Nessun brano trovato"}
              </p>
            </div>
          ) : songsByLetter ? (
            <div className="space-y-6">
              {availableLetters.map((letter) => {
                const letterSongs = songsByLetter[letter];
                return (
                  <div
                    key={letter}
                    id={`music-letter-section-${letter}`}
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
      )}

      {/* TAB 2: ALBUM */}
      {activeTab === "albums" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl border border-border shrink-0">
              <Filter size={13} className="text-muted-foreground ml-1.5 mr-0.5" />
              {(
                [
                  { key: "recent", label: "Recenti" },
                  { key: "newest", label: "Anno" },
                  { key: "frequent", label: "Ascoltati" },
                  { key: "alphabeticalByName", label: "A-Z" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAlbumSort(f.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    albumSort === f.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground shrink-0">{albums.length} album</span>
          </div>

          {/* Album Grid */}
          {loadingAlbums ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Disc3 size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground">Nessun album trovato</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ARTISTI */}
      {activeTab === "artists" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Search Filter */}
          <div className="relative max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              placeholder="Cerca artista..."
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Artists Grid */}
          {loadingArtists ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 bg-secondary/50 rounded-2xl animate-pulse">
                  <div className="w-24 h-24 rounded-full bg-muted" />
                  <div className="w-20 h-3 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredArtists.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground">Nessun artista trovato</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLAYLIST */}
      {activeTab === "playlists" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loadingPlaylists ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ListMusic size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground">Nessuna playlist presente sul server</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {playlists.map((pl) => (
                <PlaylistCard key={pl.id} playlist={pl} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MusicPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32 text-muted-foreground gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm">Caricamento Musica...</p>
        </div>
      }
    >
      <MusicPageContent />
    </Suspense>
  );
}
