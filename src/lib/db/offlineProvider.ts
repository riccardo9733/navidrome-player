import { db } from "./dexie";
import { Album, Artist, Playlist, Song } from "../subsonic/types";

/**
 * Check if the browser is currently offline
 */
export function isBrowserOffline(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return !navigator.onLine;
}

/**
 * Get all explicitly and previously downloaded tracks formatted as Songs
 */
export async function getOfflineTracks(): Promise<Song[]> {
  try {
    const records = await db.cachedTracks.toArray();
    return records.map((r) => ({
      ...r.song,
      isDownloaded: true,
    }));
  } catch (err) {
    console.error("Error retrieving offline tracks:", err);
    return [];
  }
}

/**
 * Get all albums that contain offline tracks or have been cached
 */
export async function getOfflineAlbums(): Promise<Album[]> {
  try {
    const cachedAlbumRecords = await db.cachedAlbums.toArray();
    const cachedTracks = await db.cachedTracks.toArray();

    const albumsMap = new Map<string, Album>();

    // 1. Add all saved album records
    for (const record of cachedAlbumRecords) {
      albumsMap.set(record.id, {
        ...record.album,
      });
    }

    // 2. Aggregate from downloaded tracks in case some tracks were downloaded individually
    for (const record of cachedTracks) {
      const s = record.song;
      const albumKey = s.albumId || s.album || "unknown_album";
      const existing = albumsMap.get(albumKey);

      if (!existing) {
        albumsMap.set(albumKey, {
          id: albumKey,
          name: s.album || "Album Sconosciuto",
          title: s.album || "Album Sconosciuto",
          artist: s.artist || "Artista Sconosciuto",
          artistId: s.artistId,
          coverArt: s.coverArt,
          songCount: 1,
          duration: s.duration || 0,
          year: s.year,
          genre: s.genre,
          song: [{ ...s, isDownloaded: true }],
        });
      } else {
        // Ensure songs list includes track
        if (existing.song && !existing.song.some((song) => song.id === s.id)) {
          existing.song.push({ ...s, isDownloaded: true });
          existing.songCount = existing.song.length;
          existing.duration = (existing.duration || 0) + (s.duration || 0);
        }
      }
    }

    return Array.from(albumsMap.values());
  } catch (err) {
    console.error("Error retrieving offline albums:", err);
    return [];
  }
}

/**
 * Get a specific album by ID populated with its offline tracks
 */
export async function getOfflineAlbum(albumId: string): Promise<Album | null> {
  try {
    const cachedAlbumRecord = await db.cachedAlbums.get(albumId);
    const allTracks = await db.cachedTracks.toArray();

    // Find all tracks matching this album ID or album title
    const albumTracks = allTracks
      .map((r) => r.song)
      .filter((s) => s.albumId === albumId || s.album === albumId || (cachedAlbumRecord && s.album === cachedAlbumRecord.album.name))
      .map((s) => ({ ...s, isDownloaded: true }))
      .sort((a, b) => (a.track || 0) - (b.track || 0));

    if (cachedAlbumRecord) {
      return {
        ...cachedAlbumRecord.album,
        song: albumTracks.length > 0 ? albumTracks : (cachedAlbumRecord.album.song || []).map((s) => ({ ...s, isDownloaded: true })),
        songCount: albumTracks.length || cachedAlbumRecord.album.songCount || 0,
      };
    }

    if (albumTracks.length > 0) {
      const first = albumTracks[0];
      return {
        id: albumId,
        name: first.album || "Album Sconosciuto",
        title: first.album || "Album Sconosciuto",
        artist: first.artist || "Artista Sconosciuto",
        artistId: first.artistId,
        coverArt: first.coverArt,
        songCount: albumTracks.length,
        duration: albumTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
        year: first.year,
        genre: first.genre,
        song: albumTracks,
      };
    }

    return null;
  } catch (err) {
    console.error(`Error retrieving offline album ${albumId}:`, err);
    return null;
  }
}

/**
 * Get all artists associated with offline tracks
 */
export async function getOfflineArtists(): Promise<Artist[]> {
  try {
    const albums = await getOfflineAlbums();
    const tracks = await getOfflineTracks();
    const artistsMap = new Map<string, Artist>();

    for (const track of tracks) {
      const artistKey = track.artistId || track.artist || "unknown_artist";
      const artistName = track.artist || "Artista Sconosciuto";

      if (!artistsMap.has(artistKey)) {
        artistsMap.set(artistKey, {
          id: artistKey,
          name: artistName,
          coverArt: track.coverArt,
          albumCount: 0,
          album: [],
        });
      }
    }

    // Attach albums to artists
    for (const album of albums) {
      const artistKey = album.artistId || album.artist || "unknown_artist";
      const artist = artistsMap.get(artistKey);
      if (artist) {
        if (!artist.album) artist.album = [];
        if (!artist.album.some((a) => a.id === album.id)) {
          artist.album.push(album);
          artist.albumCount = artist.album.length;
        }
      }
    }

    return Array.from(artistsMap.values());
  } catch (err) {
    console.error("Error retrieving offline artists:", err);
    return [];
  }
}

/**
 * Get a specific artist by ID or name with their offline albums
 */
export async function getOfflineArtist(artistId: string): Promise<Artist | null> {
  try {
    const artists = await getOfflineArtists();
    const artist = artists.find((a) => a.id === artistId || a.name.toLowerCase() === artistId.toLowerCase());
    return artist || null;
  } catch (err) {
    console.error(`Error retrieving offline artist ${artistId}:`, err);
    return null;
  }
}

/**
 * Get all offline cached playlists
 */
export async function getOfflinePlaylists(): Promise<Playlist[]> {
  try {
    const records = await db.cachedPlaylists.toArray();
    return records.map((r) => r.playlist);
  } catch (err) {
    console.error("Error retrieving offline playlists:", err);
    return [];
  }
}

/**
 * Get a specific offline playlist by ID
 */
export async function getOfflinePlaylist(playlistId: string): Promise<Playlist | null> {
  try {
    const record = await db.cachedPlaylists.get(playlistId);
    return record ? record.playlist : null;
  } catch (err) {
    console.error(`Error retrieving offline playlist ${playlistId}:`, err);
    return null;
  }
}

/**
 * Search offline downloaded library (songs, albums, artists)
 */
export async function searchOffline(query: string): Promise<{
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { songs: [], albums: [], artists: [] };
  }

  const [allTracks, allAlbums, allArtists] = await Promise.all([
    getOfflineTracks(),
    getOfflineAlbums(),
    getOfflineArtists(),
  ]);

  const songs = allTracks.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      (s.artist && s.artist.toLowerCase().includes(q)) ||
      (s.album && s.album.toLowerCase().includes(q))
  );

  const albums = allAlbums.filter(
    (a) =>
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.artist && a.artist.toLowerCase().includes(q))
  );

  const artists = allArtists.filter((a) => a.name.toLowerCase().includes(q));

  return { songs, albums, artists };
}
