"use client";

import { useState } from "react";
import {
  Server,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Sliders,
  HardDrive,
  ShieldCheck,
  Radio,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { BitrateOption, TranscodingFormat } from "../../lib/subsonic/types";
import { clearAllDownloads } from "../../lib/db/downloadManager";

export default function SettingsPage() {
  const profiles = useAuthStore((s) => s.profiles);
  const activeProfileId = useAuthStore((s) => s.activeProfileId);
  const addProfile = useAuthStore((s) => s.addProfile);
  const removeProfile = useAuthStore((s) => s.removeProfile);
  const setActiveProfile = useAuthStore((s) => s.setActiveProfile);
  const testConnection = useAuthStore((s) => s.testConnection);
  const isConnected = useAuthStore((s) => s.isConnected);
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
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null);

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
    <div className="space-y-10 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Impostazioni</h1>
        <p className="text-xs text-zinc-400">Configurazione server Navidrome, qualità audio, equalizzatore e cache</p>
      </div>

      {/* 1. Server Configuration Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server size={20} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Server Navidrome / Subsonic</h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Plus size={14} /> Aggiungi Server
          </button>
        </div>

        {/* Existing Profiles List */}
        <div className="space-y-2">
          {profiles.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-300">Nessun server collegato (Modalità Demo Attiva)</p>
              <p className="text-xs text-zinc-500">
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
                      ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                      : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isActive && isConnected ? "bg-emerald-500 shadow-md shadow-emerald-500/50" : "bg-zinc-600"
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {p.name}
                        {isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                            Attivo
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
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
                        className="px-3 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        Test Ping
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProfile(p.id);
                      }}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
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
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/15 border border-red-500/30 text-red-400"
            }`}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {testResult.success
              ? `Connessione a Navidrome riuscita! (Versione server: ${serverInfo?.version || "1.16+"})`
              : `Errore di connessione: ${testResult.error}`}
          </div>
        )}

        {/* Add Server Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddServer}
            className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <h3 className="text-sm font-bold text-white">Configura Nuovo Server</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Nome Profilo</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Es. Navidrome Casa"
                  className="w-full bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">URL del Server</label>
                <input
                  type="url"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://musica.tuodominio.com"
                  className="w-full bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Nome Utente</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Password / Token</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="legacyAuth"
                checked={legacyAuth}
                onChange={(e) => setLegacyAuth(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="legacyAuth" className="text-xs text-zinc-400 cursor-pointer">
                Usa autenticazione legacy (password in chiaro anziché MD5 salt)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Salva e Connetti
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. Streaming & Quality Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Radio size={20} className="text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Qualità Audio & Transcodifica</h2>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          {/* Bitrate Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-white">Bitrate Massimale di Streaming</h4>
              <p className="text-xs text-zinc-400">Limita il bitrate per risparmiare traffico dati</p>
            </div>

            <select
              value={bitrate}
              onChange={(e) => setBitrate(parseInt(e.target.value, 10) as BitrateOption)}
              className="bg-zinc-950 text-xs font-semibold text-white px-3.5 py-2 rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="0">Originale / Lossless (No Transcoding)</option>
              <option value="320">320 kbps (Massima Qualità)</option>
              <option value="256">256 kbps (Ottimale)</option>
              <option value="192">192 kbps (Bilanciato)</option>
              <option value="128">128 kbps (Risparmio Dati)</option>
            </select>
          </div>

          {/* Preferred Format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-zinc-800/60">
            <div>
              <h4 className="text-sm font-bold text-white">Formato di Transcodifica</h4>
              <p className="text-xs text-zinc-400">Codec preferito quando la transcodifica è attiva</p>
            </div>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as TranscodingFormat)}
              className="bg-zinc-950 text-xs font-semibold text-white px-3.5 py-2 rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none uppercase"
            >
              <option value="raw">Raw / Automatico</option>
              <option value="mp3">MP3</option>
              <option value="opus">Opus</option>
              <option value="aac">AAC</option>
              <option value="flac">FLAC</option>
            </select>
          </div>

          {/* ReplayGain Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-zinc-800/60">
            <div>
              <h4 className="text-sm font-bold text-white">ReplayGain (Normalizzazione Volume)</h4>
              <p className="text-xs text-zinc-400">Livella automaticamente il volume tra brani o album</p>
            </div>

            <select
              value={replayGainMode}
              onChange={(e) => setReplayGainMode(e.target.value as "track" | "album" | "off")}
              className="bg-zinc-950 text-xs font-semibold text-white px-3.5 py-2 rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="track">Track Gain (Singolo Brano)</option>
              <option value="album">Album Gain (Intero Album)</option>
              <option value="off">Disattivato</option>
            </select>
          </div>

          {/* Auto Scrobble Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60">
            <div>
              <h4 className="text-sm font-bold text-white">Scrobble Automatico a Navidrome</h4>
              <p className="text-xs text-zinc-400">Registra gli ascolti e aggiorna le statistiche su Last.fm / ListenBrainz</p>
            </div>

            <input
              type="checkbox"
              checked={autoScrobble}
              onChange={(e) => setAutoScrobble(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 3. Cache & Storage Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <HardDrive size={20} className="text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Cache Locale & Spazio Offline</h2>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Smart LRU Cache</h4>
              <p className="text-xs text-zinc-400">Salva automaticamente i brani ascoltati per riascolto offline immediato</p>
            </div>

            <input
              type="checkbox"
              checked={autoCacheStreamed}
              onChange={(e) => setAutoCacheStreamed(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-zinc-800/60">
            <div>
              <h4 className="text-sm font-bold text-white">Dimensione Massima Cache</h4>
              <p className="text-xs text-zinc-400">I brani più vecchi verranno eliminati al raggiungimento della quota</p>
            </div>

            <select
              value={maxCacheSizeGB}
              onChange={(e) => setMaxCacheSizeGB(parseInt(e.target.value, 10))}
              className="bg-zinc-950 text-xs font-semibold text-white px-3.5 py-2 rounded-xl border border-zinc-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="1">1 GB</option>
              <option value="2">2 GB (Consigliato)</option>
              <option value="5">5 GB</option>
              <option value="10">10 GB</option>
              <option value="20">20 GB</option>
            </select>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800/60">
            <button
              onClick={async () => {
                if (confirm("Vuoi cancellare tutta la musica scaricata in locale?")) {
                  await clearAllDownloads();
                  alert("Cache svuotata con successo!");
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
            >
              Cancella Tutti i Dati Locali
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
