"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Disc3,
  Users,
  ListMusic,
  Heart,
  Download,
  Filter,
  Search,
  Music2,
  Sparkles,
  Loader2,
  WifiOff,
} from "lucide-react";
import { Genre, Album, Artist, Playlist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";
import { PlaylistCard } from "../../components/shared/PlaylistCard";
import {
  getOfflineAlbums,
  getOfflineArtists,
  getOfflinePlaylists,
  getOfflineTracks,
  isBrowserOffline,
} from "../../lib/db/offlineProvider";

const GENRE_GRADIENTS = [
  "from-pink-600 to-rose-900",
  "from-purple-600 to-indigo-900",
  "from-blue-600 to-cyan-900",
  "from-emerald-600 to-teal-900",
  "from-amber-600 to-orange-900",
  "from-fuchsia-600 to-purple-950",
  "from-violet-600 to-indigo-950",
  "from-rose-500 to-orange-700",
  "from-teal-600 to-slate-900",
];

type MusicTab = "explore" | "albums" | "artists" | "playlists";

function MusicPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as MusicTab) || "explore";
  const [activeTab, setActiveTab] = useState<MusicTab>(initialTab);
  const [, startTransition] = useTransition();
  const [isOffline, setIsOffline] = useState(false);

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab") as MusicTab;
    if (tabFromUrl && ["explore", "albums", "artists", "playlists"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: MusicTab) => {
    setActiveTab(tab);
    startTransition(() => {
      router.replace(`/music?tab=${tab}`, { scroll: false });
    });
  };

  // State for Explore Tab
  const [genres, setGenres] = useState<Genre[]>([]);
  const [randomAlbums, setRandomAlbums] = useState<Album[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);

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
      if (activeTab === "explore") {
        setLoadingExplore(true);
        Promise.all([getOfflineTracks(), getOfflineAlbums()]).then(([tracks, offAlbums]) => {
          const gMap = new Map<string, number>();
          tracks.forEach((t) => {
            if (t.genre) {
              gMap.set(t.genre, (gMap.get(t.genre) || 0) + 1);
            }
          });
          const offGenres: Genre[] = Array.from(gMap.entries()).map(([value, songCount]) => ({
            value,
            songCount,
            albumCount: 1,
          }));
          setGenres(offGenres);
          setRandomAlbums(offAlbums);
          setLoadingExplore(false);
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

    if (activeTab === "explore" && genres.length === 0) {
      setLoadingExplore(true);
      Promise.all([
        subsonicClient.getGenres(),
        subsonicClient.getAlbumList("random", 12),
      ])
        .then(([gList, aList]) => {
          setGenres(gList);
          setRandomAlbums(aList);
          setIsOffline(false);
        })
        .catch(async (err) => {
          console.warn("Online explore failed, fallback to offline:", err);
          setIsOffline(true);
          const [tracks, offAlbums] = await Promise.all([getOfflineTracks(), getOfflineAlbums()]);
          const gMap = new Map<string, number>();
          tracks.forEach((t) => {
            if (t.genre) gMap.set(t.genre, (gMap.get(t.genre) || 0) + 1);
          });
          setGenres(Array.from(gMap.entries()).map(([value, songCount]) => ({ value, songCount, albumCount: 1 })));
          setRandomAlbums(offAlbums);
        })
        .finally(() => setLoadingExplore(false));
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
  }, [activeTab, albumSort, genres.length, artists.length, playlists.length]);

  const filteredArtists = artistFilter.trim()
    ? artists.filter((a) => a.name.toLowerCase().includes(artistFilter.toLowerCase()))
    : artists;

  const tabs: { id: MusicTab; label: string; icon: React.ElementType }[] = [
    { id: "explore", label: "Esplora", icon: Compass },
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
                : "Esplora la tua libreria, generi, album e collezioni personali"}
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
              <Download size={14} /> Offline
            </Link>
          </div>
        </div>

        {/* Mobile Quick Pills for Starred & Downloads */}
        <div className="flex sm:hidden items-center gap-2 overflow-x-auto pb-1">
          <Link
            href="/starred"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium shrink-0 active:scale-95 transition-transform"
          >
            <Heart size={13} className="fill-current" /> Brani Preferiti
          </Link>
          <Link
            href="/downloads"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium shrink-0 active:scale-95 transition-transform"
          >
            <Download size={13} /> Musica Offline
          </Link>
        </div>

        {/* Segmented Control Bar */}
        <div className="flex p-1 bg-secondary/80 backdrop-blur-md rounded-2xl border border-border max-w-full overflow-x-auto select-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[75px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon size={16} className={isCurrent ? "text-primary-foreground" : "text-muted-foreground"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ESPLORA */}
      {activeTab === "explore" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loadingExplore ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm">Caricamento generi e suggerimenti...</p>
            </div>
          ) : (
            <>
              {/* Genres Section */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Music2 size={18} className="text-primary" /> Generi Musicali
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {genres.map((genre, idx) => {
                    const gradient = GENRE_GRADIENTS[idx % GENRE_GRADIENTS.length];
                    return (
                      <Link
                        key={genre.value}
                        href={`/search?q=${encodeURIComponent(genre.value)}`}
                        className={`relative h-20 sm:h-24 rounded-2xl bg-gradient-to-br ${gradient} p-3.5 flex flex-col justify-between overflow-hidden shadow-md hover:scale-[1.02] active:scale-95 transition-all group border border-white/10`}
                      >
                        <span className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow-md truncate">
                          {genre.value}
                        </span>
                        <span className="text-[11px] text-white/80 font-medium self-end">
                          {genre.songCount} brani
                        </span>
                        <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-white/10 rounded-full blur-sm group-hover:scale-150 transition-transform pointer-events-none" />
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Random Picks */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-500" /> Scoperte Casuali
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {randomAlbums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </section>
            </>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    albumSort === f.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {albums.length} dischi caricati
            </span>
          </div>

          {/* Albums Grid */}
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
          {/* Search artists input */}
          <div className="relative max-w-sm w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              placeholder="Filtra per nome artista..."
              className="w-full bg-card text-xs sm:text-sm text-foreground placeholder:text-muted-foreground rounded-xl pl-9 pr-4 py-2 border border-border focus:border-primary focus:outline-none transition-colors"
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
