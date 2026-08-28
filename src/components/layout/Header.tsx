"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Server, ShieldCheck, WifiOff } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const isConnected = useAuthStore((s) => s.isConnected);
  const isOfflineMode = useAuthStore((s) => s.isOfflineMode);
  const profiles = useAuthStore((s) => s.profiles);
  const activeProfileId = useAuthStore((s) => s.activeProfileId);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl px-6 flex items-center justify-between z-10 shrink-0 select-none">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          title="Indietro"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          title="Avanti"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Instant Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca brani, artisti o album..."
            className="w-full bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-sm text-white placeholder-zinc-500 rounded-full pl-10 pr-4 py-2 border border-zinc-800 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </form>

      {/* Server Status Pill */}
      <div className="flex items-center gap-3">
        {isOfflineMode ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <WifiOff size={14} /> Offline Mode
          </div>
        ) : isConnected && activeProfile ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck size={14} /> {activeProfile.name || "Navidrome"}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Server size={14} /> Demo Mode
          </div>
        )}
      </div>
    </header>
  );
}
