import { Album, Artist, Playlist, Song } from "./types";

export const DEMO_SONGS: Song[] = [
  {
    id: "demo-1",
    title: "Midnight City Lights",
    artist: "Neon Skyline",
    artistId: "artist-1",
    album: "Synthetic Dreams",
    albumId: "album-1",
    track: 1,
    year: 2024,
    genre: "Synthwave",
    duration: 215,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    playCount: 142,
    starred: "2024-01-15T12:00:00Z",
    // Free high-quality royalty-free demo audio streams
    path: "https://cdn.freesound.org/previews/515/515615_11306351-lq.mp3",
  },
  {
    id: "demo-2",
    title: "Retrograde Horizon",
    artist: "Neon Skyline",
    artistId: "artist-1",
    album: "Synthetic Dreams",
    albumId: "album-1",
    track: 2,
    year: 2024,
    genre: "Synthwave",
    duration: 184,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    playCount: 98,
    path: "https://cdn.freesound.org/previews/612/612610_11861866-lq.mp3",
  },
  {
    id: "demo-3",
    title: "Cybernetic Pulse",
    artist: "Neon Skyline",
    artistId: "artist-1",
    album: "Synthetic Dreams",
    albumId: "album-1",
    track: 3,
    year: 2024,
    genre: "Synthwave",
    duration: 242,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    playCount: 76,
    starred: "2024-02-10T10:30:00Z",
    path: "https://cdn.freesound.org/previews/469/469446_9998822-lq.mp3",
  },
  {
    id: "demo-4",
    title: "Lofi Rain in Tokyo",
    artist: "Chilled Butter",
    artistId: "artist-2",
    album: "Midnight Coffee",
    albumId: "album-2",
    track: 1,
    year: 2023,
    genre: "Lo-Fi",
    duration: 165,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
    playCount: 230,
    starred: "2024-03-01T08:00:00Z",
    path: "https://cdn.freesound.org/previews/530/530415_11861866-lq.mp3",
  },
  {
    id: "demo-5",
    title: "Warm Blanket & Coffee",
    artist: "Chilled Butter",
    artistId: "artist-2",
    album: "Midnight Coffee",
    albumId: "album-2",
    track: 2,
    year: 2023,
    genre: "Lo-Fi",
    duration: 198,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
    playCount: 185,
    path: "https://cdn.freesound.org/previews/515/515615_11306351-lq.mp3",
  },
  {
    id: "demo-6",
    title: "Celestial Drift",
    artist: "Astral Waves",
    artistId: "artist-3",
    album: "Cosmic Journey",
    albumId: "album-3",
    track: 1,
    year: 2024,
    genre: "Ambient",
    duration: 310,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
    playCount: 312,
    starred: "2024-01-20T15:00:00Z",
    path: "https://cdn.freesound.org/previews/612/612610_11861866-lq.mp3",
  },
  {
    id: "demo-7",
    title: "Supernova Reverie",
    artist: "Astral Waves",
    artistId: "artist-3",
    album: "Cosmic Journey",
    albumId: "album-3",
    track: 2,
    year: 2024,
    genre: "Ambient",
    duration: 275,
    bitRate: 320,
    coverArt: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
    playCount: 140,
    path: "https://cdn.freesound.org/previews/469/469446_9998822-lq.mp3",
  },
];

export const DEMO_ALBUMS: Album[] = [
  {
    id: "album-1",
    name: "Synthetic Dreams",
    title: "Synthetic Dreams",
    artist: "Neon Skyline",
    artistId: "artist-1",
    coverArt: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    songCount: 3,
    duration: 641,
    year: 2024,
    genre: "Synthwave",
    playCount: 316,
    starred: "2024-01-15T12:00:00Z",
    song: DEMO_SONGS.filter((s) => s.albumId === "album-1"),
  },
  {
    id: "album-2",
    name: "Midnight Coffee",
    title: "Midnight Coffee",
    artist: "Chilled Butter",
    artistId: "artist-2",
    coverArt: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
    songCount: 2,
    duration: 363,
    year: 2023,
    genre: "Lo-Fi",
    playCount: 415,
    starred: "2024-03-01T08:00:00Z",
    song: DEMO_SONGS.filter((s) => s.albumId === "album-2"),
  },
  {
    id: "album-3",
    name: "Cosmic Journey",
    title: "Cosmic Journey",
    artist: "Astral Waves",
    artistId: "artist-3",
    coverArt: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80",
    songCount: 2,
    duration: 585,
    year: 2024,
    genre: "Ambient",
    playCount: 452,
    starred: "2024-01-20T15:00:00Z",
    song: DEMO_SONGS.filter((s) => s.albumId === "album-3"),
  },
];

export const DEMO_ARTISTS: Artist[] = [
  {
    id: "artist-1",
    name: "Neon Skyline",
    coverArt: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
    artistImageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
    albumCount: 1,
    starred: "2024-01-15T12:00:00Z",
    album: DEMO_ALBUMS.filter((a) => a.artistId === "artist-1"),
  },
  {
    id: "artist-2",
    name: "Chilled Butter",
    coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    artistImageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    albumCount: 1,
    starred: "2024-03-01T08:00:00Z",
    album: DEMO_ALBUMS.filter((a) => a.artistId === "artist-2"),
  },
  {
    id: "artist-3",
    name: "Astral Waves",
    coverArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    artistImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    albumCount: 1,
    starred: "2024-01-20T15:00:00Z",
    album: DEMO_ALBUMS.filter((a) => a.artistId === "artist-3"),
  },
];

export const DEMO_PLAYLISTS: Playlist[] = [
  {
    id: "playlist-1",
    name: "Late Night Driving",
    comment: "Synthwave & electronic retro vibes for night rides",
    songCount: 4,
    duration: 806,
    coverArt: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    entry: [DEMO_SONGS[0], DEMO_SONGS[1], DEMO_SONGS[2], DEMO_SONGS[5]],
  },
  {
    id: "playlist-2",
    name: "Deep Focus & Study",
    comment: "Calm beats and ambient soundscapes",
    songCount: 4,
    duration: 948,
    coverArt: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
    entry: [DEMO_SONGS[3], DEMO_SONGS[4], DEMO_SONGS[5], DEMO_SONGS[6]],
  },
];

export const DEMO_LYRICS: Record<string, string> = {
  "demo-1": `[00:00.00] (Instrumental Intro - Synth Arpeggios)
[00:15.20] Neon reflections on the wet asphalt
[00:22.50] Driving through the city in the dead of night
[00:30.10] Speeding lights, shadows flashing by
[00:37.40] Electric dreams beneath a purple sky
[00:45.00] We are the night riders
[00:52.30] Lost in the digital glow
[01:00.10] Heartbeats syncing to the bassline
[01:07.40] Where the neon rivers flow
[01:15.00] (Synth Solo & Retrowave Pulse)
[01:30.00] Midnight city lights guide our way
[01:37.50] Chasing the horizon until the dawn of day
[01:45.00] Never slowing down, forever running free
[01:52.50] In this endless synthetic fantasy
[02:00.00] (Outro fading into the night)`,
  "demo-4": `[00:00.00] (Rain falling softly outside the window)
[00:12.00] Steam rises from the porcelain cup
[00:24.00] Raindrops tap against the glass
[00:36.00] Thoughts wandering through the gentle haze
[00:48.00] A peaceful moment in the Tokyo rain
[01:00.00] Piano chords drifting slowly
[01:12.00] Time stands still in this quiet room
[01:24.00] Warm coffee, calm soul
[01:36.00] (Soft vinyl crackle & warm bass outro)`,
};
