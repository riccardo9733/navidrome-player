"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Music2,
  Disc3,
  Users,
  Play,
  ArrowRight,
  Settings,
} from "lucide-react";
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
              isOpen ? "text-primary" : "text-muted-foreground"
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
            className="w-full bg-card hover:bg-secondary/60 focus:bg-card text-sm text-foreground placeholder:text-muted-foreground rounded-full pl-10 pr-10 py-2 border border-border focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all shadow-xs"
          />
          {isLoading ? (
            <Loader2
              size={16}
              className="absolute right-3.5 animate-spin text-primary"
            />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Cancella"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </form>

      {/* Live Search Dropdown Popup */}
      {isOpen && searchQuery.trim().length > 0 && pathname !== "/search" && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover/95 text-popover-foreground backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden z-50 max-h-[75vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-border">
          {isLoading && !hasAnyResults ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm">Ricerca in corso...</p>
            </div>
          ) : !hasAnyResults && !isLoading ? (
            <div className="p-8 text-center text-muted-foreground space-y-1">
              <p className="text-sm font-medium text-foreground">
                Nessun risultato per &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-muted-foreground">
                Prova a verificare l&apos;ortografia o usa termini più generali.
              </p>
            </div>
          ) : (
            <>
              {/* Songs section */}
              {hasSongs && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Music2 size={13} className="text-primary" /> Brani
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
                          className="group flex items-center justify-between p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Music2 size={18} className="text-muted-foreground" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play size={14} className="text-white fill-current ml-0.5" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isCurrent
                                    ? "text-primary font-semibold"
                                    : "text-foreground"
                                }`}
                              >
                                {song.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {song.artist || "Artista sconosciuto"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono pl-3 shrink-0">
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
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Disc3 size={13} className="text-primary" /> Album
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
                          className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={album.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Disc3 size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {album.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
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
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Users size={13} className="text-primary" /> Artisti
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
                          className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Users size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {artist.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
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
                className="w-full p-3 bg-muted/60 hover:bg-primary/15 text-primary text-xs font-medium flex items-center justify-center gap-2 transition-colors border-t border-border cursor-pointer"
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
        <Search size={17} className="absolute left-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          disabled
          placeholder="Cerca brani, artisti o album..."
          className="w-full bg-card text-sm text-foreground placeholder:text-muted-foreground rounded-full pl-10 pr-10 py-2 border border-border focus:outline-none opacity-80 cursor-not-allowed"
        />
      </div>
    </div>
  );
}

export function Header() {
  const router = useRouter();

  return (
    <header className="flex pt-[env(safe-area-inset-top,0px)] h-[calc(3.5rem+env(safe-area-inset-top,0px))] md:h-16 md:pt-0 border-b border-border bg-background/80 backdrop-blur-xl px-3 md:px-6 items-center justify-between z-40 shrink-0 select-none relative gap-2 transition-colors duration-200">
      {/* Left: Mobile Brand / Desktop Navigation Arrows */}
      <div className="flex items-center gap-2">
        {/* Mobile Brand Logo */}
        <Link href="/" className="md:hidden flex items-center gap-2 pr-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary via-primary/80 to-accent flex items-center justify-center shadow-md shadow-primary/25">
            <Disc3 size={18} className="text-primary-foreground animate-[spin_10s_linear_infinite]" />
          </div>
          <span className="font-extrabold text-sm text-foreground tracking-tight">Navidrome</span>
        </Link>

        {/* Desktop History Arrows */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-xs"
            title="Indietro"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => router.forward()}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-xs"
            title="Avanti"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Center: Live Search Bar (Desktop only, mobile has Search tab) */}
      <div className="hidden md:flex flex-1 max-w-lg mx-4">
        <Suspense fallback={<LiveSearchBarFallback />}>
          <LiveSearchBarInner />
        </Suspense>
      </div>

      {/* Right: Settings */}
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border text-foreground/80 hover:text-foreground flex items-center justify-center transition-all shadow-xs active:scale-95 group"
          title="Impostazioni"
        >
          <Settings
            size={18}
            className="text-muted-foreground group-hover:text-primary group-hover:rotate-45 transition-all"
          />
        </Link>
      </div>
    </header>
  );
}
