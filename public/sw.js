const CACHE_NAME = "navidrome-pwa-v4";
const COVERS_CACHE = "navidrome-covers-v4";

const STATIC_SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Pre-cache App Shell and essential manifest & icons on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_SHELL_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("[SW] Precaching error for:", asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Clean up older caches on activate and immediately claim all clients
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

  // 2. Never intercept dev HMR or Next.js internal development hot-reload files
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("__nextjs_original-stack-frame")
  ) {
    return;
  }

  // 3. Do not intercept audio media range requests (audio is played via IndexedDB Blob URLs or streaming)
  if (
    request.headers.get("range") ||
    url.pathname.includes("/rest/stream.view") ||
    url.pathname.includes(".mp3") ||
    url.pathname.includes(".flac") ||
    url.pathname.includes(".opus") ||
    url.pathname.includes(".aac") ||
    url.pathname.includes(".m4a")
  ) {
    return;
  }

  // 4. Handle Subsonic Cover Art images: Cache first with canonical cover ID matching
  if (url.pathname.includes("/rest/getCoverArt") || url.pathname.includes("/rest/getCoverArt.view")) {
    const coverId = url.searchParams.get("id");
    const canonicalKey = coverId ? `/cover-art/${encodeURIComponent(coverId)}` : null;

    event.respondWith(
      (async () => {
        const coverCache = await caches.open(COVERS_CACHE);

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

  // 5. Handle Navigation / HTML Document requests (PWA Offline fallback)
  // When offline, serve cached page or fallback to the pre-cached App Shell ("/")
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") && request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedExact = await caches.match(request);
          if (cachedExact) return cachedExact;

          const cachedShell = await caches.match("/");
          if (cachedShell) return cachedShell;

          return new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }

  // 6. Handle Next.js Static Build Assets (Chunks, JS, CSS, Media)
  // Next.js hashed files are immutable. Cache-First or Stale-While-Revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 7. Subsonic REST API queries: Network first, JSON error fallback when offline
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

  // 8. Static assets: CSS, JS, fonts, icons, manifest, svg, png, etc.
  const isStaticFile =
    STATIC_SHELL_ASSETS.includes(url.pathname) ||
    url.pathname.match(/\.(svg|png|jpg|jpeg|webp|ico|woff|woff2|ttf|css|js|json)$/i);

  if (isStaticFile) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkRes) => {
            if (networkRes && networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkRes;
          })
          .catch(() => null);

        return cached || fetchPromise;
      })
    );
    return;
  }
});
