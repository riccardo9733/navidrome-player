"use client";

import { useEffect, useState } from "react";
import { Download, HardDrive, Trash2, Play, CheckCircle2 } from "lucide-react";
import {
  getAllDownloadedTracks,
  getStorageStats,
  clearAllDownloads,
  deleteDownloadedTrack,
} from "../../lib/db/downloadManager";
import { CachedTrackRecord } from "../../lib/db/dexie";
import { formatBytes } from "../../lib/utils/formatters";
import { TrackRow } from "../../components/shared/TrackRow";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";

export default function DownloadsPage() {
  const [cachedTracks, setCachedTracks] = useState<CachedTrackRecord[]>([]);
  const [stats, setStats] = useState({ totalBytes: 0, trackCount: 0 });
  const [loading, setLoading] = useState(true);

  const playSong = usePlayerStore((s) => s.playSong);
  const maxCacheSizeGB = useSettingsStore((s) => s.maxCacheSizeGB);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tracks, storage] = await Promise.all([
        getAllDownloadedTracks(),
        getStorageStats(),
      ]);
      setCachedTracks(tracks);
      setStats(storage);
    } catch (err) {
      console.error("Error loading offline downloads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearAll = async () => {
    if (confirm("Sei sicuro di voler eliminare tutti i brani scaricati e svuotare la cache offline?")) {
      await clearAllDownloads();
      await loadData();
    }
  };

  const handleDeleteOne = async (id: string) => {
    await deleteDownloadedTrack(id);
    await loadData();
  };

  const handlePlayAllOffline = () => {
    if (cachedTracks.length > 0) {
      const songs = cachedTracks.map((t) => t.song);
      playSong(songs[0], songs, 0);
    }
  };

  const maxBytes = maxCacheSizeGB * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, (stats.totalBytes / maxBytes) * 100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Download size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Offline & Download</h1>
            <p className="text-xs text-zinc-400">Musica salvata in locale su IndexedDB per ascolto senza connessione</p>
          </div>
        </div>

        {cachedTracks.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAllOffline}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <Play size={15} className="fill-current" /> Ascolta Offline
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs font-semibold border border-zinc-800 transition-colors"
            >
              <Trash2 size={14} /> Svuota Cache
            </button>
          </div>
        )}
      </div>

      {/* Storage Meter Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Spazio di Archiviazione Utilizzato</h3>
              <p className="text-xs text-zinc-400">
                {stats.trackCount} brani salvati in IndexedDB
              </p>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-emerald-400">
            {formatBytes(stats.totalBytes)} / {maxCacheSizeGB} GB ({usedPercent.toFixed(1)}%)
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, usedPercent)}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>I file audio rimangono disponibili anche in modalità aereo o senza connessione internet.</span>
        </div>
      </div>

      {/* Downloaded Tracklist */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Brani Scaricati ({cachedTracks.length})</h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : cachedTracks.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 space-y-2">
            <p className="text-base font-medium">Nessun brano salvato per l&apos;ascolto offline</p>
            <p className="text-xs">
              Usa l&apos;icona di download accanto a qualsiasi brano o album per renderlo disponibile offline.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {cachedTracks.map((record, idx) => (
              <div key={record.id} className="group relative flex items-center">
                <div className="flex-1">
                  <TrackRow
                    song={record.song}
                    index={idx}
                    queueContext={cachedTracks.map((c) => c.song)}
                    showCover
                    showAlbum
                  />
                </div>
                <button
                  onClick={() => handleDeleteOne(record.id)}
                  title="Rimuovi dal dispositivo"
                  className="p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
