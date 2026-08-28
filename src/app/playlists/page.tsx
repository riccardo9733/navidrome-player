"use client";

import { useEffect, useState } from "react";
import { Playlist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { PlaylistCard } from "../../components/shared/PlaylistCard";
import { ListMusic } from "lucide-react";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    subsonicClient
      .getPlaylists()
      .then(setPlaylists)
      .catch((err) => console.error("Error fetching playlists:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ListMusic size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Playlist</h1>
            <p className="text-xs text-zinc-400">Le tue playlist personali sincronizzate con Navidrome</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg font-medium">Nessuna playlist presente sul server</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      )}
    </div>
  );
}
