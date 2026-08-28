import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { AudioProvider } from "../components/audio/AudioProvider";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { RightSidebar } from "../components/layout/RightSidebar";
import { BottomPlayerBar } from "../components/player/BottomPlayerBar";
import { MiniPlayer } from "../components/player/MiniPlayer";
import { MobileNav } from "../components/layout/MobileNav";
import { FullscreenPlayerModal } from "../components/player/FullscreenPlayerModal";
import { EqualizerModal } from "../components/audio/EqualizerModal";

export const metadata: Metadata = {
  title: "Navidrome PWA Player",
  description: "Next-generation PWA player for Navidrome / Subsonic music servers with offline listening and synced lyrics",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
    ],
    shortcut: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Navidrome",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const themeBootstrapScript = `
(function() {
  try {
    var raw = localStorage.getItem('navidrome-settings-storage');
    var parsed = raw ? JSON.parse(raw) : null;
    var state = parsed && parsed.state ? parsed.state : {};
    var mode = state.themeMode || 'dark';
    var color = state.themeColor || 'indigo';

    var effectiveMode = mode;
    if (mode === 'system') {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveMode = prefersDark ? 'dark' : 'light';
    }

    var doc = document.documentElement;
    doc.classList.remove('light', 'dark', 'oled');
    if (effectiveMode === 'oled') {
      doc.classList.add('dark', 'oled');
      doc.style.colorScheme = 'dark';
    } else if (effectiveMode === 'dark') {
      doc.classList.add('dark');
      doc.style.colorScheme = 'dark';
    } else {
      doc.classList.add('light');
      doc.style.colorScheme = 'light';
    }
    doc.setAttribute('data-theme', color);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning className="dark" data-theme="indigo">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="bg-background text-foreground antialiased h-[100dvh] overflow-hidden flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <AudioProvider>
            <div className="flex flex-1 overflow-hidden">
              {/* Desktop Left Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-3 pb-36 md:pt-6 md:pb-28">
                  {children}
                </main>
              </div>

              {/* Desktop Right Sidebar (Lyrics / Queue) */}
              <RightSidebar />
            </div>

            {/* Desktop Persistent Bottom Bar */}
            <BottomPlayerBar />

            {/* Mobile Floating Mini Player */}
            <MiniPlayer />

            {/* Mobile Persistent Bottom Navigation */}
            <MobileNav />

            {/* Fullscreen Player Modal / Mobile Vaul Drawer */}
            <FullscreenPlayerModal />

            {/* 10-Band Equalizer Modal */}
            <EqualizerModal />
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
