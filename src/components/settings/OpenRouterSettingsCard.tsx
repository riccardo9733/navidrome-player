"use client";

import { useState } from "react";
import { Sparkles, Key, Cpu, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink, Zap } from "lucide-react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { testOpenRouterConnection } from "../../lib/ai/openRouterClient";

const SUGGESTED_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-lite-001",
  "meta-llama/llama-3.2-3b-instruct",
  "openai/gpt-4o-mini",
  "anthropic/claude-3-5-haiku",
  "deepseek/deepseek-chat",
];

export function OpenRouterSettingsCard() {
  const openRouterApiKey = useSettingsStore((s) => s.openRouterApiKey);
  const setOpenRouterApiKey = useSettingsStore((s) => s.setOpenRouterApiKey);
  const openRouterModel = useSettingsStore((s) => s.openRouterModel);
  const setOpenRouterModel = useSettingsStore((s) => s.setOpenRouterModel);
  const openRouterBaseUrl = useSettingsStore((s) => s.openRouterBaseUrl);
  const setOpenRouterBaseUrl = useSettingsStore((s) => s.setOpenRouterBaseUrl);

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; error?: string; latencyMs?: number } | null>(null);

  const handleTest = async () => {
    if (!openRouterApiKey.trim()) {
      setTestStatus({ success: false, error: "Inserisci prima una chiave API OpenRouter." });
      return;
    }

    if (!openRouterModel.trim()) {
      setTestStatus({ success: false, error: "Inserisci il codice del modello (es. google/gemini-2.5-flash)." });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await testOpenRouterConnection(openRouterApiKey, openRouterModel, openRouterBaseUrl);
      setTestStatus(res);
    } catch (err: unknown) {
      setTestStatus({
        success: false,
        error: err instanceof Error ? err.message : "Errore imprevisto durante il test",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="space-y-4 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Intelligenza Artificiale (OpenRouter)
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Ultra Fast
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Alimenta le Micro-Curiosità sul brano, la scoperta di Brani Simili e l&apos;Auto-DJ Vibe
            </p>
          </div>
        </div>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all cursor-pointer shrink-0"
        >
          <Key size={13} className="text-muted-foreground" />
          <span>Ottieni Chiave</span>
          <ExternalLink size={12} className="text-muted-foreground" />
        </a>
      </div>

      {/* Main Settings Box */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        {/* 1. API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Key size={14} className="text-primary" />
              OpenRouter API Key
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {openRouterApiKey ? "Salvata in locale" : "Nessuna chiave inserita"}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type={showApiKey ? "text" : "password"}
              value={openRouterApiKey}
              onChange={(e) => {
                setOpenRouterApiKey(e.target.value);
                if (testStatus) setTestStatus(null);
              }}
              placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-background px-3.5 py-2.5 pr-20 rounded-xl border border-border text-xs sm:text-sm font-mono text-foreground focus:border-primary focus:outline-none transition-colors"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                title={showApiKey ? "Nascondi chiave" : "Mostra chiave"}
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            La tua chiave API viene salvata solo nel browser locale e usata unicamente per le tue richieste dirette a OpenRouter.
          </p>
        </div>

        {/* 2. Model Code Input */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Cpu size={14} className="text-primary" />
              Codice Modello OpenRouter
            </label>

            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              <span>Catalogo Modelli OpenRouter</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={openRouterModel}
              onChange={(e) => {
                setOpenRouterModel(e.target.value);
                if (testStatus) setTestStatus(null);
              }}
              placeholder="es. google/gemini-2.5-flash"
              className="w-full bg-background px-3.5 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-mono text-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground">
              Incolla il codice/identificativo di qualsiasi modello disponibile su OpenRouter (es. <code className="font-mono text-foreground font-semibold">google/gemini-2.5-flash</code> o <code className="font-mono text-foreground font-semibold">meta-llama/llama-3.2-3b-instruct</code>).
            </p>

            {/* Quick Suggester Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Suggerimenti rapidi:</span>
              {SUGGESTED_MODELS.map((modelId) => {
                const isActive = openRouterModel === modelId;
                return (
                  <button
                    key={modelId}
                    type="button"
                    onClick={() => {
                      setOpenRouterModel(modelId);
                      if (testStatus) setTestStatus(null);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                        : "bg-secondary text-muted-foreground hover:text-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {modelId.split("/")[1] || modelId}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Base URL (Advanced / Optional) */}
        <details className="group pt-2 border-t border-border">
          <summary className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer list-none flex items-center justify-between py-1">
            <span>Opzioni avanzate (Endpoint Base URL)</span>
            <span className="text-[10px] text-primary group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="pt-3 space-y-1">
            <input
              type="url"
              value={openRouterBaseUrl}
              onChange={(e) => setOpenRouterBaseUrl(e.target.value)}
              placeholder="https://openrouter.ai/api/v1"
              className="w-full bg-background px-3.5 py-2 rounded-xl border border-border text-xs font-mono text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </details>

        {/* 4. Test Connection Button & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="min-w-0 flex-1">
            {testStatus && (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${
                  testStatus.success
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "bg-destructive/15 text-destructive border border-destructive/20"
                }`}
              >
                {testStatus.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="truncate">
                  {testStatus.success
                    ? `OpenRouter operativo con '${openRouterModel}'! Risposta in ${testStatus.latencyMs ?? "<500"}ms.`
                    : `Errore: ${testStatus.error}`}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !openRouterApiKey.trim() || !openRouterModel.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>Test Connessione AI</span>
          </button>
        </div>
      </div>
    </section>
  );
}
