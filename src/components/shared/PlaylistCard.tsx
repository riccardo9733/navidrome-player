"use client";

import Link from "next/link";
import { ListMusic, Play } from "lucide-react";
import { Playlist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { usePlayerStore } from "../../store/usePlayerStore";

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const playSong = usePlayerStore((s) => s.playSong);

  const coverUrl = playlist.coverArt
    ? subsonicClient.getCoverArtUrl(playlist.coverArt, 300)
    : null;

  const handlePlayPlaylist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const fullPlaylist = await subsonicClient.getPlaylist(playlist.id);
      if (fullPlaylist.entry && fullPlaylist.entry.length > 0) {
        playSong(fullPlaylist.entry[0], fullPlaylist.entry, 0);
      }
    } catch (err) {
      console.error("Failed to load playlist tracks:", err);
    }
  };

  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="group relative flex flex-col p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-300 shadow-lg hover:shadow-2xl"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800 shadow-md flex items-center justify-center">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 to-zinc-900 text-indigo-400">
            <ListMusic size={44} />
          </div>
        )}

        {/* Floating Play Button */}
        <button
          onClick={handlePlayPlaylist}
          className="absolute right-3 bottom-3 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
        >
          <Play size={20} className="ml-1 fill-current" />
        </button>
      </div>

      <div className="mt-3 flex flex-col">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
          {playlist.name}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {playlist.comment || `${playlist.songCount || 0} brani`}
        </p>
      </div>
    </Link>
  );
}
