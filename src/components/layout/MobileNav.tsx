"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, Download, Settings } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Esplora", href: "/explore", icon: Compass },
    { name: "Cerca", href: "/search", icon: Search },
    { name: "Offline", href: "/downloads", icon: Download },
    { name: "Impostazioni", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-nav z-40 px-2 flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
              isActive ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon size={20} className={isActive ? "text-indigo-400" : ""} />
            <span className="text-[10px] font-medium mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
