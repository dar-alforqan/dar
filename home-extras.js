/* home-extras.js — إضافات الصفحة الرئيسية: آية اليوم والتاريخ الهجري.
   (المنشورات تُعرض من news-feed.js)
   كلها اختيارية: لو فشل الاتصال يختفي القسم المعني ولا يتأثر باقي الموقع. */
(function () {
  function $(id) { return document.getElementById(id); }
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  /* ---------- التاريخ الهجري (من المتصفح بدون إنترنت) ---------- */
  function hijri() {
    var el = $("hijriDate");
    if (!el) return;
    try {
      var h = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
      el.textContent = h.replace(/\s*هـ?$/, "") + " هـ";
    } catch (e) { el.textContent = ""; }
  }

  /* ---------- آية اليوم (نص المصحف من واجهة alquran.cloud لضمان صحته) ---------- */
  function ayahOfDay() {
    var box = $("ayahDay"), txt = $("ayahText"), ref = $("ayahRef");
    if (!box || !txt || !ref) return;
    var day = Math.floor(Date.now() / 86400000);
    var key = "dar-ayah-" + day;
    try {
      var c = JSON.parse(localStorage.getItem(key) || "null");
      if (c && c.t) { txt.textContent = c.t; ref.textContent = c.r; box.classList.remove("hidden"); return; }
    } catch (e) {}
    var n = ((day * 37) % 6236) + 1, tries = 0;
    function next() {
      if (tries++ > 10) return;
      fetch("https://api.alquran.cloud/v1/ayah/" + n + "/quran-uthmani")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          var d = j && j.data;
          if (!d || !d.text) return;
          // نتجنب الآيات الطويلة، والآية الأولى من السور (النص قد يبدأ بالبسملة)
          if (d.text.length > 170 || (d.numberInSurah === 1 && d.surah.number !== 1)) { n = (n % 6236) + 1; return next(); }
          var t = "﴿" + d.text + "﴾";
          var r = "سورة " + String(d.surah.name || "").replace(/^سُورَةُ\s*|^سورة\s*/, "") + " · آية " + d.numberInSurah;
          txt.textContent = t; ref.textContent = r;
          box.classList.remove("hidden");
          try { localStorage.setItem(key, JSON.stringify({ t: t, r: r })); } catch (e) {}
        })
        .catch(function () {});
    }
    next();
  }

  ready(function () { hijri(); ayahOfDay(); });
})();
