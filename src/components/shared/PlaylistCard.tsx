"use client";

import Link from "next/link";
import { ListMusic, Play, Loader2 } from "lucide-react";
import { Playlist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useDownloadStore } from "../../store/useDownloadStore";

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const playSong = usePlayerStore((s) => s.playSong);
  const downloadState = useDownloadStore((s) => s.downloadingItems[playlist.id]);
  const isDownloading = downloadState?.status === "downloading";
  const progress = downloadState?.progress || 0;

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
      className="group relative flex flex-col p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-secondary shadow-sm flex items-center justify-center">
        {isDownloading && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md border border-primary/40 flex items-center gap-1 text-[10px] text-primary font-bold z-10 shadow-lg">
            <Loader2 size={11} className="animate-spin" /> {progress}%
          </div>
        )}
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary text-primary">
            <ListMusic size={44} />
          </div>
        )}

        {/* Floating Play Button */}
        <button
          onClick={handlePlayPlaylist}
          className="absolute right-3 bottom-3 w-12 h-12 rounded-full bg-primary hover:opacity-95 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Play size={20} className="ml-1 fill-current" />
        </button>
      </div>

      <div className="mt-3 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {playlist.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {playlist.comment || `${playlist.songCount || 0} brani`}
        </p>
      </div>
    </Link>
  );
}
