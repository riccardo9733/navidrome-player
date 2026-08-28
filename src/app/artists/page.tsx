"use client";

import { useEffect, useState } from "react";
import { Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { ArtistCard } from "../../components/shared/ArtistCard";
import { Users, Search } from "lucide-react";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    subsonicClient
      .getArtists()
      .then((list) => {
        setArtists(list);
        setFilteredArtists(list);
      })
      .catch((err) => console.error("Error fetching artists:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredArtists(artists);
    } else {
      const q = search.toLowerCase();
      setFilteredArtists(artists.filter((a) => a.name.toLowerCase().includes(q)));
    }
  }, [search, artists]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Artisti</h1>
            <p className="text-xs text-zinc-400">Esplora tutti gli artisti presenti nella tua libreria</p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative flex items-center max-w-xs w-full">
          <Search size={16} className="absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtra artisti..."
            className="w-full bg-zinc-900 text-sm text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2 border border-zinc-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Artists Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg font-medium">Nessun artista trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}
