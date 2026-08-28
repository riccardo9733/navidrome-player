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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setImgError(false);

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
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p>Caricamento artista...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="text-xl font-bold text-foreground">Artista non trovato</p>
        <Link href="/artists" className="mt-4 inline-block text-primary hover:underline">
          Torna agli artisti
        </Link>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-border">
        <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-secondary shadow-2xl shrink-0 border-4 border-border">
          {imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={artist.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-primary/15 via-primary/8 to-secondary text-primary">
              <User className="w-20 h-20 md:w-24 md:h-24 text-primary" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Artista
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground">{artist.name}</h1>
          <p className="text-sm text-muted-foreground">{albums.length} Album nella libreria</p>

          <div className="pt-2">
            <button
              onClick={handleStarToggle}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors cursor-pointer ${
                isStarred
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-secondary border-border hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
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
        <h2 className="text-xl font-bold text-foreground tracking-tight">Discografia</h2>
        {albums.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun album trovato per questo artista.</p>
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
