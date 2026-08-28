"use client";

import { useEffect, useState } from "react";
import { Playlist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { PlaylistCard } from "../../components/shared/PlaylistCard";
import { ListMusic, WifiOff } from "lucide-react";
import { getOfflinePlaylists, isBrowserOffline } from "../../lib/db/offlineProvider";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      setIsOffline(true);
      getOfflinePlaylists()
        .then(setPlaylists)
        .finally(() => setLoading(false));
      return;
    }

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">Playlist</h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <WifiOff size={11} /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {isOffline
                ? "Visualizzazione playlist salvate offline sul dispositivo"
                : "Le tue playlist personali sincronizzate con Navidrome"}
            </p>
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
