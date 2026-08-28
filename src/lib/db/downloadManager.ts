import { db, CachedTrackRecord } from "./dexie";
import { Album, Playlist, Song } from "../subsonic/types";
import { subsonicClient } from "../subsonic/client";

// In-memory cache for generated object URLs to prevent memory leaks and redundant revokes
const blobUrlMap = new Map<string, string>();

export async function getLocalBlobUrl(songId: string): Promise<string | null> {
  if (blobUrlMap.has(songId)) {
    return blobUrlMap.get(songId)!;
  }

  const record = await db.cachedTracks.get(songId);
  if (record && record.audioBlob) {
    const url = URL.createObjectURL(record.audioBlob);
    blobUrlMap.set(songId, url);
    return url;
  }

  return null;
}

export async function isTrackDownloaded(songId: string): Promise<boolean> {
  const count = await db.cachedTracks.where("id").equals(songId).count();
  return count > 0;
}

export async function downloadTrack(
  song: Song,
  isExplicit = true,
  onProgress?: (percent: number) => void
): Promise<CachedTrackRecord> {
  // Check if already in DB
  const existing = await db.cachedTracks.get(song.id);
  if (existing && existing.audioBlob) {
    if (isExplicit && !existing.isExplicitDownload) {
      await db.cachedTracks.update(song.id, { isExplicitDownload: true });
    }
    return existing;
  }

  const streamUrl = song.path && (song.path.startsWith("http://") || song.path.startsWith("https://"))
    ? song.path
    : subsonicClient.getStreamUrl(song.id);

  const res = await fetch(streamUrl);
  if (!res.ok) {
    throw new Error(`Failed to download audio file: ${res.statusText}`);
  }

  const totalBytes = Number(res.headers.get("content-length")) || song.size || 0;
  let receivedBytes = 0;

  const audioBlob = await res.blob();
  if (onProgress) onProgress(100);

  // Also fetch and cache cover art blob if available (optimized 300x300 quality)
  let coverBlob: Blob | undefined;
  if (song.coverArt) {
    try {
      const coverUrl = subsonicClient.getCoverArtUrl(song.coverArt, 300);
      const coverRes = await fetch(coverUrl);
      if (coverRes.ok) {
        coverBlob = await coverRes.blob();

        // Also store in Cache Storage so SW / browser can serve it offline transparently
        if (typeof window !== "undefined" && "caches" in window) {
          try {
            const cache = await caches.open("navidrome-covers-v2");
            const responseClone = new Response(coverBlob.slice(), {
              headers: {
                "Content-Type": coverBlob.type || "image/jpeg",
                "Cache-Control": "public, max-age=31536000",
              },
            });
            await cache.put(coverUrl, responseClone.clone());
            if (song.coverArt) {
              await cache.put(`/cover-art/${encodeURIComponent(song.coverArt)}`, responseClone);
            }
          } catch {
            // Ignore Cache Storage failure
          }
        }
      }
    } catch {
      // Cover art download is optional
    }
  }

  const record: CachedTrackRecord = {
    id: song.id,
    song: { ...song, isDownloaded: true },
    audioBlob,
    coverBlob,
    size: audioBlob.size,
    downloadedAt: Date.now(),
    lastPlayedAt: Date.now(),
    isExplicitDownload: isExplicit,
  };

  await db.cachedTracks.put(record);

  // Sync album metadata in cachedAlbums
  if (song.albumId || song.album) {
    const albumKey = song.albumId || song.album || "";
    try {
      const existingAlbum = await db.cachedAlbums.get(albumKey);
      if (existingAlbum) {
        const existingSongs = existingAlbum.album.song || [];
        if (!existingSongs.some((s) => s.id === song.id)) {
          existingAlbum.album.song = [...existingSongs, { ...song, isDownloaded: true }];
          existingAlbum.album.songCount = existingAlbum.album.song.length;
          await db.cachedAlbums.put(existingAlbum);
        }
      } else {
        await db.cachedAlbums.put({
          id: albumKey,
          album: {
            id: albumKey,
            name: song.album || "Album Sconosciuto",
            title: song.album || "Album Sconosciuto",
            artist: song.artist || "Artista Sconosciuto",
            artistId: song.artistId,
            coverArt: song.coverArt,
            songCount: 1,
            duration: song.duration || 0,
            year: song.year,
            genre: song.genre,
            song: [{ ...song, isDownloaded: true }],
          },
          downloadedAt: Date.now(),
        });
      }
    } catch (e) {
      console.warn("Failed to sync cached album record:", e);
    }
  }

  if (onProgress) onProgress(100);
  return record;
}

