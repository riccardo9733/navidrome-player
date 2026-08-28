const CACHE_NAME = "navidrome-pwa-v2";
const COVERS_CACHE = "navidrome-covers-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== COVERS_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // 2. Never intercept Next.js RSC, Turbopack, HMR or flight streaming requests
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("__nextjs") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("rsc") === "1" ||
    request.headers.get("next-router-prefetch") ||
    request.headers.get("accept")?.includes("text/x-component")
  ) {
    return;
  }

  // 3. Do not intercept audio streaming or media range requests
  if (
    request.headers.get("range") ||
    url.pathname.includes("/rest/stream.view") ||
    url.pathname.includes(".mp3") ||
    url.pathname.includes(".flac") ||
    url.pathname.includes(".opus")
  ) {
    return;
  }

  // 4. Handle Cover Art images: Match by cover ID and Cache first / Network fallback
  if (url.pathname.includes("/rest/getCoverArt") || url.pathname.includes("/rest/getCoverArt.view")) {
    const coverId = url.searchParams.get("id");
    const canonicalKey = coverId ? `/cover-art/${encodeURIComponent(coverId)}` : null;

    event.respondWith(
      (async () => {
        const coverCache = await caches.open(COVERS_CACHE);

        // Helper to find a cached response for this specific cover ID
        const findCached = async () => {
          if (canonicalKey) {
            const byKey = await coverCache.match(canonicalKey);
            if (byKey) return byKey;
          }
          const byReq = await coverCache.match(request);
          if (byReq) return byReq;

          if (coverId) {
            const keys = await coverCache.keys();
            for (const k of keys) {
              const u = new URL(k.url);
              if (u.searchParams.get("id") === coverId) {
                const match = await coverCache.match(k);
                if (match) return match;
              }
            }
          }
          return null;
        };

        // Cache first for fast, persistent covers
        const cached = await findCached();
        if (cached) {
          return cached;
        }

        try {
          const networkRes = await fetch(request);
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            coverCache.put(request, networkRes.clone());
            if (canonicalKey) {
              coverCache.put(canonicalKey, clone);
            }
          }
          return networkRes;
        } catch {
          const fallback = await findCached();
          if (fallback) return fallback;
          return new Response(null, { status: 404 });
        }
      })()
    );
    return;
  }

  // 5. Network first for Subsonic REST queries, fallback to json error if offline
  if (url.pathname.startsWith("/rest/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ "subsonic-response": { status: "failed", error: { code: 0, message: "Offline" } } }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // 6. Cache static shell assets only (manifest, favicon, icons, css, fonts)
  const isStaticAsset =
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.match(/\.(svg|png|jpg|jpeg|webp|ico|woff|woff2|ttf|css)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return res;
          })
        );
      })
    );
  }
});
