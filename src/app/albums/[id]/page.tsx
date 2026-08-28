"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Play, Shuffle, Download, Check, Clock, Heart, Loader2 } from "lucide-react";
import { Album } from "../../../lib/subsonic/types";
import { subsonicClient } from "../../../lib/subsonic/client";
import { usePlayerStore } from "../../../store/usePlayerStore";
import { TrackRow } from "../../../components/shared/TrackRow";
import { formatDuration } from "../../../lib/utils/formatters";
import { downloadAlbum } from "../../../lib/db/downloadManager";

import { getOfflineAlbum, isBrowserOffline } from "../../../lib/db/offlineProvider";
import { isTrackDownloaded } from "../../../lib/db/downloadManager";
import { useDownloadStore } from "../../../store/useDownloadStore";

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const downloadState = useDownloadStore((s) => s.downloadingItems[id]);
  const downloadAlbumAction = useDownloadStore((s) => s.downloadAlbumAction);
  const isDownloading = downloadState?.status === "downloading";
  const downloadProgress = downloadState?.progress || 0;

  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    if (downloadState?.status === "completed") {
      setIsDownloaded(true);
    }
  }, [downloadState?.status]);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      getOfflineAlbum(id)
        .then((data) => {
          if (data) {
            setAlbum(data);
            setIsDownloaded(true);
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getAlbum(id)
      .then(async (data) => {
        setAlbum(data);
        setIsStarred(Boolean(data.starred));

        // Check if all songs are already downloaded
        if (data.song && data.song.length > 0) {
          const downloadChecks = await Promise.all(
            data.song.map((s) => isTrackDownloaded(s.id))
          );
          setIsDownloaded(downloadChecks.every(Boolean));
        }
      })
      .catch(async (err) => {
        console.warn("Online album detail failed, fallback to offline:", err);
        const offAlbum = await getOfflineAlbum(id);
        if (offAlbum) {
          setAlbum(offAlbum);
          setIsDownloaded(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p>Caricamento album...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="text-xl font-bold text-foreground">Album non trovato</p>
        <Link href="/albums" className="mt-4 inline-block text-primary hover:underline">
          Torna agli album
        </Link>
      </div>
    );
  }

  const songs = album.song || [];
  const coverUrl = album.coverArt
    ? subsonicClient.getCoverArtUrl(album.coverArt, 600)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      playSong(songs[randomIndex], songs, randomIndex);
    }
  };

  const handleDownloadAlbum = () => {
    if (isDownloading || isDownloaded || !album) return;
    downloadAlbumAction(album);
  };

  const handleStarToggle = async () => {
    const nextStarred = !isStarred;
    setIsStarred(nextStarred);
    try {
      if (nextStarred) {
        await subsonicClient.star(album.id, "album");
      } else {
        await subsonicClient.unstar(album.id, "album");
      }
    } catch {
      setIsStarred(!nextStarred);
    }
  };

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-6 border-b border-border">
        {/* Cover Art */}
        <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-3xl overflow-hidden shadow-2xl bg-secondary shrink-0 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={album.name} className="w-full h-full object-cover" />
        </div>

        {/* Album Meta */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Album
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight">
            {album.name || album.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground font-medium">
            {album.artistId ? (
              <Link
                href={`/artists/${album.artistId}`}
                className="text-foreground hover:text-primary hover:underline font-bold"
              >
                {album.artist}
              </Link>
            ) : (
              <span className="text-foreground font-bold">{album.artist}</span>
            )}
            <span>•</span>
            {album.year && <span>{album.year}</span>}
            {album.year && <span>•</span>}
            <span>{songs.length} brani</span>
            <span>•</span>
            <span className="text-muted-foreground">{formatDuration(totalDuration)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play size={18} className="fill-current" /> Riproduci
            </button>

            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-sm font-semibold transition-colors cursor-pointer"
            >
              <Shuffle size={16} /> Casuale
            </button>

            <button
              onClick={handleDownloadAlbum}
              className={`flex items-center gap-2 px-4 py-3 rounded-full border text-sm font-semibold transition-colors cursor-pointer ${
                isDownloaded
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : isDownloading
                  ? "bg-primary/10 border-primary/20 text-primary animate-pulse"
                  : "bg-secondary border-border hover:bg-secondary/80 text-secondary-foreground"
              }`}
            >
              {isDownloaded ? (
                <>
                  <Check size={16} /> Scaricato
                </>
              ) : isDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {downloadProgress}%
                </>
              ) : (
                <>
                  <Download size={16} /> Scarica Album
                </>
              )}
            </button>

            <button
              onClick={handleStarToggle}
              className={`p-3 rounded-full border transition-colors cursor-pointer ${
                isStarred
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-secondary border-border hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart size={18} className={isStarred ? "fill-current" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="space-y-1">
        {/* Table Header */}
        <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border mb-2">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Titolo</span>
          <span className="hidden md:block flex-1">Album</span>
          <span className="flex items-center gap-1 w-20 justify-end">
            <Clock size={14} />
          </span>
        </div>

        {songs.map((song, idx) => (
          <TrackRow
            key={song.id}
            song={song}
            index={idx}
            queueContext={songs}
            showCover={false}
            showAlbum={false}
            showTrackNumber
          />
        ))}
      </div>
    </div>
  );
}
