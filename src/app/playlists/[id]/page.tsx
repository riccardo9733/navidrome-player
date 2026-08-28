"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Play, Shuffle, Download, Check, Clock, ListMusic, Loader2 } from "lucide-react";
import { Playlist } from "../../../lib/subsonic/types";
import { subsonicClient } from "../../../lib/subsonic/client";
import { usePlayerStore } from "../../../store/usePlayerStore";
import { TrackRow } from "../../../components/shared/TrackRow";
import { formatDuration } from "../../../lib/utils/formatters";
import { downloadPlaylist } from "../../../lib/db/downloadManager";

import { getOfflinePlaylist, isBrowserOffline } from "../../../lib/db/offlineProvider";
import { isTrackDownloaded } from "../../../lib/db/downloadManager";
import { useDownloadStore } from "../../../store/useDownloadStore";

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const downloadState = useDownloadStore((s) => s.downloadingItems[id]);
  const downloadPlaylistAction = useDownloadStore((s) => s.downloadPlaylistAction);
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
      getOfflinePlaylist(id)
        .then((pl) => {
          if (pl) {
            setPlaylist(pl);
            setIsDownloaded(true);
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getPlaylist(id)
      .then(async (data) => {
        setPlaylist(data);
        if (data.entry && data.entry.length > 0) {
          const downloadChecks = await Promise.all(
            data.entry.map((s) => isTrackDownloaded(s.id))
          );
          setIsDownloaded(downloadChecks.every(Boolean));
        }
      })
      .catch(async (err) => {
        console.warn("Online playlist detail failed, fallback to offline:", err);
        const offPl = await getOfflinePlaylist(id);
        if (offPl) {
          setPlaylist(offPl);
          setIsDownloaded(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p>Caricamento playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="text-xl font-bold text-foreground">Playlist non trovata</p>
        <Link href="/playlists" className="mt-4 inline-block text-primary hover:underline">
          Torna alle playlist
        </Link>
      </div>
    );
  }

  const songs = playlist.entry || [];
  const coverUrl = playlist.coverArt
    ? subsonicClient.getCoverArtUrl(playlist.coverArt, 500)
    : null;

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

  const handleDownloadPlaylist = () => {
    if (isDownloading || isDownloaded || !playlist) return;
    downloadPlaylistAction(playlist);
  };

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-6 border-b border-border">
        <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-3xl overflow-hidden shadow-2xl bg-secondary shrink-0 flex items-center justify-center border border-border">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary text-primary">
              <ListMusic size={64} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Playlist
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight">
            {playlist.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground font-medium">
            {playlist.owner && <span>Creata da {playlist.owner}</span>}
            {playlist.owner && <span>•</span>}
            <span>{songs.length} brani</span>
            <span>•</span>
            <span className="text-muted-foreground">{formatDuration(totalDuration)}</span>
          </div>

          {playlist.comment && (
            <p className="text-xs text-muted-foreground italic max-w-md">{playlist.comment}</p>
          )}

          {/* Action buttons */}
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
              onClick={handleDownloadPlaylist}
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
                  <Download size={16} /> Scarica Playlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="space-y-1">
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
            key={`${song.id}-${idx}`}
            song={song}
            index={idx}
            queueContext={songs}
            showCover
            showAlbum
          />
        ))}
      </div>
    </div>
  );
}
