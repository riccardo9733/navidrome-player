"use client";

import { useEffect, useState } from "react";
import { Heart, Disc3, Users, Music2, WifiOff } from "lucide-react";
import { Song, Album, Artist } from "../../lib/subsonic/types";
import { subsonicClient } from "../../lib/subsonic/client";
import { TrackRow } from "../../components/shared/TrackRow";
import { AlbumCard } from "../../components/shared/AlbumCard";
import { ArtistCard } from "../../components/shared/ArtistCard";
import { getOfflineAlbums, getOfflineArtists, getOfflineTracks, isBrowserOffline } from "../../lib/db/offlineProvider";

type StarredTab = "songs" | "albums" | "artists";

export default function StarredPage() {
  const [activeTab, setActiveTab] = useState<StarredTab>("songs");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setLoading(true);

    if (isBrowserOffline()) {
      setIsOffline(true);
      Promise.all([getOfflineTracks(), getOfflineAlbums(), getOfflineArtists()])
        .then(([allTracks, allAlbums, allArtists]) => {
          setSongs(allTracks.filter((t) => t.starred));
          setAlbums(allAlbums.filter((a) => a.starred));
          setArtists(allArtists.filter((a) => a.starred));
        })
        .finally(() => setLoading(false));
      return;
    }

    subsonicClient
      .getStarred()
      .then((data) => {
        setSongs(data.song);
        setAlbums(data.album);
        setArtists(data.artist);
        setIsOffline(false);
      })
      .catch(async (err) => {
        console.warn("Online starred failed, fallback to offline:", err);
        setIsOffline(true);
        const [allTracks, allAlbums, allArtists] = await Promise.all([
          getOfflineTracks(),
          getOfflineAlbums(),
          getOfflineArtists(),
        ]);
        setSongs(allTracks.filter((t) => t.starred));
        setAlbums(allAlbums.filter((a) => a.starred));
        setArtists(allArtists.filter((a) => a.starred));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <Heart size={24} className="fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">I Tuoi Preferiti</h1>
              {isOffline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <WifiOff size={11} /> Offline
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {isOffline
                ? "Visualizzazione preferiti tra i brani salvati offline"
                : "Tutti i brani, album e artisti contrassegnati con la stella"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("songs")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "songs" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music2 size={14} /> Brani ({songs.length})
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "albums" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Disc3 size={14} /> Album ({albums.length})
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "artists" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users size={14} /> Artisti ({artists.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === "songs" ? (
        songs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-base font-medium">Nessun brano preferito al momento</p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, idx) => (
              <TrackRow
                key={song.id}
                song={song}
                index={idx}
                queueContext={songs}
                showCover
                showAlbum
              />
            ))}
          </div>
        )
      ) : activeTab === "albums" ? (
        albums.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-base font-medium">Nessun album preferito al momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )
      ) : artists.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-base font-medium">Nessun artista preferito al momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}
