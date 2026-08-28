"use client";

import { useEffect, useState } from "react";
import { Compass, Music2, Disc } from "lucide-react";
import { Genre, Album } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { AlbumCard } from "../../components/shared/AlbumCard";

const GENRE_GRADIENTS = [
  "from-pink-600 to-rose-900",
  "from-purple-600 to-indigo-900",
  "from-blue-600 to-cyan-900",
  "from-emerald-600 to-teal-900",
  "from-amber-600 to-orange-900",
  "from-fuchsia-600 to-purple-950",
  "from-violet-600 to-indigo-950",
];

export default function ExplorePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [randomAlbums, setRandomAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      subsonicClient.getGenres(),
      subsonicClient.getAlbumList("random", 10),
    ])
      .then(([gList, aList]) => {
        setGenres(gList);
        setRandomAlbums(aList);
      })
      .catch((err) => console.error("Error loading explore:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Compass size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Esplora</h1>
          <p className="text-xs text-muted-foreground">Naviga per genere musicale e scopri album casuali</p>
        </div>
      </div>

      {/* Genres Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Music2 size={20} className="text-primary" /> Generi Musicali
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {genres.map((genre, idx) => {
            const gradient = GENRE_GRADIENTS[idx % GENRE_GRADIENTS.length];
            return (
              <div
                key={genre.value}
                className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300 min-h-[100px] flex flex-col justify-between`}
              >
                <h3 className="text-base font-extrabold text-white">{genre.value}</h3>
                <span className="text-[11px] font-medium text-white/80">
                  {genre.songCount} brani • {genre.albumCount} album
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Random Mix Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Disc size={20} className="text-primary" /> Scoperta Casuale (Random Discovery)
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {randomAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
