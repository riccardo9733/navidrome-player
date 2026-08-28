"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { User, Heart, Loader2 } from "lucide-react";
import { Artist } from "../../../lib/subsonic/types";
import { subsonicClient } from "../../../lib/subsonic/client";
import { AlbumCard } from "../../../components/shared/AlbumCard";

import { getOfflineArtist, isBrowserOffline } from "../../../lib/db/offlineProvider";

export default function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      getOfflineArtist(id)
        .then(setArtist)
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getArtist(id)
      .then((data) => {
        setArtist(data);
        setIsStarred(Boolean(data.starred));
      })
      .catch(async (err) => {
        console.warn("Online artist detail failed, fallback to offline:", err);
        const offArtist = await getOfflineArtist(id);
        setArtist(offArtist);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-zinc-400 gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p>Caricamento artista...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-24 text-zinc-400">
        <p className="text-xl font-bold">Artista non trovato</p>
        <Link href="/artists" className="mt-4 inline-block text-indigo-400 hover:underline">
          Torna agli artisti
        </Link>
      </div>
    );
  }

  const [imgError, setImgError] = useState(false);
  const imageUrl = artist.artistImageUrl || (artist.coverArt ? subsonicClient.getCoverArtUrl(artist.coverArt, 400) : null);
  const albums = artist.album || [];

  const handleStarToggle = async () => {
    const nextStarred = !isStarred;
    setIsStarred(nextStarred);
    try {
      if (nextStarred) {
        await subsonicClient.star(artist.id, "artist");
      } else {
        await subsonicClient.unstar(artist.id, "artist");
      }
    } catch {
      setIsStarred(!nextStarred);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Profile */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-zinc-800">
        <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-zinc-800 shadow-2xl shrink-0 border-4 border-zinc-800">
          {imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={artist.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-900 text-white">
              <span className="text-4xl font-extrabold tracking-wider">
                {artist.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Artista
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">{artist.name}</h1>
          <p className="text-sm text-zinc-400">{albums.length} Album nella libreria</p>

          <div className="pt-2">
            <button
              onClick={handleStarToggle}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
                isStarred
                  ? "bg-pink-500/10 border-pink-500/20 text-pink-500"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              <Heart size={16} className={isStarred ? "fill-current" : ""} />
              {isStarred ? "Nei Preferiti" : "Aggiungi ai Preferiti"}
            </button>
          </div>
        </div>
      </div>

      {/* Discography */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Discografia</h2>
        {albums.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun album trovato per questo artista.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
