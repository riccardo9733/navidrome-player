export interface ServerProfile {
  id: string;
  name: string;
  url: string;
  username: string;
  password?: string;
  token?: string;
  salt?: string;
  legacyAuth?: boolean;
  isActive: boolean;
  serverVersion?: string;
  openSubsonic?: boolean;
}

export interface SubsonicResponse<T = unknown> {
  "subsonic-response": {
    status: "ok" | "failed";
    version: string;
    type?: string;
    serverVersion?: string;
    openSubsonic?: boolean;
    error?: {
      code: number;
      message: string;
    };
  } & T;
}

export interface Song {
  id: string;
  parent?: string;
  isDir?: boolean;
  title: string;
  album?: string;
  artist?: string;
  track?: number;
  year?: number;
  genre?: string;
  coverArt?: string;
  size?: number;
  contentType?: string;
  suffix?: string;
  duration: number; // in seconds
  bitRate?: number;
  path?: string;
  isVideo?: boolean;
  playCount?: number;
  played?: string;
  created?: string;
  albumId?: string;
  artistId?: string;
  starred?: string; // ISO date if starred
  userRating?: number;
  averageRating?: number;
  discNumber?: number;
  bpm?: number;
  comment?: string;
  sortName?: string;
  musicBrainzId?: string;
  replayGain?: {
    trackGain?: number;
    albumGain?: number;
    trackPeak?: number;
    albumPeak?: number;
  };
  // Client-side / Offline enriched properties
  isDownloaded?: boolean;
  localBlobUrl?: string;
}

export interface Album {
  id: string;
  name: string;
  title?: string;
  artist?: string;
  artistId?: string;
  coverArt?: string;
  songCount: number;
  duration: number;
  playCount?: number;
  created?: string;
  starred?: string;
  year?: number;
  genre?: string;
  song?: Song[];
}

export interface Artist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  starred?: string;
  artistImageUrl?: string;
  album?: Album[];
}

export interface Playlist {
  id: string;
  name: string;
  comment?: string;
  owner?: string;
  public?: boolean;
  songCount: number;
  duration: number;
  created?: string;
  changed?: string;
  coverArt?: string;
  entry?: Song[];
}

export interface Genre {
  value: string;
  songCount: number;
  albumCount: number;
}

export interface MusicFolder {
  id: number;
  name: string;
}

export interface LyricsLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsResponse {
  lyrics?: {
    artist?: string;
    title?: string;
    content?: string;
  };
  lyricsList?: {
    structuredLyrics?: Array<{
      displayArtist?: string;
      displayTitle?: string;
      lang?: string;
      synced: boolean;
      line?: Array<{
        start: number; // ms
        value: string;
      }>;
      offset?: number;
    }>;
  };
}

export interface SearchResult3 {
  searchResult3?: {
    artist?: Artist[];
    album?: Album[];
    song?: Song[];
  };
}

export interface ScanStatus {
  scanStatus: {
    scanning: boolean;
    count?: number;
  };
}

export type TranscodingFormat = "raw" | "mp3" | "opus" | "aac" | "flac";
export type BitrateOption = 0 | 128 | 192 | 256 | 320; // 0 = raw/lossless
