import { LyricsLine } from "../subsonic/types";

export function parseLRC(lrcText: string): LyricsLine[] {
  if (!lrcText) return [];

  const lines = lrcText.split("\n");
  const result: LyricsLine[] = [];

  // Match patterns like [01:23.45] or [01:23.456] or [01:23]
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for ID tags like [ti:Title], [ar:Artist]
    if (/^\[(ti|ar|al|by|offset|length):.*\]$/i.test(trimmed)) {
      continue;
    }

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length === 0) continue;

    const text = trimmed.replace(timeRegex, "").trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      const totalSeconds = minutes * 60 + seconds + fraction;

      result.push({
        time: totalSeconds,
        text: text || "♪",
      });
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);

  return result;
}

export function findActiveLyricIndex(lyrics: LyricsLine[], currentTime: number): number {
  if (!lyrics.length) return -1;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time - 0.2) {
      return i;
    }
  }

  return 0;
}
