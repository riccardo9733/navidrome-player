import { db } from "./dexie";
import { Song } from "../subsonic/types";
import { downloadTrack } from "./downloadManager";

export async function touchTrackPlayed(songId: string): Promise<void> {
  const existing = await db.cachedTracks.get(songId);
  if (existing) {
    await db.cachedTracks.update(songId, { lastPlayedAt: Date.now() });
  }
}

export async function autoCacheTrack(song: Song, maxCacheBytes: number): Promise<void> {
  if (maxCacheBytes <= 0) return;

  try {
    // 1. Download/Cache the song in background if not already cached
    const existing = await db.cachedTracks.get(song.id);
    if (!existing) {
      await downloadTrack(song, false); // isExplicit = false
    } else {
      await db.cachedTracks.update(song.id, { lastPlayedAt: Date.now() });
    }

    // 2. Enforce LRU limit on non-explicit (auto-cached) tracks
    const allAutoCached = await db.cachedTracks
      .filter((t) => !t.isExplicitDownload)
      .toArray();

    const currentAutoBytes = allAutoCached.reduce((acc, t) => acc + (t.size || 0), 0);

    if (currentAutoBytes > maxCacheBytes) {
      // Sort oldest played first
      allAutoCached.sort((a, b) => (a.lastPlayedAt || 0) - (b.lastPlayedAt || 0));

      let excessBytes = currentAutoBytes - maxCacheBytes;
      for (const track of allAutoCached) {
        if (excessBytes <= 0) break;
        await db.cachedTracks.delete(track.id);
        excessBytes -= track.size || 0;
      }
    }
  } catch (err) {
    console.warn("[LRUCache] Auto-cache failed:", err);
  }
}
