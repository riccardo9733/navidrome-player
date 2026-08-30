import { Song } from "../subsonic/types";

export interface FastModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export const OPENROUTER_FAST_MODELS: FastModelOption[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    badge: "Consigliato",
    description: "Ultra-veloce, conoscenza musicale profonda e risposte JSON impeccabili.",
  },
  {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash Lite",
    badge: "Istantaneo",
    description: "La latenza più bassa in assoluto per risposte in <300ms.",
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    badge: "Leggerissimo",
    description: "Modello compatto ad altissimo throughput.",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    badge: "Popolare",
    description: "Ottimo bilanciamento tra accuratezza e velocità.",
  },
  {
    id: "anthropic/claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    badge: "Creativo",
    description: "Scrittura raffinata, perfetto per aneddoti e sfumature musicali.",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    badge: "Economico",
    description: "Grande capacità di ragionamento a costi minimi.",
  },
];

export interface TrackTriviaResult {
  trivia: string[];
  artistBioSnippet?: string;
}

export interface SimilarSongRecommendation {
  title: string;
  artist: string;
  reason: string;
  matchScore?: number;
}

interface OpenRouterRequestOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  responseFormatJson?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Resilient JSON parsing helper that handles Markdown code fences,
 * unescaped quotes, trailing commas, and boundary extractions.
 */
function cleanAndParseJson<T>(raw: string): T | null {
  if (!raw || typeof raw !== "string") return null;

  let cleaned = raw.trim();

  // 1. Remove markdown fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 2. Try direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // continue to heuristics
  }

  // 3. Extract substring between first '{' and last '}' or first '[' and last ']'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  let candidate = cleaned;
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidate = cleaned.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket > firstBracket) {
    candidate = cleaned.substring(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // continue
  }

  // 4. Remove trailing commas before } or ]
  try {
    const withoutTrailingCommas = candidate.replace(/,\s*([\]}])/g, "$1");
    return JSON.parse(withoutTrailingCommas) as T;
  } catch {
    // continue
  }

  return null;
}

/**
 * Core raw fetcher for OpenRouter completions
 */
