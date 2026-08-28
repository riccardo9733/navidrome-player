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
    setTestResult(null);
    const res = await testConnection();
    setTestResult(res);
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
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border backdrop-blur-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isOfflineMode
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : isConnected && activeProfile
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : activeProfile
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : "bg-primary/10 text-primary border border-primary/20"
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

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Stato Connessione:</span>
                {isOfflineMode ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold">
                    Offline Mode
                  </span>
                ) : isConnected && activeProfile ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connesso a {activeProfile.name}
                  </span>
                ) : activeProfile ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Disconnesso / Non raggiungibile
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-semibold">
                    Nessun server configurato
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => toggleOfflineMode()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isOfflineMode
                  ? "bg-amber-500 text-black border-amber-400 font-bold shadow-sm"
                  : "bg-secondary hover:bg-secondary/80 text-foreground border-border"
              }`}
            >
              {isOfflineMode ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOfflineMode ? "Torna Online" : "Modalità Offline"}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Theme & Appearance Section (Shadcn Themes & Light/Dark/OLED) */}
      <ThemeSelector />

      {/* 2. Server Configuration Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Server size={18} />
            </div>
            <h2 className="text-lg font-bold text-foreground">Server Navidrome / Subsonic</h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus size={14} /> Aggiungi Server
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
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20"
                      : "bg-card border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isActive && isConnected ? "bg-emerald-500 shadow-sm" : "bg-muted-foreground/40"
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {p.name}
                        {isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Attivo
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {p.url} ({p.username})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestActiveConnection();
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border font-medium cursor-pointer"
                      >
                        Test Ping
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProfile(p.id);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors cursor-pointer"
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
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
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

      {/* 3. PWA Mobile & Desktop Section */}
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
