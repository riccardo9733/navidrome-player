export interface TrackPreviewInfo {
  previewUrl?: string;
  artworkUrl?: string;
  artistName?: string;
  trackName?: string;
  collectionName?: string;
}

const previewCache = new Map<string, TrackPreviewInfo | null>();

/**
 * Fetch 30-second audio preview and artwork from iTunes Search API
 */
export async function fetchSongPreview(title: string, artist: string): Promise<TrackPreviewInfo | null> {
  const query = `${title} ${artist}`.trim();
  const cacheKey = query.toLowerCase();

  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey) || null;
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`;
    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      previewCache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    const match = data?.results?.[0];

    if (!match || !match.previewUrl) {
      // Try searching with just the title if title+artist had no exact hits
      const fallbackUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=music&entity=song&limit=3`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const found = fallbackData?.results?.find(
          (r: { previewUrl?: string; artistName?: string }) =>
            r.previewUrl && (r.artistName?.toLowerCase().includes(artist.toLowerCase()) || artist.toLowerCase().includes(r.artistName?.toLowerCase() || ""))
        ) || fallbackData?.results?.[0];

        if (found?.previewUrl) {
          const info: TrackPreviewInfo = {
            previewUrl: found.previewUrl,
            artworkUrl: found.artworkUrl100 ? found.artworkUrl100.replace("100x100bb", "300x300bb") : undefined,
            artistName: found.artistName,
            trackName: found.trackName,
            collectionName: found.collectionName,
          };
          previewCache.set(cacheKey, info);
          return info;
        }
      }

      previewCache.set(cacheKey, null);
      return null;
    }

    const info: TrackPreviewInfo = {
      previewUrl: match.previewUrl,
      artworkUrl: match.artworkUrl100 ? match.artworkUrl100.replace("100x100bb", "300x300bb") : undefined,
      artistName: match.artistName,
      trackName: match.trackName,
      collectionName: match.collectionName,
    };

    previewCache.set(cacheKey, info);
    return info;
  } catch (err) {
    console.warn("[PreviewClient] Failed to fetch iTunes preview for", query, err);
    previewCache.set(cacheKey, null);
    return null;
  }
}
