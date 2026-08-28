"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";

interface ArtistCardProps {
  artist: Artist;
}

const AVATAR_GRADIENTS = [
  "from-indigo-600 to-purple-800",
  "from-pink-600 to-rose-800",
  "from-blue-600 to-cyan-800",
  "from-emerald-600 to-teal-800",
  "from-amber-600 to-orange-800",
  "from-violet-600 to-indigo-900",
];

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradientIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_GRADIENTS.length;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = artist.artistImageUrl || (artist.coverArt ? subsonicClient.getCoverArtUrl(artist.coverArt, 300) : null);
  const initials = getInitials(artist.name);
  const gradient = AVATAR_GRADIENTS[getGradientIndex(artist.name || artist.id)];

  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group flex flex-col items-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 text-center shadow-xs hover:shadow-md cursor-pointer"
    >
      <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-secondary shadow-xl border-2 border-transparent group-hover:border-primary/50 transition-all duration-300 shrink-0">
        {imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={artist.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-inner select-none`}
          >
            {initials ? (
              <span className="text-2xl md:text-3xl font-extrabold tracking-wider drop-shadow-md">
                {initials}
              </span>
            ) : (
              <User size={40} className="text-white/80" />
            )}
          </div>
        )}
      </div>

      <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-full">
        {artist.name}
      </h3>
      <span className="text-xs text-muted-foreground mt-0.5">
        {artist.albumCount ? `${artist.albumCount} album` : "Artista"}
      </span>
    </Link>
  );
}
