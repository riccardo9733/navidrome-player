"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Settings } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const isMusicActive =
    pathname === "/music" ||
    pathname.startsWith("/songs") ||
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav z-40 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none transition-colors duration-200">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 active:scale-95 ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]" />
            )}
            <Icon
              size={22}
              className={`transition-transform duration-200 ${
                isActive ? "text-primary scale-110" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-[10.5px] tracking-tight mt-1 transition-colors ${
                isActive ? "font-semibold text-primary" : "font-medium text-muted-foreground"
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
