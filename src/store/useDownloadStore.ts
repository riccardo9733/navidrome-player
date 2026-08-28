import { create } from "zustand";
import { Album, Playlist, Song } from "../lib/subsonic/types";
import { downloadAlbum, downloadPlaylist, downloadTrack } from "../lib/db/downloadManager";

export interface DownloadItemState {
  id: string;
  name: string;
  type: "album" | "playlist" | "track";
  progress: number; // 0 to 100
  completedCount?: number;
  totalCount?: number;
  status: "downloading" | "completed" | "error";
  error?: string;
}

interface DownloadStoreState {
  downloadingItems: Record<string, DownloadItemState>;

  // Actions
  downloadAlbumAction: (album: Album) => Promise<void>;
  downloadPlaylistAction: (playlist: Playlist) => Promise<void>;
  downloadTrackAction: (song: Song) => Promise<void>;
  isItemDownloading: (id: string) => boolean;
  getItemProgress: (id: string) => number;
}

export const useDownloadStore = create<DownloadStoreState>((set, get) => ({
  downloadingItems: {},

  isItemDownloading: (id: string) => {
    const item = get().downloadingItems[id];
    return item ? item.status === "downloading" : false;
  },

  getItemProgress: (id: string) => {
    const item = get().downloadingItems[id];
    return item ? item.progress : 0;
  },

  downloadAlbumAction: async (album: Album) => {
    const albumId = album.id;
    if (get().isItemDownloading(albumId)) return;

    const totalSongs = album.song?.length || album.songCount || 1;

    set((state) => ({
      downloadingItems: {
        ...state.downloadingItems,
        [albumId]: {
          id: albumId,
          name: album.name || album.title || "Album",
          type: "album",
          progress: 0,
          completedCount: 0,
          totalCount: totalSongs,
          status: "downloading",
        },
      },
    }));

    try {
      await downloadAlbum(album, (completed, total) => {
        const pct = Math.round((completed / total) * 100);
        set((state) => ({
          downloadingItems: {
            ...state.downloadingItems,
            [albumId]: {
              ...(state.downloadingItems[albumId] || {
                id: albumId,
                name: album.name || album.title || "Album",
                type: "album",
              }),
              progress: pct,
              completedCount: completed,
              totalCount: total,
              status: "downloading",
            },
          },
        }));
      });

      set((state) => ({
        downloadingItems: {
          ...state.downloadingItems,
          [albumId]: {
            ...state.downloadingItems[albumId],
            progress: 100,
            status: "completed",
          },
        },
      }));

      // Clean up after 3 seconds from active map
      setTimeout(() => {
        set((state) => {
          const next = { ...state.downloadingItems };
          delete next[albumId];
          return { downloadingItems: next };
        });
      }, 3000);
    } catch (err) {
      console.error(`Download failed for album ${albumId}:`, err);
      set((state) => ({
        downloadingItems: {
          ...state.downloadingItems,
          [albumId]: {
            ...state.downloadingItems[albumId],
            status: "error",
            error: String(err),
          },
        },
      }));
    }
  },

  downloadPlaylistAction: async (playlist: Playlist) => {
    const playlistId = playlist.id;
    if (get().isItemDownloading(playlistId)) return;

    const totalSongs = playlist.entry?.length || playlist.songCount || 1;

    set((state) => ({
      downloadingItems: {
        ...state.downloadingItems,
        [playlistId]: {
          id: playlistId,
          name: playlist.name || "Playlist",
          type: "playlist",
          progress: 0,
          completedCount: 0,
          totalCount: totalSongs,
          status: "downloading",
        },
      },
    }));

    try {
      await downloadPlaylist(playlist, (completed, total) => {
        const pct = Math.round((completed / total) * 100);
        set((state) => ({
          downloadingItems: {
            ...state.downloadingItems,
            [playlistId]: {
              ...(state.downloadingItems[playlistId] || {
                id: playlistId,
                name: playlist.name || "Playlist",
                type: "playlist",
              }),
              progress: pct,
              completedCount: completed,
              totalCount: total,
              status: "downloading",
            },
          },
        }));
      });

      set((state) => ({
        downloadingItems: {
          ...state.downloadingItems,
          [playlistId]: {
            ...state.downloadingItems[playlistId],
            progress: 100,
            status: "completed",
          },
        },
      }));

      setTimeout(() => {
        set((state) => {
          const next = { ...state.downloadingItems };
          delete next[playlistId];
          return { downloadingItems: next };
        });
      }, 3000);
    } catch (err) {
      console.error(`Download failed for playlist ${playlistId}:`, err);
      set((state) => ({
        downloadingItems: {
          ...state.downloadingItems,
          [playlistId]: {
            ...state.downloadingItems[playlistId],
            status: "error",
            error: String(err),
          },
        },
      }));
    }
  },

  downloadTrackAction: async (song: Song) => {
    const songId = song.id;
    if (get().isItemDownloading(songId)) return;

    set((state) => ({
      downloadingItems: {
        ...state.downloadingItems,
        [songId]: {
          id: songId,
          name: song.title,
          type: "track",
          progress: 0,
          status: "downloading",
        },
      },
    }));

    try {
      await downloadTrack(song, true, (pct) => {
        set((state) => ({
          downloadingItems: {
            ...state.downloadingItems,
            [songId]: {
              ...(state.downloadingItems[songId] || {
                id: songId,
                name: song.title,
                type: "track",
              }),
              progress: pct,
              status: "downloading",
            },
          },
        }));
      });

      set((state) => ({
        downloadingItems: {
          ...state.downloadingItems,
          [songId]: {
            ...state.downloadingItems[songId],
            progress: 100,
            status: "completed",
          },
        },
      }));

      setTimeout(() => {
        set((state) => {
          const next = { ...state.downloadingItems };
          delete next[songId];
          return { downloadingItems: next };
        });
      }, 3000);
    } catch (err) {
      console.error(`Download failed for track ${songId}:`, err);
      set((state) => ({
        downloadingItems: {
          ...state.downloadingItems,
          [songId]: {
            ...state.downloadingItems[songId],
            status: "error",
            error: String(err),
          },
        },
      }));
    }
  },
}));
