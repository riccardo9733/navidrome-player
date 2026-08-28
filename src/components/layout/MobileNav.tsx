"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Settings } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const isMusicActive =
    pathname === "/music" ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/albums") ||
    pathname.startsWith("/artists") ||
    pathname.startsWith("/playlists") ||
    pathname.startsWith("/starred") ||
    pathname.startsWith("/downloads");

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      name: "Cerca",
      href: "/search",
      icon: Search,
      isActive: pathname === "/search" || pathname.startsWith("/search"),
    },
    {
      name: "Musica",
      href: "/music",
      icon: Library,
      isActive: isMusicActive,
    },
    {
      name: "Impostazioni",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings" || pathname.startsWith("/settings"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav z-40 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 active:scale-95 ${
              isActive ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {isActive && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            )}
            <Icon
              size={22}
              className={`transition-transform duration-200 ${
                isActive ? "text-indigo-400 scale-110" : "text-zinc-400"
              }`}
            />
            <span
              className={`text-[10.5px] tracking-tight mt-1 transition-colors ${
                isActive ? "font-semibold text-indigo-300" : "font-medium text-zinc-400"
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
