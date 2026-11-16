const STATIC_CACHE = "forqan-static-v17";
const RUNTIME_CACHE = "forqan-runtime-v17";
const MAX_RUNTIME_ITEMS = 60;

// ملفات الموقع الأساسية (تُحفظ عند التثبيت)
const ASSETS = [
  "./",
  "./index.html",
  "./library.html",
  "./gallery.html",
  "./account.html",
  "./admin.html",
  "./icon.png",
  "./manifest.json",
  "./firebase-config.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

// مصادر خارجية نحفظها تلقائيًا: أيقونات Font Awesome + الخطوط + مكتبات Firebase
const CACHEABLE_HOSTS = [
  "cdnjs.cloudflare.com",
  "www.gstatic.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  const validCaches = [STATIC_CACHE, RUNTIME_CACHE];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => !validCaches.includes(k) && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdnAsset = CACHEABLE_HOSTS.includes(url.hostname);
  const isStorageMedia = url.hostname === "firebasestorage.googleapis.com";

  // 1. التنقل بين صفحات HTML: الشبكة أولاً مع رجوع فوري للنسخة المحفوظة أوفلاين
  if (sameOrigin && e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true })
            .then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // 2. الخطوط والأيقونات ومكتبات Firebase: Stale-While-Revalidate لسرعة الفتح أوفلاين
  if (isCdnAsset || (sameOrigin && !e.request.url.endsWith(".html"))) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: sameOrigin }).then((cached) => {
        const networkFetch = fetch(e.request)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque")) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // 3. صور المعرض والملفات الصوتية المرفوعة على Storage: تخزين ديناميكي محدود الحجم
  if (isStorageMedia) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => {
              c.put(e.request, copy);
              trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS);
            }).catch(() => {});
          }
          return res;
        });
      })
    );
  }
});
