const STATIC_CACHE = "forqan-static-v35";
const RUNTIME_CACHE = "forqan-runtime-v35";
const MAX_RUNTIME_ITEMS = 60;

// ملفات الموقع الأساسية (تُحفظ عند التثبيت)
const ASSETS = [
  "./",
  "./index.html",
  "./library.html",
  "./gallery.html",
  "./account.html",
  "./admin.html",
  "./icon-96.png",
  "./icon-256.png",
  "./manifest.json",
  "./firebase-config.js",
  "./theme.css",
  "./theme.js",
  "./privacy.html",
  "./news.html",
  "./site-config.js",
  "./home-extras.js",
  "./news-feed.js",
  "./progress-extras.js",
  "./audio-tools.js",
  "./guardian.html",
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
  // طلبات Range (تشغيل الصوت والفيديو، خصوصًا على سفاري) تُترك للشبكة مباشرة
  if (e.request.headers.has("range")) return;

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdnAsset = CACHEABLE_HOSTS.includes(url.hostname);
  const isStorageMedia = url.hostname === "firebasestorage.googleapis.com";

  // 1. التنقل بين صفحات HTML: نفتح النسخة المحفوظة فورًا ونحدّثها من الشبكة في الخلفية
  //    (فتح فوري عند التنقل بين الرئيسية والمكتبة والمعرض، والتحديث يظهر في الزيارة التالية)
  if (sameOrigin && e.request.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const isRoot = url.pathname.endsWith("/");
      const cached = (await cache.match(e.request, { ignoreSearch: true }))
        || (isRoot ? await cache.match("./index.html") : undefined);
      const refresh = fetch(e.request).then((res) => {
        if (res && res.ok) cache.put(e.request, res.clone()).catch(() => {});
        return res;
      });
      if (cached) {
        e.waitUntil(refresh.catch(() => {}));
        return cached;
      }
      try { return await refresh; }
      catch (err) { return (await cache.match("./index.html")) || Response.error(); }
    })());
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
          .catch(() => cached || Response.error());
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
