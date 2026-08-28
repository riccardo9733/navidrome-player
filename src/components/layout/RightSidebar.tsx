"use client";

import { X, FileText, ListMusic, Trash2 } from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { SyncedLyrics } from "../player/SyncedLyrics";
import { formatDuration } from "../../lib/utils/formatters";

export function RightSidebar() {
  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playSong = usePlayerStore((s) => s.playSong);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  if (!isLyricsOpen && !isQueueOpen) return null;

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 h-full border-l border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl p-4 overflow-hidden shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {isLyricsOpen ? (
            <>
              <FileText size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Testi Sincronizzati</h3>
            </>
          ) : (
            <>
              <ListMusic size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Coda di Riproduzione</h3>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isQueueOpen && queue.length > 0 && (
            <button
              onClick={clearQueue}
              title="Svuota coda"
              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={() => {
              setLyricsOpen(false);
              setQueueOpen(false);
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1">
        {isLyricsOpen ? (
          <SyncedLyrics song={currentSong} className="max-h-[calc(100vh-180px)]" />
        ) : (
          <div className="space-y-1.5">
            {queue.map((track, idx) => {
              const isCur = idx === queueIndex;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playSong(track, queue, idx)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isCur
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "hover:bg-zinc-900 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono text-zinc-500 w-4 text-center">
                      {isCur ? "▶" : idx + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCur ? "text-indigo-400" : "text-white"}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-zinc-500">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
