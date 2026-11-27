/* site-config.js — إعدادات الموقع القابلة للتغيير من لوحة الأدمن (بدون تحميل مكتبة Firebase).
   تقرأ وثيقة site_settings/main عبر واجهة REST العامة، وتحفظ نسخة في المتصفح للظهور الفوري.
   تغيّر: رقم الواتساب، البريد، رابط الفيسبوك، وشريط الإعلان العلوي.
   لو فشل الاتصال تبقى القيم المكتوبة في الصفحات كما هي. */
(function () {
  var CACHE = "dar-settings-cache";
  var DEFAULT_WA = "201099262489";
  var settings = {};
  try { settings = JSON.parse(localStorage.getItem(CACHE) || "{}") || {}; } catch (e) {}

  /* تحويل قيم Firestore REST إلى قيم عادية */
  function fv(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("timestampValue" in v) return v.timestampValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(fv);
    if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
    return null;
  }
  function fromFields(f) { var o = {}; Object.keys(f).forEach(function (k) { o[k] = fv(f[k]); }); return o; }
  window.darFirestoreREST = { fv: fv, fromFields: fromFields };

  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function safeUrl(u) { return /^https:\/\//i.test(u || "") ? u : ""; }

  window.darWaNumber = function () { return digits(settings.whatsapp) || DEFAULT_WA; };
  window.darSettings = settings;

  function apply() {
    var wa = window.darWaNumber();
    // روابط الواتساب: نحافظ على نص الرسالة (?text=...) إن وُجد
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      var h = a.getAttribute("href") || "";
      var q = h.indexOf("?") > -1 ? h.slice(h.indexOf("?")) : "";
      a.setAttribute("href", "https://wa.me/" + wa + q);
    });
    if (settings.phone) document.querySelectorAll('[data-s="phone"]').forEach(function (el) { el.textContent = settings.phone; });
    if (settings.email) {
      document.querySelectorAll('[data-s="email"]').forEach(function (el) { el.textContent = settings.email; });
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.setAttribute("href", "mailto:" + settings.email); });
    }
    var fb = safeUrl(settings.facebook);
    if (fb) document.querySelectorAll('a[data-s-href="facebook"]').forEach(function (a) { a.setAttribute("href", fb); });
    announce();
  }

  /* ----- شريط الإعلان ----- */
  function announce() {
    var old = document.querySelector(".annc");
    if (old) old.remove();
    var text = (settings.announcementOn && settings.announcement) ? String(settings.announcement) : "";
    if (!text) return;
    var key = "dar-annc-closed";
    try { if (sessionStorage.getItem(key) === text) return; } catch (e) {}
    var bar = document.createElement("div");
    bar.className = "annc";
    bar.setAttribute("role", "status");
    var icon = document.createElement("i"); icon.className = "fa-solid fa-bullhorn";
    var span = document.createElement("span"); span.textContent = text;
    bar.append(icon, span);
    var link = safeUrl(settings.announcementLink);
    if (link) {
      var a = document.createElement("a"); a.href = link; a.target = "_blank"; a.rel = "noopener"; a.textContent = "التفاصيل";
      bar.append(a);
    }
    var x = document.createElement("button"); x.type = "button"; x.className = "annc-x"; x.setAttribute("aria-label", "إغلاق");
    x.textContent = "×";
    x.onclick = function () { try { sessionStorage.setItem(key, text); } catch (e) {} bar.remove(); };
    bar.append(x);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn();
  }

  ready(function () {
    apply(); // من النسخة المحفوظة فورًا
    import("./firebase-config.js").then(function (m) {
      var c = m.firebaseConfig;
      var url = "https://firestore.googleapis.com/v1/projects/" + c.projectId +
        "/databases/(default)/documents/site_settings/main?key=" + encodeURIComponent(c.apiKey);
      return fetch(url).then(function (r) { return r.ok ? r.json() : null; });
    }).then(function (doc) {
      if (!doc || !doc.fields) return;
      var s = fromFields(doc.fields);
      Object.keys(settings).forEach(function (k) { delete settings[k]; });
      Object.assign(settings, s);
      try { localStorage.setItem(CACHE, JSON.stringify(s)); } catch (e) {}
      apply();
    }).catch(function () {});
  });
})();
