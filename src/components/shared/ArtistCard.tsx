"use client";

import Link from "next/link";
import { Artist } from "../../lib/subsonic/types";

interface ArtistCardProps {
  artist: Artist;
}

function ArtistSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
    >
      {/* Ambient sound wave accents */}
      <path
        d="M 20 50 C 16 56 16 64 20 70"
        strokeWidth="1"
        strokeLinecap="round"
        className="opacity-40 group-hover:opacity-70 transition-opacity duration-300"
      />
      <path
        d="M 13 44 C 7 53 7 67 13 76"
        strokeWidth="0.8"
        strokeLinecap="round"
        className="opacity-25 group-hover:opacity-50 transition-opacity duration-300"
      />
      <path
        d="M 100 50 C 104 56 104 64 100 70"
        strokeWidth="1"
        strokeLinecap="round"
        className="opacity-40 group-hover:opacity-70 transition-opacity duration-300"
      />
      <path
        d="M 107 44 C 113 53 113 67 107 76"
        strokeWidth="0.8"
        strokeLinecap="round"
        className="opacity-25 group-hover:opacity-50 transition-opacity duration-300"
      />

      {/* Headphone Arch */}
      <path
        d="M 37 50 C 35 24 85 24 83 50"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Studio Headphone Ear-Pads */}
      <rect
        x="32"
        y="47"
        width="8"
        height="20"
        rx="4"
        strokeWidth="1.1"
        className="fill-primary/10 transition-colors"
      />
      <rect
        x="80"
        y="47"
        width="8"
        height="20"
        rx="4"
        strokeWidth="1.1"
        className="fill-primary/10 transition-colors"
      />

      {/* Minimalist Head Contour */}
      <path
        d="M 46 42 C 46 33 52 27 60 27 C 68 27 74 33 74 42 C 74 52 69 64 60 66 C 51 64 46 52 46 42 Z"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hair / Forehead minimalist accent curve */}
      <path
        d="M 49 37 C 55 33 65 33 71 37"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="opacity-50"
      />

      {/* Flowing Neck & Shoulder Line-Art */}
      <path
        d="M 53 66 C 53 74 46 83 24 94"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 67 66 C 67 74 74 83 96 94"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Subtle Collarbone Accent */}
      <path
        d="M 46 84 C 54 88 66 88 74 84"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="opacity-50"
      />
    </svg>
  );
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group relative flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-300 text-center shadow-xs hover:shadow-xl hover:shadow-primary/10 cursor-pointer overflow-hidden"
    >
      {/* Ambient background glow on hover */}
      <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Free-standing Thin Artistic Silhouette (No enclosing circle) */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex items-center justify-center text-primary shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.05)] group-hover:drop-shadow-[0_0_16px_rgba(var(--primary-rgb),0.35)]">
        <ArtistSilhouette className="w-full h-full" />
      </div>

      <div className="relative z-10 w-full mt-3 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-full">
          {artist.name}
        </h3>
        <span className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/70 transition-colors">
          {artist.albumCount ? `${artist.albumCount} album` : "Artista"}
        </span>
      </div>
    </Link>
  );
}

