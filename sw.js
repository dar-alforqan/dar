const CACHE_NAME = "forqan-pwa-v15";

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

// مصادر خارجية نحفظها تلقائيًا بعد أول زيارة: أيقونات Font Awesome + الخطوط + مكتبات Firebase
const CACHEABLE_HOSTS = [
  "cdnjs.cloudflare.com",
  "www.gstatic.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // allSettled: لو ملف واحد غير موجود ما يفشلش التثبيت كله
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const cacheable = sameOrigin || CACHEABLE_HOSTS.includes(url.hostname);

  // أي طلب آخر (Firestore, Auth, Google Drive...) يمر مباشرة بدون تخزين
  if (!cacheable) return;

  // الشبكة أولًا (يبقى المحتوى محدّث)، ولو أوفلاين نرجع للنسخة المحفوظة
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // نخزّن الردود الناجحة (والـ opaque الخاصة بملفات CSS من CDN)
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: sameOrigin }))
  );
});
