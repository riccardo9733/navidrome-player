"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Album } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { usePlayerStore } from "../../store/usePlayerStore";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const playSong = usePlayerStore((s) => s.playSong);

  const coverUrl = album.coverArt
    ? subsonicClient.getCoverArtUrl(album.coverArt, 400)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80";

  const handlePlayAlbum = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const fullAlbum = await subsonicClient.getAlbum(album.id);
      if (fullAlbum.song && fullAlbum.song.length > 0) {
        playSong(fullAlbum.song[0], fullAlbum.song, 0);
      }
    } catch (err) {
      console.error("Failed to load album tracks:", err);
    }
  };

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative flex flex-col p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-300 shadow-lg hover:shadow-2xl"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800 shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={album.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Floating Play Button */}
        <button
          onClick={handlePlayAlbum}
          className="absolute right-3 bottom-3 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
        >
          <Play size={20} className="ml-1 fill-current" />
        </button>
      </div>

      {/* Album Info */}
      <div className="mt-3 flex flex-col">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
          {album.name || album.title}
        </h3>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {album.artist || "Artista Sconosciuto"}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
          {album.year && <span>{album.year}</span>}
          {album.year && album.songCount && <span>•</span>}
          {album.songCount && <span>{album.songCount} brani</span>}
        </div>
      </div>
    </Link>
  );
}
