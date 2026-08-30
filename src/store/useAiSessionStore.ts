import { create } from "zustand";
import { TrackTriviaResult, SimilarSongRecommendation } from "../lib/ai/openRouterClient";

export interface SongAiSessionData {
  trivia?: TrackTriviaResult;
  similar?: SimilarSongRecommendation[];
  isLoadingTrivia?: boolean;
  isLoadingSimilar?: boolean;
  triviaError?: string | null;
  similarError?: string | null;
  lastFetchedAt?: number;
}

interface AiSessionState {
  // Keyed by song ID
  cache: Record<string, SongAiSessionData>;

  // Actions
  getSongAiData: (songId: string) => SongAiSessionData | undefined;
  setTrivia: (songId: string, trivia: TrackTriviaResult) => void;
  setSimilar: (songId: string, similar: SimilarSongRecommendation[]) => void;
  setTriviaLoading: (songId: string, loading: boolean) => void;
  setSimilarLoading: (songId: string, loading: boolean) => void;
  setTriviaError: (songId: string, error: string | null) => void;
  setSimilarError: (songId: string, error: string | null) => void;
  invalidateSongCache: (songId: string) => void;
  clearAllAiCache: () => void;
}

export const useAiSessionStore = create<AiSessionState>((set, get) => ({
  cache: {},

  getSongAiData: (songId: string) => {
    return get().cache[songId];
  },

  setTrivia: (songId: string, trivia: TrackTriviaResult) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [songId]: {
          ...(state.cache[songId] || {}),
          trivia,
          isLoadingTrivia: false,
          triviaError: null,
          lastFetchedAt: Date.now(),
        },
      },
    }));
  },

  setSimilar: (songId: string, similar: SimilarSongRecommendation[]) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [songId]: {
          ...(state.cache[songId] || {}),
          similar,
          isLoadingSimilar: false,
          similarError: null,
          lastFetchedAt: Date.now(),
        },
      },
    }));
  },

  setTriviaLoading: (songId: string, loading: boolean) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [songId]: {
          ...(state.cache[songId] || {}),
          isLoadingTrivia: loading,
          triviaError: loading ? null : state.cache[songId]?.triviaError,
        },
      },
    }));
  },

  setSimilarLoading: (songId: string, loading: boolean) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [songId]: {
          ...(state.cache[songId] || {}),
          isLoadingSimilar: loading,
          similarError: loading ? null : state.cache[songId]?.similarError,
        },
      },
    }));
  },

  setTriviaError: (songId: string, error: string | null) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [songId]: {
          ...(state.cache[songId] || {}),
          isLoadingTrivia: false,
          triviaError: error,
        },
      },
    }));
  },

  setSimilarError: (songId: string, error: string | null) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [songId]: {
          ...(state.cache[songId] || {}),
          isLoadingSimilar: false,
          similarError: error,
        },
      },
    }));
  },

  invalidateSongCache: (songId: string) => {
    set((state) => {
      const updated = { ...state.cache };
      delete updated[songId];
      return { cache: updated };
    });
  },

  clearAllAiCache: () => {
    set({ cache: {} });
  },
}));
