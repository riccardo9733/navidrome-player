"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  WifiOff,
  Headphones,
  ExternalLink,
  Laptop,
  Check,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isStandaloneNavigator = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return isStandaloneMedia || isStandaloneNavigator;
    };

    setIsStandalone(checkStandalone());

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check service worker status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        setSwRegistered(registrations.length > 0);
      });
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setInstallSuccess(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallSuccess(true);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("[PWA] Install error:", err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Smartphone size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">App Mobile & Desktop (PWA)</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm space-y-6">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
              <Download size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground">Navidrome Web App</h3>
                {isStandalone || installSuccess ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Installata
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-[11px] font-bold">
                    PWA Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isStandalone || installSuccess
                  ? "Stai utilizzando Navidrome come applicazione standalone nativa."
                  : "Installa Navidrome su smartphone, tablet o PC per un'esperienza nativa e fluida."}
              </p>
            </div>
          </div>

          {/* Action button */}
          {!isStandalone && !installSuccess && (
            <div className="shrink-0">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 active:scale-95 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25 transition-all cursor-pointer"
                >
                  <Download size={16} />
                  {isInstalling ? "Installazione in corso..." : "Scarica e Installa PWA"}
                </button>
              ) : isIOS ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary border border-border text-xs font-semibold text-secondary-foreground">
                  <Share2 size={15} className="text-primary" />
                  <span>Usa Condividi su Safari</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    alert(
                      "Per installare l'app:\n• Su Chrome/Edge/Brave: Clicca sull'icona Installa nella barra degli indirizzi in alto a destra o dal menu ⋮ -> 'Installa Navidrome'\n• Su smartphone: Apri il menu del browser e tocca 'Aggiungi a schermata Home' o 'Installa app'"
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 active:scale-95 text-secondary-foreground text-xs font-semibold border border-border transition-all cursor-pointer"
                >
                  <Download size={15} className="text-primary" />
                  Come Installare
                </button>
              )}
            </div>
          )}
        </div>

        {/* Features highlights grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <WifiOff size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Ascolto Offline</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Scarica interi album o brani nella memoria del dispositivo e ascoltali senza connessione.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Headphones size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Audio in Background</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Controlli multimediali integrati nella schermata di blocco, smartwatch e cuffie.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Esperienza Nativa</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Avvio istantaneo a schermo intero senza barre del browser e consumo minimo di batteria.
              </p>
            </div>
          </div>
        </div>

        {/* iOS Specific Guidance Banner */}
        {isIOS && !isStandalone && (
          <div className="p-4 rounded-xl bg-secondary border border-primary/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Smartphone size={15} />
              Istruzioni per iPhone & iPad (Safari):
            </div>
            <ol className="text-xs text-foreground/90 space-y-1.5 pl-5 list-decimal">
              <li>
                Tocca l'icona <span className="font-semibold text-foreground">Condividi</span> (
                <Share2 size={13} className="inline mx-0.5 text-primary" />) nella barra di Safari in basso.
              </li>
              <li>
                Scorri l'elenco e seleziona{" "}
                <span className="font-semibold text-foreground">
                  "Aggiungi alla schermata Home" <PlusSquare size={13} className="inline mx-0.5 text-primary" />
                </span>
                .
              </li>
              <li>
                Conferma toccando <span className="font-semibold text-foreground">"Aggiungi"</span> in alto a destra.
              </li>
            </ol>
          </div>
        )}

        {/* Installed State Card Info */}
        {(isStandalone || installSuccess) && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Ottimo! L'applicazione è installata correttamente sul tuo dispositivo con supporto completo per la cache e le funzionalità offline.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
