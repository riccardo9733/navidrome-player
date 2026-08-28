"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  Sparkles,
  Server,
  ArrowRight,
  WifiOff,
  Music2,
  Mic2,
  Download,
  Sliders,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { Album, Playlist, Song } from "../lib/subsonic/types";
import { subsonicClient } from "../lib/subsonic/client";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { AlbumCard } from "../components/shared/AlbumCard";
import { PlaylistCard } from "../components/shared/PlaylistCard";
import { TrackRow } from "../components/shared/TrackRow";
import { getOfflineAlbums, getOfflinePlaylists, getOfflineTracks, isBrowserOffline } from "../lib/db/offlineProvider";

export default function HomePage() {
  const isConnected = useAuthStore((s) => s.isConnected);
  const profiles = useAuthStore((s) => s.profiles);
  const activeProfileId = useAuthStore((s) => s.activeProfileId);
  const isOfflineMode = useAuthStore((s) => s.isOfflineMode);
  const playSong = usePlayerStore((s) => s.playSong);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const isConfigured = Boolean(
    subsonicClient.isConfigured() ||
    (activeProfileId && profiles.some((p) => p.id === activeProfileId))
  );

  const loadOfflineData = async () => {
    try {
      const [offlineAlbums, offlinePlaylists, offlineTracks] = await Promise.all([
        getOfflineAlbums(),
        getOfflinePlaylists(),
        getOfflineTracks(),
      ]);
      setAlbums(offlineAlbums.slice(0, 8));
      setPlaylists(offlinePlaylists.slice(0, 4));
      setTopSongs(offlineTracks.slice(0, 6));
      setIsOffline(true);
    } catch (e) {
      console.error("Error loading offline home data:", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (isOfflineMode || isBrowserOffline()) {
      loadOfflineData().finally(() => {
        if (isMounted) setLoading(false);
      });
      return;
    }

    if (!isConfigured) {
      setLoading(false);
      return;
    }

    Promise.all([
      subsonicClient.getAlbumList("recent", 8),
      subsonicClient.getPlaylists(),
    ])
      .then(async ([albumsList, playlistsList]) => {
        if (!isMounted) return;
        setAlbums(albumsList);
        setPlaylists(playlistsList.slice(0, 4));
        setIsOffline(false);

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
      .catch(async (err) => {
        console.warn("Online home data failed, falling back to offline storage:", err);
        if (isMounted) {
          await loadOfflineData();
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isConnected, isConfigured, isOfflineMode]);

  const handlePlayHero = () => {
    if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs, 0);
    }
  };

  // If server is not configured and user is not in offline mode, show the server configuration invitation card
  if (!isConfigured && !isOfflineMode && !isBrowserOffline()) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-300">
        {/* Main Server Setup Hero Card */}
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-zinc-950 border border-indigo-500/30 shadow-2xl">
          <div className="relative z-10 space-y-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 shadow-sm">
                <Sparkles size={14} className="text-indigo-400" /> Benvenuto su Navidrome Player
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Configura il tuo Server Navidrome
              </h1>
              <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                Collega la tua istanza Navidrome o Subsonic per accedere a tutta la tua collezione musicale in streaming lossless, testi sincronizzati LRC, equalizzatore a 10 bande e ascolto offline.
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Server size={18} /> Configura Server Adesso <ArrowRight size={16} />
              </Link>

              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-sm font-semibold transition-colors"
              >
                <Download size={16} /> Libreria Offline & Download
              </Link>
            </div>
          </div>

          {/* Ambient Glows */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-12 -bottom-20 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-2 hover:border-indigo-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Music2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Streaming Lossless</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Riproduci FLAC, ALAC, MP3, AAC e Opus con bitrate adattivo o qualità originale da studio.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-2 hover:border-purple-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Mic2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Testi Sincronizzati LRC</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Visualizza i testi in tempo reale con scorrimento automatico stile Apple Music / Spotify.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-2 hover:border-emerald-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Ascolto Offline</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Salva album, brani e playlist per ascoltarli in aereo o senza connessione internet.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-2 hover:border-pink-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <h3 className="text-sm font-bold text-white">Equalizzatore 10 Bande</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Regola ogni frequenza con preset audio dedicati (Bass Boost, Rock, Vocal, Electronic).
            </p>
          </div>
        </div>

        {/* Quick Connection Help Info */}
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
              <Radio size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Compatibilità Totale con l'Ecosistema Subsonic</p>
              <p className="text-[11px] text-zinc-400">
                Supporta Navidrome, Gonic, Airsonic, LMS e qualsiasi server con API Subsonic / OpenSubsonic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <CheckCircle2 size={15} className="text-emerald-400" /> Installabile come PWA
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* 1. Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-r from-indigo-950 via-purple-950/60 to-zinc-900 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles size={14} /> {isOffline ? "Navidrome Player Offline" : "Benvenuto nel tuo Navidrome Player"}
            </div>
            {isOffline && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                <WifiOff size={13} /> Libreria Offline
              </div>
            )}
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
              disabled={topSongs.length === 0}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-black font-bold text-sm shadow-xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} className="fill-current" /> Ascolta Ora
            </button>

            {!isConnected && (
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-sm font-semibold transition-colors"
              >
                <Server size={16} /> Impostazioni Server
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
