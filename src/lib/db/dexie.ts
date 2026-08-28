import Dexie, { Table } from "dexie";
import { Album, Playlist, Song } from "../subsonic/types";

export interface CachedTrackRecord {
  id: string;
  song: Song;
  audioBlob?: Blob;
  coverBlob?: Blob;
  size: number;
  downloadedAt: number;
  lastPlayedAt?: number;
  isExplicitDownload: boolean; // true = user requested download, false = automatic LRU cache
}

export interface CachedAlbumRecord {
  id: string;
  album: Album;
  downloadedAt: number;
}

export interface CachedPlaylistRecord {
  id: string;
  playlist: Playlist;
  downloadedAt: number;
}

export interface PlayHistoryRecord {
  id?: number;
  songId: string;
  song: Song;
  timestamp: number;
  completedRatio: number;
}

export class NavidromeDatabase extends Dexie {
  cachedTracks!: Table<CachedTrackRecord, string>;
  cachedAlbums!: Table<CachedAlbumRecord, string>;
  cachedPlaylists!: Table<CachedPlaylistRecord, string>;
  playHistory!: Table<PlayHistoryRecord, number>;

  constructor() {
    super("NavidromePlayerDB");
    this.version(1).stores({
      cachedTracks: "id, downloadedAt, lastPlayedAt, isExplicitDownload, [isExplicitDownload+lastPlayedAt]",
      cachedAlbums: "id, downloadedAt",
      cachedPlaylists: "id, downloadedAt",
      playHistory: "++id, songId, timestamp",
    });
  }
}

export const db = new NavidromeDatabase();