async function callOpenRouter({
  apiKey,
  model,
  baseUrl = "https://openrouter.ai/api/v1",
  messages,
  responseFormatJson = false,
  maxTokens = 800,
  temperature = 0.7,
}: OpenRouterRequestOptions): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Chiave API OpenRouter non configurata. Inseriscila nelle Impostazioni.");
  }

  const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const bodyPayload: Record<string, unknown> = {
    model: model?.trim() || "google/gemini-2.5-flash",
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  if (responseFormatJson) {
    bodyPayload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for larger models

  try {
    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://navidrome-player.app",
        "X-Title": "Navidrome Player",
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    // If failed with response_format unsupported error, retry without response_format
    if (!res.ok && responseFormatJson && (res.status === 400 || res.status === 422)) {
      const retryPayload = { ...bodyPayload };
      delete retryPayload.response_format;
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://navidrome-player.app",
          "X-Title": "Navidrome Player",
        },
        body: JSON.stringify(retryPayload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `Errore OpenRouter (${res.status} ${res.statusText})`;
      try {
        const errorData = await res.json();
        if (errorData?.error?.message) {
          errMsg = errorData.error.message;
        }
      } catch {
        // use default message
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    const choice = data?.choices?.[0];

    let content = "";
    if (typeof choice?.message?.content === "string") {
      content = choice.message.content;
    } else if (Array.isArray(choice?.message?.content)) {
      content = choice.message.content
        .map((p: { text?: string; content?: string }) => p.text || p.content || "")
        .join("");
    } else if (typeof choice?.text === "string") {
      content = choice.text;
    }

    // If content is empty but reasoning tokens exist (e.g. reasoning models)
    if (!content.trim() && typeof choice?.message?.reasoning === "string") {
      content = choice.message.reasoning;
    }

    if (!content || !content.trim()) {
      throw new Error(`Nessuna risposta ricevuta dal modello '${model}'. Assicurati che il modello sia attivo su OpenRouter.`);
    }

    return content.trim();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Richiesta scaduta (timeout). Verifica la connessione.");
      }
      throw err;
    }
    throw new Error(String(err));
  }
}

/**
 * Test OpenRouter API Key and model availability
 */
export async function testOpenRouterConnection(
  apiKey: string,
  model: string,
  baseUrl?: string
): Promise<{ success: boolean; error?: string; latencyMs?: number }> {
  const startTime = Date.now();
  try {
    const reply = await callOpenRouter({
      apiKey,
      model,
      baseUrl,
      messages: [
        {
          role: "user",
          content: "Sei online? Rispondi brevemente con OK.",
        },
      ],
      maxTokens: 200, // Safe for reasoning models (e.g. gpt-oss-120b)
      temperature: 0.2,
    });

    const latencyMs = Date.now() - startTime;
    if (reply.length > 0) {
      return { success: true, latencyMs };
    }
    return { success: true, latencyMs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Errore di connessione a OpenRouter",
    };
  }
}

/**
 * Feature 1: Behind the Track (Micro-Trivia)
 */
export async function fetchTrackTrivia(params: {
  song: Song;
  apiKey: string;
  model: string;
  baseUrl?: string;
}): Promise<TrackTriviaResult> {
  const { song, apiKey, model, baseUrl } = params;

  const prompt = `Analizza sinteticamente questo brano musicale:
Titolo: "${song.title}"
Artista: "${song.artist}"
${song.album ? `Album: "${song.album}"` : ""}
${song.year ? `Anno: ${song.year}` : ""}
${song.genre ? `Genere: ${song.genre}` : ""}

Fornisci esattamente 2 chicche o curiosità brevi, intriganti e storicamente accurate su questa canzone (es. sample usati, aneddoti in studio, significato profondo o contesto storico) e un sintetico motto sull'artista.

REGOLE FONDAMENTALI:
- Scrivi TUTTO il contenuto ESCLUSIVAMENTE in lingua ITALIANA (non usare l'inglese).
- Rispondi RIGOROSAMENTE in formato JSON valido con questa struttura:
{
  "trivia": [
    "Prima curiosità in italiano (1-2 frasi chiare e coinvolgenti)",
    "Seconda curiosità in italiano (1-2 frasi chiare e coinvolgenti)"
  ],
  "artistBioSnippet": "Breve sintesi in italiano di 1 riga sull'impatto o stile dell'artista"
}`;

  const rawJson = await callOpenRouter({
    apiKey,
    model,
    baseUrl,
    messages: [
      {
        role: "system",
        content: "Sei un enciclopedico musicologo italiano. Rispondi SEMPRE ed ESCLUSIVAMENTE in lingua ITALIANA in formato JSON valido.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    responseFormatJson: true,
    maxTokens: 500,
    temperature: 0.7,
  });

  const parsed = cleanAndParseJson<{ trivia?: string[]; artistBioSnippet?: string }>(rawJson);

  if (parsed && Array.isArray(parsed.trivia) && parsed.trivia.length > 0) {
    return {
      trivia: parsed.trivia.slice(0, 3),
      artistBioSnippet: parsed.artistBioSnippet || undefined,
    };
  }

  // Fallback line parsing
  const cleanLines = rawJson
    .replace(/```(?:json)?/gi, "")
    .replace(/[{}\[\]"]/g, "")
    .split("\n")
    .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ""))
    .filter((l) => l.length > 15 && !l.includes("trivia") && !l.includes("artistBioSnippet"));

  return {
    trivia: cleanLines.length > 0 ? cleanLines.slice(0, 2) : ["Curiosità non disponibile al momento per questo brano."],
  };
}

/**
 * Feature 2: Similar Songs Discovery
 */
export async function fetchSimilarSongs(params: {
  song: Song;
  apiKey: string;
  model: string;
  baseUrl?: string;
}): Promise<SimilarSongRecommendation[]> {
  const { song, apiKey, model, baseUrl } = params;

  const prompt = `Consiglia 4 o 5 brani del panorama musicale mondiale (famose o gemme nascoste) con un vibe, energia e stile affini a:
Titolo: "${song.title}"
Artista: "${song.artist}"
${song.genre ? `Genere: ${song.genre}` : ""}
${song.year ? `Anno: ${song.year}` : ""}

Non consigliare brani dello stesso artista ("${song.artist}").

REGOLE FONDAMENTALI:
- Il campo "reason" (motivo del consiglio) DEVE essere scritto ESCLUSIVAMENTE in lingua ITALIANA.
- Rispondi RIGOROSAMENTE in formato JSON valido con questa struttura:
{
  "recommendations": [
    {
      "title": "Titolo Brano",
      "artist": "Nome Artista",
      "reason": "1 frase in italiano che spiega l'affinità (es. Stesso groove funk trascinante e linea di basso anni 80)"
    }
  ]
}`;

  const rawJson = await callOpenRouter({
    apiKey,
    model,
    baseUrl,
    messages: [
      {
        role: "system",
        content: "Sei un raffinato DJ e curatore musicale italiano. Rispondi SEMPRE ed ESCLUSIVAMENTE in lingua ITALIANA in formato JSON valido.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    responseFormatJson: true,
    maxTokens: 700,
    temperature: 0.7,
  });

  const parsed = cleanAndParseJson<{ recommendations?: Array<{ title?: string; artist?: string; reason?: string }> }>(rawJson);

  if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
    return parsed.recommendations.map((r) => ({
      title: r.title || "Brano consigliato",
      artist: r.artist || "Artista",
      reason: r.reason || "Vibe e stile perfettamente compatibili",
    }));
  }

  // Regex fallback: extract any objects or pairs of title/artist/reason
  const results: SimilarSongRecommendation[] = [];
  const regex = /(?:["']?title["']?\s*:\s*["']([^"']+)["'])[\s\S]*?(?:["']?artist["']?\s*:\s*["']([^"']+)["'])[\s\S]*?(?:["']?reason["']?\s*:\s*["']([^"']+)["'])/gi;
  let match;
  while ((match = regex.exec(rawJson)) !== null && results.length < 5) {
    results.push({
      title: match[1].trim(),
      artist: match[2].trim(),
      reason: match[3].trim(),
    });
  }

  if (results.length > 0) {
    return results;
  }

  // Last-resort text line parsing (e.g. 1. "Song" by Artist - Reason)
  const lineRegex = /(?:^\d+[\.\)]\s*|\-\s*)["“]?([^"”\n\-]+)["”?]?\s+(?:-|by|di)\s+([^:\-\n]+)(?::\s*|\s*-\s*)(.+)$/gm;
  let lineMatch;
  while ((lineMatch = lineRegex.exec(rawJson)) !== null && results.length < 5) {
    results.push({
      title: lineMatch[1].trim(),
      artist: lineMatch[2].trim(),
      reason: lineMatch[3].trim(),
    });
  }

  return results;
}

/**
 * Feature 3: Smart Queue / Vibe Next from local candidate library tracks
 */
export async function recommendNextTracks(params: {
  currentTrack: Song;
  recentTracks?: Song[];
  candidates: Song[];
  apiKey: string;
  model: string;
  baseUrl?: string;
}): Promise<Song[]> {
  const { currentTrack, recentTracks = [], candidates, apiKey, model, baseUrl } = params;

  if (candidates.length === 0) return [];

  // Create a lightweight list of candidate items
  const compactCandidates = candidates.slice(0, 40).map((c) => ({
    id: c.id,
    title: c.title,
    artist: c.artist,
    genre: c.genre || "",
  }));

  const prompt = `Traccia attualmente in ascolto: "${currentTrack.title}" di "${currentTrack.artist}" (${currentTrack.genre || "Genere vario"}).
${recentTracks.length > 0 ? `Brani recenti: ${recentTracks.map((r) => `"${r.title}" - ${r.artist}`).join(", ")}` : ""}

Scegli esattamente tra 3 e 5 brani dal seguente elenco di candidati che garantiscono la migliore continuità di atmosfera/ritmo:
${JSON.stringify(compactCandidates)}

Rispondi in formato JSON:
{
  "selectedIds": ["id1", "id2", "id3"]
}`;

  const rawJson = await callOpenRouter({
    apiKey,
    model,
    baseUrl,
    messages: [
      {
        role: "system",
        content: "Sei un DJ professionista esperto in transizioni armoniche. Rispondi solo con JSON valido.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    responseFormatJson: true,
    maxTokens: 250,
    temperature: 0.3,
  });

  const parsed = cleanAndParseJson<{ selectedIds?: string[] }>(rawJson);
  let selectedIds: string[] = [];

  if (parsed && Array.isArray(parsed.selectedIds)) {
    selectedIds = parsed.selectedIds;
  } else {
    // Extract any matching candidate IDs by regex
    const candidateIdSet = new Set(candidates.map((c) => c.id));
    const words = rawJson.match(/[a-zA-Z0-9_-]{3,}/g) || [];
    selectedIds = words.filter((w) => candidateIdSet.has(w));
  }

  // Map back to full Song objects in chosen order
  const songMap = new Map<string, Song>(candidates.map((c) => [c.id, c]));
  const result: Song[] = [];

  for (const id of selectedIds) {
    const song = songMap.get(id);
    if (song && !result.some((s) => s.id === song.id)) {
      result.push(song);
    }
  }

  // Fallback if none matched
  if (result.length === 0) {
    return candidates.slice(0, 3);
  }

  return result.slice(0, 5);
}
