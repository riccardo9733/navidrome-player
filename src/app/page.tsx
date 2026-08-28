"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Sparkles, Server, ArrowRight } from "lucide-react";
import { Album, Playlist, Song } from "../lib/subsonic/types";
import { subsonicClient } from "../lib/subsonic/client";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { AlbumCard } from "../components/shared/AlbumCard";
import { PlaylistCard } from "../components/shared/PlaylistCard";
import { TrackRow } from "../components/shared/TrackRow";

export default function HomePage() {
  const isConnected = useAuthStore((s) => s.isConnected);
  const playSong = usePlayerStore((s) => s.playSong);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      subsonicClient.getAlbumList("recent", 8),
      subsonicClient.getPlaylists(),
    ])
      .then(async ([albumsList, playlistsList]) => {
        if (!isMounted) return;
        setAlbums(albumsList);
        setPlaylists(playlistsList.slice(0, 4));

        // Get top songs from first album or search
        if (albumsList.length > 0) {
          try {
            const firstAlbum = await subsonicClient.getAlbum(albumsList[0].id);
            if (isMounted && firstAlbum.song) {
              setTopSongs(firstAlbum.song.slice(0, 6));
            }
          } catch {
            // Ignore
          }
        }
      })
      .catch((err) => console.error("Error loading home data:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isConnected]);

  const handlePlayHero = () => {
    if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs, 0);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* 1. Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-r from-indigo-950 via-purple-950/60 to-zinc-900 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sparkles size={14} /> Benvenuto nel tuo Navidrome Player
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            La tua musica, ovunque sei.
          </h1>

          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            Streaming lossless in tempo reale, testi sincronizzati LRC, equalizzatore a 10 bande e ascolto offline completo.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handlePlayHero}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-black font-bold text-sm shadow-xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
            >
              <Play size={18} className="fill-current" /> Ascolta Ora
            </button>

            {!isConnected && (
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-sm font-semibold transition-colors"
              >
                <Server size={16} /> Collega Server Navidrome
              </Link>
            )}
          </div>
        </div>

        {/* Ambient Gradient Blobs */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Top Songs Section */}
      {topSongs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Brani in Primo Piano
            </h2>
            <Link
              href="/explore"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Vedi tutti <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/50">
            {topSongs.map((song, index) => (
              <TrackRow
                key={song.id}
                song={song}
                index={index}
                queueContext={topSongs}
                showCover
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Recently Added Albums Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Album Recenti
            </h2>
            <p className="text-xs text-zinc-400">Ultime aggiunte alla libreria musicale</p>
          </div>

          <Link
            href="/albums"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Tutti gli album <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-square bg-zinc-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Playlists Section */}
      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Playlist Consigliate
            </h2>
            <Link
              href="/playlists"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Tutte le playlist <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {playlists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
