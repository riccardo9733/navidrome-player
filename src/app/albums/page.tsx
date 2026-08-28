"use client";

import { useEffect, useState } from "react";
import { Album } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { Disc3, Filter, WifiOff } from "lucide-react";
import { getOfflineAlbums, isBrowserOffline } from "../../lib/db/offlineProvider";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<"recent" | "frequent" | "newest" | "alphabeticalByName">("recent");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      setIsOffline(true);
      getOfflineAlbums()
        .then(setAlbums)
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getAlbumList(sortType, 40)
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
      .finally(() => setLoading(false));
  }, [sortType]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header with Sort Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Disc3 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Album</h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <WifiOff size={11} /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOffline
                ? "Visualizzazione album con tracce scaricate offline"
                : "Esplora la collezione completa dei tuoi dischi"}
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl border border-border self-start sm:self-auto">
          <Filter size={14} className="text-muted-foreground ml-2" />
          <button
            onClick={() => setSortType("recent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sortType === "recent" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Recenti
          </button>
          <button
            onClick={() => setSortType("newest")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sortType === "newest" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anno
          </button>
          <button
            onClick={() => setSortType("frequent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sortType === "frequent" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Più Ascoltati
          </button>
          <button
            onClick={() => setSortType("alphabeticalByName")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sortType === "alphabeticalByName" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
            <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium text-foreground">Nessun album trovato</p>
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
