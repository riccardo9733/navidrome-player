const CACHE_NAME = "navidrome-pwa-v1";
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
          if (key !== CACHE_NAME) {
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

  // Do not intercept audio streaming or range requests in SW (let HTML5 audio / IndexedDB handle blobs)
  if (
    request.headers.get("range") ||
    url.pathname.includes("/rest/stream.view") ||
    url.pathname.includes(".mp3") ||
    url.pathname.includes(".flac") ||
    url.pathname.includes(".opus")
  ) {
    return;
  }

  // Network first for Subsonic REST queries, fallback to cache if offline
  if (url.pathname.startsWith("/rest/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ "subsonic-response": { status: "failed", error: { code: 0, message: "Offline" } } }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for static shell assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
