"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Disc3, Users, Music2 } from "lucide-react";
import { Song, Album, Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { TrackRow } from "../../components/shared/TrackRow";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";
import { searchOffline, isBrowserOffline } from "../../lib/db/offlineProvider";
import { WifiOff } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Sync state when URL parameter changes (e.g., navigated from Header or History)
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSongs([]);
      setAlbums([]);
      setArtists([]);
      // Clean up URL if empty
      if (window.location.search) {
        window.history.replaceState(null, "", "/search");
      }
      return;
    }

    // Update URL parameter without triggering full navigation reload
    const newUrl = `/search?q=${encodeURIComponent(trimmed)}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      if (isBrowserOffline()) {
        setIsOffline(true);
        const offRes = await searchOffline(trimmed);
        setSongs(offRes.songs);
        setAlbums(offRes.albums);
        setArtists(offRes.artists);
        setLoading(false);
        return;
      }

      subsonicClient
        .search(trimmed)
        .then((res) => {
          setSongs(res?.song || []);
          setAlbums(res?.album || []);
          setArtists(res?.artist || []);
          setIsOffline(false);
        })
        .catch(async (err) => {
          console.warn("Online search failed, fallback to offline:", err);
          setIsOffline(true);
          const offRes = await searchOffline(trimmed);
          setSongs(offRes.songs);
          setAlbums(offRes.albums);
          setArtists(offRes.artists);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    window.history.replaceState(null, "", "/search");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Search Bar Input */}
      <div className="relative flex items-center max-w-xl mx-auto">
        <Search size={20} className="absolute left-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca brani, artisti o album in tempo reale..."
          autoFocus
          className="w-full bg-card text-base text-foreground placeholder:text-muted-foreground rounded-2xl pl-12 pr-12 py-3.5 border border-border focus:border-primary focus:outline-none shadow-sm transition-all"
        />
        {loading ? (
          <Loader2 size={20} className="absolute right-4 animate-spin text-primary" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Cancella ricerca"
          >
            <span className="sr-only">Cancella</span>
            ✕
          </button>
        ) : null}
      </div>

      {/* Offline search alert banner */}
      {isOffline && query.trim() && (
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-medium max-w-xl mx-auto">
          <WifiOff size={14} />
          <span>Ricerca offline tra i brani, album e artisti scaricati in locale</span>
        </div>
      )}

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-24 text-muted-foreground space-y-2">
          <p className="text-base font-semibold text-foreground">Inizia a digitare per cercare</p>
          <p className="text-xs">Ricerca istantanea su tutti i brani, artisti e album del tuo server Navidrome.</p>
        </div>
      ) : songs.length === 0 && albums.length === 0 && artists.length === 0 && !loading ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-base font-semibold text-foreground">Nessun risultato trovato per &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Songs Results */}
          {songs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Music2 size={18} className="text-primary" /> Brani ({songs.length})
              </h2>
              <div className="space-y-1 bg-card p-2 rounded-2xl border border-border shadow-xs">
                {songs.map((song, idx) => (
                  <TrackRow
                    key={song.id}
                    song={song}
                    index={idx}
                    queueContext={songs}
                    showCover
                    showAlbum
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums Results */}
          {albums.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Disc3 size={18} className="text-primary" /> Album ({albums.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

          {/* Artists Results */}
          {artists.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users size={18} className="text-primary" /> Artisti ({artists.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
