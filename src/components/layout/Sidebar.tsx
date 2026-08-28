"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Disc3,
  Users,
  ListMusic,
  Heart,
  Download,
  Settings,
  Radio,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { subsonicClient } from "../../lib/subsonic/client";
import { Playlist } from "../../lib/subsonic/types";

export function Sidebar() {
  const pathname = usePathname();
  const isConnected = useAuthStore((s) => s.isConnected);
  const isOfflineMode = useAuthStore((s) => s.isOfflineMode);
  const toggleOfflineMode = useAuthStore((s) => s.toggleOfflineMode);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    subsonicClient.getPlaylists().then(setPlaylists).catch(() => {});
  }, [isConnected]);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Esplora", href: "/explore", icon: Compass },
    { name: "Cerca", href: "/search", icon: Radio },
    { name: "Album", href: "/albums", icon: Disc3 },
    { name: "Artisti", href: "/artists", icon: Users },
    { name: "Playlist", href: "/playlists", icon: ListMusic },
    { name: "Preferiti", href: "/starred", icon: Heart },
    { name: "Offline & Download", href: "/downloads", icon: Download },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-full border-r border-border bg-card/60 backdrop-blur-2xl p-4 overflow-hidden select-none z-20 transition-colors duration-200">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-2 group">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
          <Disc3 size={24} className="text-primary-foreground animate-[spin_10s_linear_infinite]" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
            Navidrome
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
              PWA
            </span>
          </h1>
          <p className="text-[11px] text-muted-foreground">Stream & Offline Audio</p>
        </div>
      </Link>

      {/* Main Navigation Links */}
      <nav className="space-y-1 my-2">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon size={18} className={isActive ? "text-primary-foreground" : "text-muted-foreground"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Offline Mode Switch */}
      <div className="my-3 px-3 py-2.5 rounded-xl bg-secondary/70 border border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOfflineMode ? (
            <WifiOff size={16} className="text-amber-500" />
          ) : (
            <Wifi size={16} className="text-emerald-500" />
          )}
          <span className="text-xs font-medium text-foreground">Modalità Offline</span>
        </div>
        <input
          type="checkbox"
          checked={isOfflineMode}
          onChange={(e) => toggleOfflineMode(e.target.checked)}
          className="w-4 h-4 accent-amber-500 cursor-pointer"
        />
      </div>

      {/* Playlists Quick List */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 border-t border-border pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3">
          Le Tue Playlist
        </span>
        <div className="mt-2 space-y-1">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/playlists/${pl.id}`}
              className={`block px-3 py-1.5 rounded-lg text-xs truncate transition-colors ${
                pathname === `/playlists/${pl.id}`
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {pl.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Settings Bottom Link */}
      <div className="pt-3 border-t border-border">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            pathname === "/settings"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Settings size={18} />
          Impostazioni Server
        </Link>
      </div>
    </aside>
  );
}
