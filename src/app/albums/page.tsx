"use client";

import { useEffect, useState } from "react";
import { Album } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { Disc3, Filter } from "lucide-react";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<"recent" | "frequent" | "newest" | "alphabeticalByName">("recent");

  useEffect(() => {
    setLoading(true);
    subsonicClient
      .getAlbumList(sortType, 40)
      .then(setAlbums)
      .catch((err) => console.error("Error fetching albums:", err))
      .finally(() => setLoading(false));
  }, [sortType]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header with Sort Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Disc3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Album</h1>
            <p className="text-xs text-zinc-400">Esplora la collezione completa dei tuoi dischi</p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <Filter size={14} className="text-zinc-400 ml-2" />
          <button
            onClick={() => setSortType("recent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortType === "recent" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Recenti
          </button>
          <button
            onClick={() => setSortType("newest")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortType === "newest" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Anno
          </button>
          <button
            onClick={() => setSortType("frequent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortType === "frequent" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Più Ascoltati
          </button>
          <button
            onClick={() => setSortType("alphabeticalByName")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortType === "alphabeticalByName" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Album Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg font-medium">Nessun album trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
