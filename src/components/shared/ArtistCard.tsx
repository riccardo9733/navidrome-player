"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const imageUrl = artist.artistImageUrl || (artist.coverArt ? subsonicClient.getCoverArtUrl(artist.coverArt, 300) : null);

  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group flex flex-col items-center p-4 rounded-2xl bg-zinc-900/30 hover:bg-zinc-800/50 border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-300 text-center"
    >
      <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-zinc-800 shadow-xl border-2 border-transparent group-hover:border-indigo-500/50 transition-all duration-300">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800">
            <User size={48} />
          </div>
        )}
      </div>

      <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors truncate max-w-full">
        {artist.name}
      </h3>
      <span className="text-xs text-zinc-500 mt-0.5">Artista</span>
    </Link>
  );
}
