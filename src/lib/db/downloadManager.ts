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

  // Also fetch and cache cover art blob if available
  let coverBlob: Blob | undefined;
  if (song.coverArt) {
    try {
      const coverUrl = subsonicClient.getCoverArtUrl(song.coverArt, 500);
      const coverRes = await fetch(coverUrl);
      if (coverRes.ok) {
        coverBlob = await coverRes.blob();
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

  if (onProgress) onProgress(100);
  return record;
}

export async function downloadAlbum(
  album: Album,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const songs = album.song || [];
  let done = 0;

  for (const song of songs) {
    await downloadTrack(song, true);
    done++;
    if (onProgress) onProgress(done, songs.length);
  }

  await db.cachedAlbums.put({
    id: album.id,
    album,
    downloadedAt: Date.now(),
  });
}

export async function downloadPlaylist(
  playlist: Playlist,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const songs = playlist.entry || [];
  let done = 0;

  for (const song of songs) {
    await downloadTrack(song, true);
    done++;
    if (onProgress) onProgress(done, songs.length);
  }

  await db.cachedPlaylists.put({
    id: playlist.id,
    playlist,
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
