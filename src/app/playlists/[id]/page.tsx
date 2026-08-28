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

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    setLoading(true);
    subsonicClient
      .getPlaylist(id)
      .then(setPlaylist)
      .catch((err) => console.error("Error loading playlist:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-zinc-400 gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p>Caricamento playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-24 text-zinc-400">
        <p className="text-xl font-bold">Playlist non trovata</p>
        <Link href="/playlists" className="mt-4 inline-block text-indigo-400 hover:underline">
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

  const handleDownloadPlaylist = async () => {
    if (downloading || isDownloaded) return;
    setDownloading(true);
    try {
      await downloadPlaylist(playlist, (completed, total) => {
        setDownloadProgress(Math.round((completed / total) * 100));
      });
      setIsDownloaded(true);
    } catch (err) {
      console.error("Failed to download playlist:", err);
    } finally {
      setDownloading(false);
    }
  };

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-6 border-b border-zinc-800/80">
        <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-3xl overflow-hidden shadow-2xl bg-zinc-800 shrink-0 flex items-center justify-center border border-zinc-700/50">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/50 to-purple-950 text-indigo-400">
              <ListMusic size={64} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Playlist
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
            {playlist.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-zinc-300 font-medium">
            {playlist.owner && <span>Creata da {playlist.owner}</span>}
            {playlist.owner && <span>•</span>}
            <span>{songs.length} brani</span>
            <span>•</span>
            <span className="text-zinc-400">{formatDuration(totalDuration)}</span>
          </div>

          {playlist.comment && (
            <p className="text-xs text-zinc-400 italic max-w-md">{playlist.comment}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Play size={18} className="fill-current" /> Riproduci
            </button>

            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors"
            >
              <Shuffle size={16} /> Casuale
            </button>

            <button
              onClick={handleDownloadPlaylist}
              className={`flex items-center gap-2 px-4 py-3 rounded-full border text-sm font-semibold transition-colors ${
                isDownloaded
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : downloading
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              {isDownloaded ? (
                <>
                  <Check size={16} /> Scaricata
                </>
              ) : downloading ? (
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
        <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/60 mb-2">
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
