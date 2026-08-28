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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Download size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Offline & Download</h1>
            <p className="text-xs text-muted-foreground">Musica salvata in locale su IndexedDB per ascolto senza connessione</p>
          </div>
        </div>

        {cachedTracks.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAllOffline}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              <Play size={15} className="fill-current" /> Ascolta Offline
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Svuota Cache
            </button>
          </div>
        )}
      </div>

      {/* Storage Meter Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Spazio di Archiviazione Utilizzato</h3>
              <p className="text-xs text-muted-foreground">
                {stats.trackCount} brani salvati in IndexedDB
              </p>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-primary">
            {formatBytes(stats.totalBytes)} / {maxCacheSizeGB} GB ({usedPercent.toFixed(1)}%)
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, usedPercent)}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 size={14} className="text-primary shrink-0" />
          <span>I file audio rimangono disponibili anche in modalità aereo o senza connessione internet.</span>
        </div>
      </div>

      {/* Downloaded Tracklist */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Brani Scaricati ({cachedTracks.length})</h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : cachedTracks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground space-y-2">
            <p className="text-base font-medium text-foreground">Nessun brano salvato per l&apos;ascolto offline</p>
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
                  className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity mr-2 cursor-pointer"
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
