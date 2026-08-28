"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Server,
  ShieldCheck,
  WifiOff,
  X,
  Loader2,
  Music2,
  Disc3,
  Users,
  Play,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { subsonicClient } from "../../lib/subsonic/client";
import { Song, Album, Artist } from "../../lib/subsonic/types";
import { formatDuration } from "../../lib/utils/formatters";

function LiveSearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    song?: Song[];
    album?: Album[];
    artist?: Artist[];
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);

  // Sync searchQuery when navigating to /search
  useEffect(() => {
    if (pathname === "/search") {
      const q = searchParams?.get("q") || "";
      setSearchQuery(q);
    }
  }, [pathname, searchParams]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search effect (debounced)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      subsonicClient
        .search(trimmed)
        .then((res) => {
          setResults(res || {});
        })
        .catch((err) => {
          console.error("Live search error:", err);
          setResults({});
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
    if (pathname === "/search") {
      router.push("/search");
    }
  };

  const handleSelectSong = (song: Song, songList: Song[], idx: number) => {
    playSong(song, songList, idx);
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const hasSongs = (results?.song?.length || 0) > 0;
  const hasAlbums = (results?.album?.length || 0) > 0;
  const hasArtists = (results?.artist?.length || 0) > 0;
  const hasAnyResults = hasSongs || hasAlbums || hasArtists;

  return (
    <div ref={containerRef} className="flex-1 max-w-lg mx-3 md:mx-6 relative">
      <form onSubmit={handleSearchSubmit}>
        <div className="relative flex items-center">
          <Search
            size={17}
            className={`absolute left-3.5 pointer-events-none transition-colors ${
              isOpen ? "text-indigo-400" : "text-zinc-400"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) {
                setIsOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder="Cerca brani, artisti o album in tempo reale..."
            className="w-full bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-sm text-white placeholder-zinc-500 rounded-full pl-10 pr-10 py-2 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner"
          />
          {isLoading ? (
            <Loader2
              size={16}
              className="absolute right-3.5 animate-spin text-indigo-400"
            />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Cancella"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </form>

      {/* Live Search Dropdown Popup */}
      {isOpen && searchQuery.trim().length > 0 && pathname !== "/search" && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-[75vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-zinc-800/60">
          {isLoading && !hasAnyResults ? (
            <div className="p-8 text-center text-zinc-400 flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <p className="text-sm">Ricerca in corso...</p>
            </div>
          ) : !hasAnyResults && !isLoading ? (
            <div className="p-8 text-center text-zinc-500 space-y-1">
              <p className="text-sm font-medium text-zinc-400">
                Nessun risultato per &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-zinc-500">
                Prova a verificare l&apos;ortografia o usa termini più generali.
              </p>
            </div>
          ) : (
            <>
              {/* Songs section */}
              {hasSongs && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <Music2 size={13} className="text-indigo-400" /> Brani
                  </div>
                  <div className="space-y-1 mt-1">
                    {results!.song!.slice(0, 4).map((song, idx) => {
                      const isCurrent = currentSong?.id === song.id;
                      const coverUrl = song.coverArt
                        ? subsonicClient.getCoverArtUrl(song.coverArt, 80)
                        : null;

                      return (
                        <div
                          key={song.id}
                          onClick={() =>
                            handleSelectSong(song, results!.song!, idx)
                          }
                          className="group flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Music2 size={18} className="text-zinc-600" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play size={14} className="text-white fill-current ml-0.5" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isCurrent
                                    ? "text-indigo-400 font-semibold"
                                    : "text-zinc-200 group-hover:text-white"
                                }`}
                              >
                                {song.title}
                              </p>
                              <p className="text-xs text-zinc-400 truncate">
                                {song.artist || "Artista sconosciuto"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-500 font-mono pl-3 shrink-0">
                            {formatDuration(song.duration || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Albums section */}
              {hasAlbums && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <Disc3 size={13} className="text-indigo-400" /> Album
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {results!.album!.slice(0, 4).map((album) => {
                      const coverUrl = album.coverArt
                        ? subsonicClient.getCoverArtUrl(album.coverArt, 100)
                        : null;

                      return (
                        <div
                          key={album.id}
                          onClick={() => handleNavigate(`/albums/${album.id}`)}
                          className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={album.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Disc3 size={18} className="text-zinc-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                              {album.name}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {album.artist} {album.year ? `• ${album.year}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Artists section */}
              {hasArtists && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <Users size={13} className="text-indigo-400" /> Artisti
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {results!.artist!.slice(0, 4).map((artist) => {
                      const avatarUrl =
                        artist.artistImageUrl ||
                        (artist.coverArt
                          ? subsonicClient.getCoverArtUrl(artist.coverArt, 100)
                          : null);

                      return (
                        <div
                          key={artist.id}
                          onClick={() => handleNavigate(`/artists/${artist.id}`)}
                          className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Users size={18} className="text-zinc-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                              {artist.name}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              Artista
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer action */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(
                    `/search?q=${encodeURIComponent(searchQuery.trim())}`
                  );
                }}
                className="w-full p-3 bg-zinc-950/60 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors border-t border-zinc-800/80"
              >
                Visualizza tutti i risultati per &quot;{searchQuery}&quot;
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LiveSearchBarFallback() {
  return (
    <div className="flex-1 max-w-lg mx-3 md:mx-6 relative">
      <div className="relative flex items-center">
        <Search size={17} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          disabled
          placeholder="Cerca brani, artisti o album..."
          className="w-full bg-zinc-900/90 text-sm text-white placeholder-zinc-500 rounded-full pl-10 pr-10 py-2 border border-zinc-800 focus:outline-none opacity-80 cursor-not-allowed"
        />
      </div>
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const isConnected = useAuthStore((s) => s.isConnected);
  const isOfflineMode = useAuthStore((s) => s.isOfflineMode);
  const profiles = useAuthStore((s) => s.profiles);
  const activeProfileId = useAuthStore((s) => s.activeProfileId);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <header className="hidden md:flex h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl px-4 md:px-6 items-center justify-between z-40 shrink-0 select-none relative">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
          title="Indietro"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
          title="Avanti"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Live Search Bar wrapped in Suspense */}
      <Suspense fallback={<LiveSearchBarFallback />}>
        <LiveSearchBarInner />
      </Suspense>

      {/* Server Status Pill */}
      <div className="flex items-center gap-3">
        {isOfflineMode ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <WifiOff size={14} /> Offline Mode
          </div>
        ) : isConnected && activeProfile ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck size={14} /> {activeProfile.name || "Navidrome"}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Server size={14} /> Demo Mode
          </div>
        )}
      </div>
    </header>
  );
}
