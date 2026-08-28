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
import { DEMO_ALBUMS, DEMO_ARTISTS, DEMO_LYRICS, DEMO_PLAYLISTS, DEMO_SONGS } from "./demoData";

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
    params: Record<string, string | number | boolean | undefined> = {}
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
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SubsonicClient] Request to ${endpoint} failed:`, message);
      throw err;
    }
  }

  // --- API Methods ---

  public async ping(): Promise<{ serverVersion?: string; openSubsonic?: boolean }> {
    if (!this.isConfigured()) {
      return { serverVersion: "Demo Mode", openSubsonic: true };
    }
    const res = await this.request<{ serverVersion?: string; openSubsonic?: boolean; version?: string }>("ping");
    return {
      serverVersion: res.serverVersion || res.version,
      openSubsonic: res.openSubsonic ?? true,
    };
  }

  public async getArtists(): Promise<Artist[]> {
    if (!this.isConfigured()) {
      return DEMO_ARTISTS;
    }
    const res = await this.request<{ artists?: { index?: Array<{ artist?: Artist[] }> } }>("getArtists");
    const artists: Artist[] = [];
    res.artists?.index?.forEach((idx) => {
      if (idx.artist) {
        artists.push(...idx.artist);
      }
    });
    return artists;
  }

  public async getArtist(id: string): Promise<Artist> {
    if (!this.isConfigured()) {
      const artist = DEMO_ARTISTS.find((a) => a.id === id);
      if (artist) return artist;
      return DEMO_ARTISTS[0];
    }
    const res = await this.request<{ artist: Artist }>("getArtist", { id });
    return res.artist;
  }

  public async getAlbumList(
    type: "recent" | "starred" | "frequent" | "random" | "newest" | "alphabeticalByName" = "recent",
    size = 30,
    offset = 0
  ): Promise<Album[]> {
    if (!this.isConfigured()) {
      if (type === "starred") {
        return DEMO_ALBUMS.filter((a) => Boolean(a.starred));
      }
      return DEMO_ALBUMS;
    }
    const res = await this.request<{ albumList2?: { album?: Album[] }; albumList?: { album?: Album[] } }>(
      "getAlbumList2",
      { type, size, offset }
    );
    return res.albumList2?.album || res.albumList?.album || [];
  }

  public async getAlbum(id: string): Promise<Album> {
    if (!this.isConfigured()) {
      const album = DEMO_ALBUMS.find((a) => a.id === id);
      if (album) return album;
      return DEMO_ALBUMS[0];
    }
    const res = await this.request<{ album: Album }>("getAlbum", { id });
    return res.album;
  }

  public async getPlaylists(): Promise<Playlist[]> {
    if (!this.isConfigured()) {
      return DEMO_PLAYLISTS;
    }
    const res = await this.request<{ playlists?: { playlist?: Playlist[] } }>("getPlaylists");
    return res.playlists?.playlist || [];
  }

  public async getPlaylist(id: string): Promise<Playlist> {
    if (!this.isConfigured()) {
      const pl = DEMO_PLAYLISTS.find((p) => p.id === id);
      if (pl) return pl;
      return DEMO_PLAYLISTS[0];
    }
    const res = await this.request<{ playlist: Playlist }>("getPlaylist", { id });
    return res.playlist;
  }

  public async search(query: string): Promise<SearchResult3["searchResult3"]> {
    if (!query.trim()) return {};
    if (!this.isConfigured()) {
      const q = query.toLowerCase();
      return {
        song: DEMO_SONGS.filter(
          (s) => s.title.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
        ),
        album: DEMO_ALBUMS.filter(
          (a) => a.name.toLowerCase().includes(q) || a.artist?.toLowerCase().includes(q)
        ),
        artist: DEMO_ARTISTS.filter((a) => a.name.toLowerCase().includes(q)),
      };
    }
    const res = await this.request<SearchResult3>("search3", {
      query,
      songCount: 20,
      albumCount: 15,
      artistCount: 10,
    });
    return res.searchResult3 || {};
  }

  public async getGenres(): Promise<Genre[]> {
    if (!this.isConfigured()) {
      return [
        { value: "Synthwave", songCount: 3, albumCount: 1 },
        { value: "Lo-Fi", songCount: 2, albumCount: 1 },
        { value: "Ambient", songCount: 2, albumCount: 1 },
      ];
    }
    const res = await this.request<{ genres?: { genre?: Genre[] } }>("getGenres");
    return res.genres?.genre || [];
  }

  public async getStarred(): Promise<{ song: Song[]; album: Album[]; artist: Artist[] }> {
    if (!this.isConfigured()) {
      return {
        song: DEMO_SONGS.filter((s) => Boolean(s.starred)),
        album: DEMO_ALBUMS.filter((a) => Boolean(a.starred)),
        artist: DEMO_ARTISTS.filter((ar) => Boolean(ar.starred)),
      };
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

  public async getLyrics(songId: string): Promise<{ syncedLyrics?: string; plainLyrics?: string }> {
    if (!this.isConfigured()) {
      const demoLrc = DEMO_LYRICS[songId];
      if (demoLrc) {
        return { syncedLyrics: demoLrc };
      }
      return {};
    }

    // Try OpenSubsonic getLyricsBySongId first
    try {
      const openSubsonicRes = await this.request<LyricsResponse>("getLyricsBySongId", { id: songId });
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
      const plainRes = await this.request<LyricsResponse>("getLyrics", { id: songId });
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
      const demo = DEMO_SONGS.find((s) => s.id === songId);
      if (demo && demo.path) return demo.path;
      return DEMO_SONGS[0].path || "";
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
