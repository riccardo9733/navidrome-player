"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Disc3, Users, Music2 } from "lucide-react";
import { Song, Album, Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { TrackRow } from "../../components/shared/TrackRow";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setAlbums([]);
      setArtists([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      subsonicClient
        .search(query.trim())
        .then((res) => {
          setSongs(res?.song || []);
          setAlbums(res?.album || []);
          setArtists(res?.artist || []);
        })
        .catch((err) => console.error("Search error:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Search Bar Input */}
      <div className="relative flex items-center max-w-xl mx-auto">
        <Search size={20} className="absolute left-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca brani, artisti o album..."
          autoFocus
          className="w-full bg-zinc-900/90 text-base text-white placeholder-zinc-500 rounded-2xl pl-12 pr-4 py-3.5 border border-zinc-800 focus:border-indigo-500 focus:outline-none shadow-xl transition-all"
        />
        {loading && <Loader2 size={20} className="absolute right-4 animate-spin text-indigo-400" />}
      </div>

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-24 text-zinc-500 space-y-2">
          <p className="text-base font-semibold text-zinc-400">Inizia a digitare per cercare</p>
          <p className="text-xs">Ricerca istantanea su tutti i brani, artisti e album del tuo server Navidrome.</p>
        </div>
      ) : songs.length === 0 && albums.length === 0 && artists.length === 0 && !loading ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-base font-semibold">Nessun risultato trovato per &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Songs Results */}
          {songs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Music2 size={18} className="text-indigo-400" /> Brani ({songs.length})
              </h2>
              <div className="space-y-1 bg-zinc-950/40 p-2 rounded-2xl border border-zinc-800/50">
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
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Disc3 size={18} className="text-indigo-400" /> Album ({albums.length})
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
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-indigo-400" /> Artisti ({artists.length})
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
        <div className="flex items-center justify-center py-24 text-zinc-400">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
