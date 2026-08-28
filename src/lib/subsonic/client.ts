import { createAuthParams } from "./crypto";
import {
  Album,
  Artist,
  BitrateOption,
  Genre,
  LyricsResponse,
  Playlist,
  SearchResult3,
  ServerProfile,
  Song,
  SubsonicResponse,
  TranscodingFormat,
} from "./types";
export class SubsonicClient {
  private profile: ServerProfile | null = null;

  constructor(profile?: ServerProfile | null) {
    this.profile = profile || null;
  }

  public setProfile(profile: ServerProfile | null) {
    this.profile = profile;
  }

  public getProfile(): ServerProfile | null {
    return this.profile;
  }

  public isConfigured(): boolean {
    return Boolean(this.profile && this.profile.url && this.profile.username);
  }

  private buildUrl(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): string {
    if (!this.profile) {
      throw new Error("No server profile configured");
    }

    const cleanBase = this.profile.url.replace(/\/+$/, "");
    const url = new URL(`${cleanBase}/rest/${endpoint}.view`);

    const authParams = createAuthParams(
      this.profile.username,
      this.profile.password,
      this.profile.legacyAuth
    );

    Object.entries(authParams).forEach(([key, val]) => {
      url.searchParams.set(key, String(val));
    });

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });

    return url.toString();
  }

  private async request<T = unknown>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
    options?: { silent?: boolean }
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("Subsonic client is not configured with an active server");
    }

    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data: SubsonicResponse<T> = await response.json();
      const subResponse = data["subsonic-response"];

      if (subResponse.status === "failed") {
        throw new Error(subResponse.error?.message || `Subsonic Error Code ${subResponse.error?.code}`);
      }

      return subResponse as unknown as T;
    } catch (err: unknown) {
      if (!options?.silent) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[SubsonicClient] Request to ${endpoint} failed:`, message);
      }
      throw err;
    }
  }

  // --- API Methods ---

  public async ping(): Promise<{ serverVersion?: string; version?: string; openSubsonic?: boolean }> {
    if (!this.isConfigured()) {
      throw new Error("Client Subsonic non configurato");
    }
    const res = await this.request<{ serverVersion?: string; openSubsonic?: boolean; version?: string }>("ping");
    return {
      serverVersion: res.serverVersion || res.version,
      version: res.serverVersion || res.version,
      openSubsonic: res.openSubsonic ?? true,
    };
  }

  public async getArtists(): Promise<Artist[]> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cachedAlbums = await db.cachedAlbums.toArray();
        const artistMap = new Map<string, Artist>();
        cachedAlbums.forEach((ca) => {
          if (ca.album.artist) {
            const key = ca.album.artistId || ca.album.artist;
            if (!artistMap.has(key)) {
              artistMap.set(key, {
                id: key,
                name: ca.album.artist,
                coverArt: ca.album.coverArt,
                albumCount: 1,
              });
            }
          }
        });
        return Array.from(artistMap.values());
      } catch {
        return [];
      }
    }
    try {
      const res = await this.request<{ artists?: { index?: Array<{ artist?: Artist[] }> } }>("getArtists");
      const artists: Artist[] = [];
      res.artists?.index?.forEach((idx) => {
        if (idx.artist) {
          artists.push(...idx.artist);
        }
      });
      return artists;
    } catch (err) {
      console.warn("[SubsonicClient] Remote getArtists failed, checking local cache:", err);
      try {
        const { db } = await import("../db/dexie");
        const cachedAlbums = await db.cachedAlbums.toArray();
        const artistMap = new Map<string, Artist>();
        cachedAlbums.forEach((ca) => {
          if (ca.album.artist) {
            const key = ca.album.artistId || ca.album.artist;
            if (!artistMap.has(key)) {
              artistMap.set(key, {
                id: key,
                name: ca.album.artist,
                coverArt: ca.album.coverArt,
                albumCount: 1,
              });
            }
          }
        });
        return Array.from(artistMap.values());
      } catch {
        return [];
      }
    }
  }

  public async getArtist(id: string): Promise<Artist> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cachedAlbums = await db.cachedAlbums.toArray();
        const albums = cachedAlbums.filter((ca) => ca.album.artistId === id || ca.album.artist === id).map((ca) => ca.album);
        if (albums.length > 0) {
          return {
            id,
            name: albums[0].artist || id,
            coverArt: albums[0].coverArt,
            albumCount: albums.length,
            album: albums,
          };
        }
      } catch {}
      throw new Error("Server non configurato");
    }
    try {
      const res = await this.request<{ artist: Artist }>("getArtist", { id });
      return res.artist;
    } catch (err) {
      console.warn(`[SubsonicClient] Remote getArtist(${id}) failed, checking local cache:`, err);
      try {
        const { db } = await import("../db/dexie");
        const cachedAlbums = await db.cachedAlbums.toArray();
        const albums = cachedAlbums.filter((ca) => ca.album.artistId === id || ca.album.artist === id).map((ca) => ca.album);
        if (albums.length > 0) {
          return {
            id,
            name: albums[0].artist || id,
            coverArt: albums[0].coverArt,
            albumCount: albums.length,
            album: albums,
          };
        }
      } catch {}
      throw err;
    }
  }

  public async getAlbumList(
    type: "recent" | "starred" | "frequent" | "random" | "newest" | "alphabeticalByName" = "recent",
    size = 30,
    offset = 0
  ): Promise<Album[]> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedAlbums.toArray();
        return cached.map((c) => c.album);
      } catch {
        return [];
      }
    }
    try {
      const res = await this.request<{ albumList2?: { album?: Album[] }; albumList?: { album?: Album[] } }>(
        "getAlbumList2",
        { type, size, offset }
      );
      return res.albumList2?.album || res.albumList?.album || [];
    } catch (err) {
      console.warn("[SubsonicClient] Remote getAlbumList failed, checking local cache:", err);
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedAlbums.toArray();
        return cached.map((c) => c.album);
      } catch {
        return [];
      }
    }
  }

  public async getRandomSongs(size = 30, genre?: string): Promise<Song[]> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cachedTracks = await db.cachedTracks.toArray();
        let songs = cachedTracks.map((t) => t.song);
        if (genre) {
          songs = songs.filter((s) => s.genre?.toLowerCase() === genre.toLowerCase());
        }
        return songs.sort(() => Math.random() - 0.5).slice(0, size);
      } catch {
        return [];
      }
    }
    try {
      const params: Record<string, string | number> = { size };
      if (genre) params.genre = genre;
      const res = await this.request<{ randomSongs?: { song?: Song[] } }>("getRandomSongs", params);
      return res.randomSongs?.song || [];
    } catch (err) {
      console.warn("[SubsonicClient] Remote getRandomSongs failed, fallback to local cache:", err);
      try {
        const { db } = await import("../db/dexie");
        const cachedTracks = await db.cachedTracks.toArray();
        let songs = cachedTracks.map((t) => t.song);
        if (genre) {
          songs = songs.filter((s) => s.genre?.toLowerCase() === genre.toLowerCase());
        }
        return songs.sort(() => Math.random() - 0.5).slice(0, size);
      } catch {
        return [];
      }
    }
  }

  public async getSongs(size = 500): Promise<Song[]> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cachedTracks = await db.cachedTracks.toArray();
        return cachedTracks.map((t) => t.song);
      } catch {
        return [];
      }
    }
    try {
      const res = await this.request<SearchResult3>("search3", {
        query: "",
        songCount: size,
      });
      if (res.searchResult3?.song && res.searchResult3.song.length > 0) {
        return res.searchResult3.song;
      }
    } catch {
      // ignore and try getRandomSongs
    }

    try {
      const res = await this.request<{ randomSongs?: { song?: Song[] } }>("getRandomSongs", { size });
      if (res.randomSongs?.song && res.randomSongs.song.length > 0) {
        return res.randomSongs.song;
      }
    } catch {
      // ignore
    }

    try {
      const { db } = await import("../db/dexie");
      const cachedTracks = await db.cachedTracks.toArray();
      return cachedTracks.map((t) => t.song);
    } catch {
      return [];
    }
  }

  public async getAlbum(id: string): Promise<Album> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedAlbums.get(id);
        if (cached) return cached.album;
      } catch {}
      throw new Error("Server non configurato");
    }
    try {
      const res = await this.request<{ album: Album }>("getAlbum", { id });
      return res.album;
    } catch (err) {
      console.warn(`[SubsonicClient] Remote getAlbum(${id}) failed, checking local cache:`, err);
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedAlbums.get(id);
        if (cached) return cached.album;
      } catch {}
      throw err;
    }
  }

  public async getPlaylists(): Promise<Playlist[]> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedPlaylists.toArray();
        return cached.map((c) => c.playlist);
      } catch {
        return [];
      }
    }
    try {
      const res = await this.request<{ playlists?: { playlist?: Playlist[] } }>("getPlaylists");
      return res.playlists?.playlist || [];
    } catch (err) {
      console.warn("[SubsonicClient] Remote getPlaylists failed, fallback to local cache:", err);
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedPlaylists.toArray();
        return cached.map((c) => c.playlist);
      } catch {
        return [];
      }
    }
  }

  public async getPlaylist(id: string): Promise<Playlist> {
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedPlaylists.get(id);
        if (cached) return cached.playlist;
      } catch {}
      throw new Error("Server non configurato");
    }
    try {
      const res = await this.request<{ playlist: Playlist }>("getPlaylist", { id });
      return res.playlist;
    } catch (err) {
      console.warn(`[SubsonicClient] Remote getPlaylist(${id}) failed, fallback to local cache:`, err);
      try {
        const { db } = await import("../db/dexie");
        const cached = await db.cachedPlaylists.get(id);
        if (cached) return cached.playlist;
      } catch {}
      throw err;
    }
  }

  public async search(query: string): Promise<SearchResult3["searchResult3"]> {
    if (!query.trim()) return {};
    if (!this.isConfigured()) {
      try {
        const { db } = await import("../db/dexie");
        const q = query.toLowerCase();
        const cachedTracks = await db.cachedTracks.toArray();
        const cachedAlbums = await db.cachedAlbums.toArray();
        const matchedSongs = cachedTracks
          .map((t) => t.song)
          .filter(
            (s) =>
              s.title?.toLowerCase().includes(q) ||
              s.artist?.toLowerCase().includes(q) ||
              s.album?.toLowerCase().includes(q)
          );
        const matchedAlbums = cachedAlbums
          .map((a) => a.album)
          .filter(
            (a) =>
              a.name?.toLowerCase().includes(q) ||
              a.artist?.toLowerCase().includes(q)
          );
        return {
          song: matchedSongs,
          album: matchedAlbums,
          artist: [],
        };
      } catch {
        return {};
      }
    }
    try {
      const res = await this.request<SearchResult3>("search3", {
        query,
        songCount: 20,
        albumCount: 15,
        artistCount: 10,
      });
      return res.searchResult3 || {};
    } catch (err) {
      console.warn("[SubsonicClient] Remote search failed, falling back to cached DB:", err);
      try {
        const { db } = await import("../db/dexie");
        const q = query.toLowerCase();
        const cachedTracks = await db.cachedTracks.toArray();
        const cachedAlbums = await db.cachedAlbums.toArray();
        const matchedSongs = cachedTracks
          .map((t) => t.song)
          .filter(
            (s) =>
              s.title?.toLowerCase().includes(q) ||
              s.artist?.toLowerCase().includes(q) ||
              s.album?.toLowerCase().includes(q)
          );
        const matchedAlbums = cachedAlbums
          .map((a) => a.album)
          .filter(
            (a) =>
              a.name?.toLowerCase().includes(q) ||
              a.artist?.toLowerCase().includes(q)
          );
        return {
          song: matchedSongs,
          album: matchedAlbums,
          artist: [],
        };
      } catch {
        return {};
      }
    }
  }

  public async getGenres(): Promise<Genre[]> {
    if (!this.isConfigured()) {
      return [];
    }
    const res = await this.request<{ genres?: { genre?: Genre[] } }>("getGenres");
    return res.genres?.genre || [];
  }

  public async getStarred(): Promise<{ song: Song[]; album: Album[]; artist: Artist[] }> {
    if (!this.isConfigured()) {
      return { song: [], album: [], artist: [] };
    }
    const res = await this.request<{
      starred2?: { song?: Song[]; album?: Album[]; artist?: Artist[] };
      starred?: { song?: Song[]; album?: Album[]; artist?: Artist[] };
    }>("getStarred2");
    const container = res.starred2 || res.starred || {};
    return {
      song: container.song || [],
      album: container.album || [],
      artist: container.artist || [],
    };
  }

  public async star(id: string, type: "song" | "album" | "artist" = "song"): Promise<void> {
    if (!this.isConfigured()) return;
    const paramKey = type === "album" ? "albumId" : type === "artist" ? "artistId" : "id";
    await this.request("star", { [paramKey]: id });
  }

  public async unstar(id: string, type: "song" | "album" | "artist" = "song"): Promise<void> {
    if (!this.isConfigured()) return;
    const paramKey = type === "album" ? "albumId" : type === "artist" ? "artistId" : "id";
    await this.request("unstar", { [paramKey]: id });
  }

  public async scrobble(id: string, time?: number, submission = true): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await this.request("scrobble", {
        id,
        time: time ? Math.round(time) : undefined,
        submission: submission ? true : false,
      });
    } catch (err) {
      console.warn("[SubsonicClient] Scrobble failed:", err);
    }
  }

  public async getLyrics(songId: string, artist?: string, title?: string): Promise<{ syncedLyrics?: string; plainLyrics?: string }> {
    if (!this.isConfigured()) {
      return {};
    }

    // Try OpenSubsonic getLyricsBySongId first
    try {
      const openSubsonicRes = await this.request<LyricsResponse>(
        "getLyricsBySongId",
        { id: songId },
        { silent: true }
      );
      const structured = openSubsonicRes.lyricsList?.structuredLyrics?.[0];
      if (structured?.line && structured.line.length > 0) {
        // Convert to LRC string format
        const lrcLines = structured.line.map((l) => {
          const totalSec = l.start / 1000;
          const mins = Math.floor(totalSec / 60).toString().padStart(2, "0");
          const secs = (totalSec % 60).toFixed(2).padStart(5, "0");
          return `[${mins}:${secs}] ${l.value}`;
        });
        return { syncedLyrics: lrcLines.join("\n") };
      }
    } catch {
      // Fall back to standard getLyrics
    }

    try {
      const plainRes = await this.request<LyricsResponse>(
        "getLyrics",
        { id: songId, artist, title },
        { silent: true }
      );
      if (plainRes.lyrics?.content) {
        // Check if content is LRC formatted
        const content = plainRes.lyrics.content;
        if (/\[\d{2}:\d{2}/.test(content)) {
          return { syncedLyrics: content };
        }
        return { plainLyrics: content };
      }
    } catch {
      // Ignore
    }

    return {};
  }

  public getCoverArtUrl(coverId?: string, size = 600): string {
    if (!coverId) {
      return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80";
    }
    if (coverId.startsWith("http://") || coverId.startsWith("https://")) {
      return coverId;
    }
    if (!this.isConfigured()) {
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
    }
    return this.buildUrl("getCoverArt", { id: coverId, size });
  }

  public getStreamUrl(
    songId: string,
    options?: {
      maxBitRate?: BitrateOption;
      format?: TranscodingFormat;
      estimateContentLength?: boolean;
    }
  ): string {
    if (!this.isConfigured()) {
      return "";
    }

    const params: Record<string, string | number | boolean | undefined> = {
      id: songId,
      estimateContentLength: options?.estimateContentLength ?? true,
    };

    if (options?.maxBitRate && options.maxBitRate > 0) {
      params.maxBitRate = options.maxBitRate;
    }

    if (options?.format && options.format !== "raw") {
      params.format = options.format;
    }

    return this.buildUrl("stream", params);
  }
}

// Global singleton instance
export const subsonicClient = new SubsonicClient();
