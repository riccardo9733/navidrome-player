"use client";

import { useState } from "react";
import {
  Server,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HardDrive,
  ShieldCheck,
  Radio,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BitrateOption, TranscodingFormat } from "../../lib/subsonic/types";
import { clearAllDownloads } from "../../lib/db/downloadManager";
import { PwaInstallCard } from "../../components/settings/PwaInstallCard";
import { ThemeSelector } from "../../components/settings/ThemeSelector";
import { OpenRouterSettingsCard } from "../../components/settings/OpenRouterSettingsCard";

export default function SettingsPage() {
  const profiles = useAuthStore((s) => s.profiles);
  const activeProfileId = useAuthStore((s) => s.activeProfileId);
  const addProfile = useAuthStore((s) => s.addProfile);
  const removeProfile = useAuthStore((s) => s.removeProfile);
  const setActiveProfile = useAuthStore((s) => s.setActiveProfile);
  const testConnection = useAuthStore((s) => s.testConnection);
  const isConnected = useAuthStore((s) => s.isConnected);
  const isOfflineMode = useAuthStore((s) => s.isOfflineMode);
  const toggleOfflineMode = useAuthStore((s) => s.toggleOfflineMode);
  const serverInfo = useAuthStore((s) => s.serverInfo);

  // Settings store
  const bitrate = useSettingsStore((s) => s.bitrate);
  const setBitrate = useSettingsStore((s) => s.setBitrate);
  const format = useSettingsStore((s) => s.format);
  const setFormat = useSettingsStore((s) => s.setFormat);
  const replayGainMode = useSettingsStore((s) => s.replayGainMode);
  const setReplayGainMode = useSettingsStore((s) => s.setReplayGainMode);
  const autoScrobble = useSettingsStore((s) => s.autoScrobble);
  const setAutoScrobble = useSettingsStore((s) => s.setAutoScrobble);
  const autoCacheStreamed = useSettingsStore((s) => s.autoCacheStreamed);
  const setAutoCacheStreamed = useSettingsStore((s) => s.setAutoCacheStreamed);
  const maxCacheSizeGB = useSettingsStore((s) => s.maxCacheSizeGB);
  const setMaxCacheSizeGB = useSettingsStore((s) => s.setMaxCacheSizeGB);

  // Form State
  const [showAddForm, setShowAddForm] = useState(profiles.length === 0);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [legacyAuth, setLegacyAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; version?: string } | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl || !username) return;

    setIsSubmitting(true);
    setTestResult(null);

    const success = await addProfile({
      name: serverName || "Navidrome Server",
      url: serverUrl.replace(/\/+$/, ""),
      username,
      password,
      legacyAuth,
    });

    setIsSubmitting(false);

    if (success) {
      setShowAddForm(false);
      setServerName("");
      setServerUrl("");
      setUsername("");
      setPassword("");
    } else {
      setTestResult({ success: false, error: "Impossibile connettersi al server Navidrome. Verifica URL e credenziali." });
    }
  };

  const handleTestActiveConnection = async () => {
    setIsTestingPing(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
    } finally {
      setIsTestingPing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Impostazioni</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configurazione server Navidrome, temi Shadcn, app PWA, qualità audio, equalizzatore e cache
        </p>
      </div>

      {/* Live Server Status Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl shadow-sm space-y-3 transition-all ${
          isConnected && activeProfile && !isOfflineMode
            ? "bg-card border-primary/30 shadow-primary/5"
            : "bg-card border-border"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                isOfflineMode
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : isConnected && activeProfile
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : activeProfile
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {isOfflineMode ? (
                <WifiOff size={20} />
              ) : isConnected && activeProfile ? (
                <ShieldCheck size={20} />
              ) : activeProfile ? (
                <Server size={20} className="text-destructive" />
              ) : (
                <Server size={20} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-sm font-bold text-foreground shrink-0">Stato Connessione:</span>
                {isOfflineMode ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold shrink-0 whitespace-nowrap">
                    Offline Mode
                  </span>
                ) : isConnected && activeProfile ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" /> Connesso a {activeProfile.name}
                  </span>
                ) : activeProfile ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" /> Disconnesso
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-semibold shrink-0 whitespace-nowrap">
                    Nessun server configurato
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {isOfflineMode
                  ? "Riproduzione abilitata solo per i brani e album scaricati in locale"
                  : isConnected && activeProfile
                  ? `Server: ${activeProfile.url} (Utente: ${activeProfile.username})`
                  : activeProfile
                  ? `Impossibile raggiungere ${activeProfile.url}. Verifica che Navidrome sia avviato e raggiungibile.`
                  : "Nessun server Navidrome configurato. Aggiungine uno qui sotto per accedere alla tua musica."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => toggleOfflineMode()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isOfflineMode
                  ? "bg-amber-500 text-black border-amber-400 font-bold shadow-sm"
                  : "bg-secondary hover:bg-secondary/80 text-foreground border-border hover:border-primary/30"
              }`}
            >
              {isOfflineMode ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOfflineMode ? "Torna Online" : "Modalità Offline"}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Server Configuration Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Server size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Server Navidrome <span className="hidden sm:inline font-normal text-muted-foreground">/ Subsonic</span>
            </h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus size={14} className="shrink-0" />
            <span>Aggiungi Server</span>
          </button>
        </div>

        {/* Existing Profiles List */}
        <div className="space-y-2">
          {profiles.length === 0 ? (
            <div className="p-6 rounded-2xl bg-card border border-dashed border-border text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">Nessun server collegato</p>
              <p className="text-xs text-muted-foreground">
                Aggiungi il tuo URL Navidrome per ascoltare tutta la tua libreria personale.
              </p>
            </div>
          ) : (
            profiles.map((p) => {
              const isActive = p.id === activeProfileId;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all border gap-3 ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-card border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        isActive && isConnected ? "bg-primary shadow-xs ring-2 ring-primary/20" : "bg-muted-foreground/40"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {p.name}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary shrink-0 whitespace-nowrap">
                            Attivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        <span className="text-foreground/70 font-semibold">{p.username}</span>
                        <span className="mx-1.5 text-muted-foreground/40">•</span>
                        <span>{p.url.replace(/^https?:\/\//, "")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestActiveConnection();
                        }}
                        disabled={isTestingPing}
                        className="px-2.5 sm:px-3 py-1.5 text-xs rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-semibold cursor-pointer shrink-0 whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {isTestingPing && <Loader2 size={12} className="animate-spin shrink-0" />}
                        <span>Test Ping</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProfile(p.id);
                      }}
                      className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-secondary transition-colors cursor-pointer shrink-0"
                      title="Elimina server"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Test Result Toast */}
        {testResult && (
          <div
            className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-semibold ${
              testResult.success
                ? "bg-primary/15 border border-primary/30 text-primary"
                : "bg-destructive/15 border border-destructive/30 text-destructive"
            }`}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {testResult.success
              ? `Connessione a Navidrome riuscita! (Versione server: ${testResult.version || serverInfo?.version || serverInfo?.serverVersion || "1.16+"})`
              : `Errore di connessione: ${testResult.error}`}
          </div>
        )}

        {/* Add Server Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddServer}
            className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <h3 className="text-sm font-bold text-foreground">Configura Nuovo Server</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nome Profilo</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Es. Navidrome Casa"
                  className="w-full bg-background px-3.5 py-2.5 rounded-xl border border-border text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">URL del Server</label>
                <input
                  type="url"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://musica.tuodominio.com"
                  className="w-full bg-background px-3.5 py-2.5 rounded-xl border border-border text-sm text-foreground focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nome Utente</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-background px-3.5 py-2.5 rounded-xl border border-border text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Password / Token</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background px-3.5 py-2.5 rounded-xl border border-border text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="legacyAuth"
                checked={legacyAuth}
                onChange={(e) => setLegacyAuth(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <label htmlFor="legacyAuth" className="text-xs text-muted-foreground cursor-pointer">
                Usa autenticazione legacy (password in chiaro anziché MD5 salt)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Salva e Connetti
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. Theme & Appearance Section (Shadcn Themes & Light/Dark/OLED) */}
      <ThemeSelector />

      {/* 3. OpenRouter AI Section */}
      <OpenRouterSettingsCard />

      {/* 4. PWA Mobile & Desktop Section */}
      <PwaInstallCard />

      {/* 4. Streaming & Quality Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Radio size={18} />
          </div>
          <h2 className="text-lg font-bold text-foreground">Qualità Audio & Transcodifica</h2>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          {/* Bitrate Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-foreground">Bitrate Massimale di Streaming</h4>
              <p className="text-xs text-muted-foreground">Limita il bitrate per risparmiare traffico dati</p>
            </div>

            <select
              value={bitrate}
              onChange={(e) => setBitrate(parseInt(e.target.value, 10) as BitrateOption)}
              className="bg-background text-xs font-semibold text-foreground px-3.5 py-2 rounded-xl border border-border focus:border-primary focus:outline-none"
            >
              <option value="0">Originale / Lossless (No Transcoding)</option>
              <option value="320">320 kbps (Massima Qualità)</option>
              <option value="256">256 kbps (Ottimale)</option>
              <option value="192">192 kbps (Bilanciato)</option>
              <option value="128">128 kbps (Risparmio Dati)</option>
            </select>
          </div>

          {/* Preferred Format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground">Formato di Transcodifica</h4>
              <p className="text-xs text-muted-foreground">Codec preferito quando la transcodifica è attiva</p>
            </div>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as TranscodingFormat)}
              className="bg-background text-xs font-semibold text-foreground px-3.5 py-2 rounded-xl border border-border focus:border-primary focus:outline-none uppercase"
            >
              <option value="raw">Raw / Automatico</option>
              <option value="mp3">MP3</option>
              <option value="opus">Opus</option>
              <option value="aac">AAC</option>
              <option value="flac">FLAC</option>
            </select>
          </div>

          {/* ReplayGain Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground">ReplayGain (Normalizzazione Volume)</h4>
              <p className="text-xs text-muted-foreground">Livella automaticamente il volume tra brani o album</p>
            </div>

            <select
              value={replayGainMode}
              onChange={(e) => setReplayGainMode(e.target.value as "track" | "album" | "off")}
              className="bg-background text-xs font-semibold text-foreground px-3.5 py-2 rounded-xl border border-border focus:border-primary focus:outline-none"
            >
              <option value="track">Track Gain (Singolo Brano)</option>
              <option value="album">Album Gain (Intero Album)</option>
              <option value="off">Disattivato</option>
            </select>
          </div>

          {/* Auto Scrobble Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground">Scrobble Automatico a Navidrome</h4>
              <p className="text-xs text-muted-foreground">Registra gli ascolti e aggiorna le statistiche su Last.fm / ListenBrainz</p>
            </div>

            <input
              type="checkbox"
              checked={autoScrobble}
              onChange={(e) => setAutoScrobble(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 5. Cache & Storage Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <HardDrive size={18} />
          </div>
          <h2 className="text-lg font-bold text-foreground">Cache Locale & Spazio Offline</h2>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">Smart LRU Cache</h4>
              <p className="text-xs text-muted-foreground">Salva automaticamente i brani ascoltati per riascolto offline immediato</p>
            </div>

            <input
              type="checkbox"
              checked={autoCacheStreamed}
              onChange={(e) => setAutoCacheStreamed(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground">Dimensione Massima Cache</h4>
              <p className="text-xs text-muted-foreground">I brani più vecchi verranno eliminati al raggiungimento della quota</p>
            </div>

            <select
              value={maxCacheSizeGB}
              onChange={(e) => setMaxCacheSizeGB(parseInt(e.target.value, 10))}
              className="bg-background text-xs font-semibold text-foreground px-3.5 py-2 rounded-xl border border-border focus:border-primary focus:outline-none"
            >
              <option value="1">1 GB</option>
              <option value="2">2 GB (Consigliato)</option>
              <option value="5">5 GB</option>
              <option value="10">10 GB</option>
              <option value="20">20 GB</option>
            </select>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              onClick={async () => {
                if (confirm("Vuoi cancellare tutta la musica scaricata in locale?")) {
                  await clearAllDownloads();
                  alert("Cache svuotata con successo!");
                }
              }}
              className="px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold border border-destructive/20 transition-colors cursor-pointer"
            >
              Cancella Tutti i Dati Locali
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
