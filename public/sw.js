// Book of Mormon Cross-References Service Worker
const CACHE_NAME = "bom-crossref-v5";
const STATIC_PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./data/books.json",
  "./data/cross_references.json",
  "./data/external_references.json",
  "./data/external_verses.json",
  "./data/literary_structures.json",
  "./data/study_resources.json"
];

// Install: precache app shell and structural data
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge stale caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for scripture data & assets, Network-First for HTML
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin non-CDN requests and Vite dev server modules
  if ((url.origin !== self.location.origin && !url.hostname.includes("fonts.g")) ||
      url.pathname.startsWith("/src/") ||
      url.pathname.startsWith("/@")) {
    return;
  }

  // Navigation requests: Network-First with cached index.html fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Static assets & data JSON files: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background for JSON data
        if (url.pathname.endsWith(".json")) {
          fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // If not in cache, fetch and store
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "opaque") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
