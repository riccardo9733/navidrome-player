"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Pause, Heart, Download, Check, MoreVertical, Music, ListPlus, Radio } from "lucide-react";
import { Song } from "../../lib/subsonic/types";
import { usePlayerStore } from "../../store/usePlayerStore";
import { subsonicClient } from "../../lib/subsonic/client";
import { downloadTrack, isTrackDownloaded, deleteDownloadedTrack } from "../../lib/db/downloadManager";
import { formatDuration } from "../../lib/utils/formatters";

interface TrackRowProps {
  song: Song;
  index?: number;
  queueContext?: Song[];
  showCover?: boolean;
  showAlbum?: boolean;
  showTrackNumber?: boolean;
}

export function TrackRow({
  song,
  index,
  queueContext,
  showCover = true,
  showAlbum = true,
  showTrackNumber = false,
}: TrackRowProps) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playSong = usePlayerStore((s) => s.playSong);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const [isStarred, setIsStarred] = useState(Boolean(song.starred));
  const [isDownloaded, setIsDownloaded] = useState(Boolean(song.isDownloaded));
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCurrentTrack = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  useEffect(() => {
    isTrackDownloaded(song.id).then((downloaded) => setIsDownloaded(downloaded));
  }, [song.id]);

  const handlePlayClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playSong(song, queueContext, index);
    }
  };

  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStarred = !isStarred;
    setIsStarred(nextStarred);
    try {
      if (nextStarred) {
        await subsonicClient.star(song.id, "song");
      } else {
        await subsonicClient.unstar(song.id, "song");
      }
    } catch {
      setIsStarred(!nextStarred);
    }
  };

  const handleDownloadToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;

    if (isDownloaded) {
      await deleteDownloadedTrack(song.id);
      setIsDownloaded(false);
    } else {
      setDownloading(true);
      try {
        await downloadTrack(song, true);
        setIsDownloaded(true);
      } catch (err) {
        console.error("Failed to download track:", err);
      } finally {
        setDownloading(false);
      }
    }
  };

  const coverUrl = song.coverArt
    ? subsonicClient.getCoverArtUrl(song.coverArt, 100)
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80";

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer select-none ${
        isCurrentTrack
          ? "bg-indigo-600/15 text-indigo-400 font-medium"
          : "hover:bg-zinc-800/60 text-zinc-300"
      }`}
    >
      {/* Track Index or Playing Indicator */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {isCurrentlyPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-1 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
            <span className="w-1 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_300ms] h-3/4" />
            <span className="w-1 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_200ms] h-1/2" />
          </div>
        ) : (
          <>
            <span className="text-xs text-zinc-500 font-mono group-hover:hidden">
              {showTrackNumber && song.track ? song.track : index !== undefined ? index + 1 : <Music size={14} />}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayClick();
              }}
              className="hidden group-hover:flex items-center justify-center text-white"
            >
              {isCurrentTrack && isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5 fill-current" />}
            </button>
          </>
        )}
      </div>

      {/* Cover Art */}
      {showCover && (
        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={song.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate font-medium ${isCurrentTrack ? "text-indigo-400 font-semibold" : "text-white"}`}>
          {song.title}
        </p>
        <p className="text-xs text-zinc-400 truncate hover:text-zinc-200">
          {song.artistId ? (
            <Link
              href={`/artists/${song.artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {song.artist || "Artista Sconosciuto"}
            </Link>
          ) : (
            song.artist || "Artista Sconosciuto"
          )}
        </p>
      </div>

      {/* Album (Desktop only) */}
      {showAlbum && (
        <div className="hidden md:block flex-1 min-w-0 text-xs text-zinc-400 truncate">
          {song.albumId ? (
            <Link
              href={`/albums/${song.albumId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-zinc-200"
            >
              {song.album || "—"}
            </Link>
          ) : (
            song.album || "—"
          )}
        </div>
      )}

      {/* Actions: Download, Star & Duration */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Offline Download indicator / button */}
        <button
          onClick={handleDownloadToggle}
          title={isDownloaded ? "Scaricato offline" : "Scarica offline"}
          className={`p-1.5 rounded-lg transition-colors ${
            isDownloaded
              ? "text-emerald-400 bg-emerald-500/10"
              : downloading
              ? "text-indigo-400 animate-pulse"
              : "text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isDownloaded ? <Check size={15} /> : <Download size={15} />}
        </button>

        {/* Favorite Heart */}
        <button
          onClick={handleStarToggle}
          className={`p-1.5 rounded-lg transition-colors ${
            isStarred ? "text-pink-500" : "text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart size={15} className={isStarred ? "fill-current" : ""} />
        </button>

        {/* Duration */}
        <span className="text-xs font-mono text-zinc-500 w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* Track Options Dropdown Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(song, true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 text-left"
                >
                  <Radio size={14} className="text-indigo-400" /> Riproduci come prossimo
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(song, false);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 text-left"
                >
                  <ListPlus size={14} className="text-indigo-400" /> Aggiungi in coda
                </button>
                {song.albumId && (
                  <Link
                    href={`/albums/${song.albumId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 text-left"
                  >
                    <Music size={14} className="text-indigo-400" /> Vai all&apos;album
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
