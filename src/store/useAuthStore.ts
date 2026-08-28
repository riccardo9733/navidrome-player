import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ServerProfile } from "../lib/subsonic/types";
import { SubsonicClient, subsonicClient } from "../lib/subsonic/client";

interface AuthState {
  profiles: ServerProfile[];
  activeProfileId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isOfflineMode: boolean;
  serverInfo: { version?: string; openSubsonic?: boolean } | null;
  error: string | null;

  // Actions
  addProfile: (profile: Omit<ServerProfile, "id" | "isActive">) => Promise<boolean>;
  updateProfile: (id: string, updates: Partial<ServerProfile>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => Promise<boolean>;
  toggleOfflineMode: (force?: boolean) => void;
  testConnection: (profile?: ServerProfile) => Promise<{ success: boolean; error?: string }>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      isConnected: false,
      isConnecting: false,
      isOfflineMode: false,
      serverInfo: null,
      error: null,

      addProfile: async (profileData) => {
        const id = "srv_" + Date.now().toString(36);
        const newProfile: ServerProfile = {
          ...profileData,
          id,
          isActive: get().profiles.length === 0,
        };

        const updatedProfiles = [...get().profiles, newProfile];
        set({ profiles: updatedProfiles });

        if (updatedProfiles.length === 1) {
          return await get().setActiveProfile(id);
        }
        return true;
      },

      updateProfile: (id, updates) => {
        const updatedProfiles = get().profiles.map((p) => (p.id === id ? { ...p, ...updates } : p));
        set({ profiles: updatedProfiles });

        if (get().activeProfileId === id) {
          const active = updatedProfiles.find((p) => p.id === id);
          if (active) subsonicClient.setProfile(active);
        }
      },

      removeProfile: (id) => {
        const updatedProfiles = get().profiles.filter((p) => p.id !== id);
        let nextActiveId = get().activeProfileId;

        if (get().activeProfileId === id) {
          nextActiveId = updatedProfiles.length > 0 ? updatedProfiles[0].id : null;
        }

        set({
          profiles: updatedProfiles,
          activeProfileId: nextActiveId,
        });

        if (nextActiveId) {
          const nextActive = updatedProfiles.find((p) => p.id === nextActiveId) || null;
          subsonicClient.setProfile(nextActive);
        } else {
          subsonicClient.setProfile(null);
        }
      },

      setActiveProfile: async (id) => {
        const profile = get().profiles.find((p) => p.id === id);
        if (!profile) return false;

        set({ isConnecting: true, error: null });
        subsonicClient.setProfile(profile);

        try {
          const info = await subsonicClient.ping();
          set({
            activeProfileId: id,
            isConnected: true,
            isConnecting: false,
            serverInfo: info,
            profiles: get().profiles.map((p) => ({
              ...p,
              isActive: p.id === id,
              serverVersion: info.serverVersion,
              openSubsonic: info.openSubsonic,
            })),
          });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Connection failed";
          set({
            activeProfileId: id,
            isConnected: false,
            isConnecting: false,
            error: message,
          });
          return false;
        }
      },

      toggleOfflineMode: (force) => {
        set((state) => ({
          isOfflineMode: force !== undefined ? force : !state.isOfflineMode,
        }));
      },

      testConnection: async (profileToTest) => {
        const target = profileToTest || get().profiles.find((p) => p.id === get().activeProfileId);
        if (!target) return { success: false, error: "Nessun server specificato" };

        const testClient = new SubsonicClient(target);
        try {
          await testClient.ping();
          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Impossibile connettersi";
          return { success: false, error: message };
        }
      },

      initializeAuth: async () => {
        const state = get();
        if (state.activeProfileId) {
          const active = state.profiles.find((p) => p.id === state.activeProfileId);
          if (active) {
            subsonicClient.setProfile(active);
            try {
              const info = await subsonicClient.ping();
              set({ isConnected: true, serverInfo: info });
            } catch {
              set({ isConnected: false });
            }
          }
        }
      },
    }),
    {
      name: "navidrome-auth-storage",
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        isOfflineMode: state.isOfflineMode,
      }),
    }
  )
);