export async function downloadAlbum(
  album: Album,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  let targetAlbum = album;
  let songs = album.song || [];

  if (songs.length === 0 && album.id) {
    try {
      const fullAlbum = await subsonicClient.getAlbum(album.id);
      if (fullAlbum && fullAlbum.song) {
        targetAlbum = fullAlbum;
        songs = fullAlbum.song;
      }
    } catch (e) {
      console.warn("Failed to fetch full album for download:", e);
    }
  }

  let done = 0;
  for (const song of songs) {
    await downloadTrack(song, true);
    done++;
    if (onProgress && songs.length > 0) onProgress(done, songs.length);
  }

  await db.cachedAlbums.put({
    id: targetAlbum.id,
    album: {
      ...targetAlbum,
      song: songs.map((s) => ({ ...s, isDownloaded: true })),
    },
    downloadedAt: Date.now(),
  });
}

export async function downloadPlaylist(
  playlist: Playlist,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  let targetPlaylist = playlist;
  let songs = playlist.entry || [];

  if (songs.length === 0 && playlist.id) {
    try {
      const fullPlaylist = await subsonicClient.getPlaylist(playlist.id);
      if (fullPlaylist && fullPlaylist.entry) {
        targetPlaylist = fullPlaylist;
        songs = fullPlaylist.entry;
      }
    } catch (e) {
      console.warn("Failed to fetch full playlist for download:", e);
    }
  }

  let done = 0;
  for (const song of songs) {
    await downloadTrack(song, true);
    done++;
    if (onProgress && songs.length > 0) onProgress(done, songs.length);
  }

  await db.cachedPlaylists.put({
    id: targetPlaylist.id,
    playlist: {
      ...targetPlaylist,
      entry: songs.map((s) => ({ ...s, isDownloaded: true })),
    },
    downloadedAt: Date.now(),
  });
}

export async function deleteDownloadedTrack(songId: string): Promise<void> {
  if (blobUrlMap.has(songId)) {
    URL.revokeObjectURL(blobUrlMap.get(songId)!);
    blobUrlMap.delete(songId);
  }
  await db.cachedTracks.delete(songId);
}

export async function deleteDownloadedAlbum(albumId: string): Promise<void> {
  const record = await db.cachedAlbums.get(albumId);
  if (record && record.album.song) {
    for (const s of record.album.song) {
      await deleteDownloadedTrack(s.id);
    }
  }
  await db.cachedAlbums.delete(albumId);
}

export async function getAllDownloadedTracks(): Promise<CachedTrackRecord[]> {
  return await db.cachedTracks.toArray();
}

export async function getStorageStats(): Promise<{ totalBytes: number; trackCount: number }> {
  const tracks = await db.cachedTracks.toArray();
  const totalBytes = tracks.reduce((acc, t) => acc + (t.size || 0), 0);
  return {
    totalBytes,
    trackCount: tracks.length,
  };
}

export async function clearAllDownloads(): Promise<void> {
  blobUrlMap.forEach((url) => URL.revokeObjectURL(url));
  blobUrlMap.clear();
  await db.cachedTracks.clear();
  await db.cachedAlbums.clear();
  await db.cachedPlaylists.clear();
}
