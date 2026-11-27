/* theme.js — الوضع النهاري/الليلي لكل صفحات دار الفرقان
   - الافتراضي: تلقائي حسب نظام الجهاز، ويتغيّر فورًا لو النظام اتغيّر.
   - زر "ليلي/نهاري" يثبّت اختيارًا يدويًا يتشاركه كل الصفحات.
   - لو اخترت نفس وضع النظام، يرجع للوضع التلقائي.
   لازم يتحمّل أول سطر داخل <body> عشان مايحصلش وميض. */
(function () {
  var KEY = "dar-theme-override";
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  try { localStorage.removeItem("theme"); } catch (e) {} // قيمة قديمة كانت بتثبّت الوضع للأبد

  function saved() {
    try { var v = localStorage.getItem(KEY); return v === "dark" || v === "light" ? v : null; }
    catch (e) { return null; }
  }
  function system() { return mq.matches ? "dark" : "light"; }
  function current() { return saved() || system(); }

  function label() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.innerHTML = current() === "dark"
      ? '<i class="fa-solid fa-sun"></i>نهاري'
      : '<i class="fa-solid fa-moon"></i>ليلي';
  }
  function apply() {
    var t = current();
    if (document.body) document.body.classList.toggle("dark-mode", t === "dark");
    document.documentElement.style.colorScheme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#160709" : "#3A181E");
    label();
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("pageshow", apply);          // الرجوع من الكاش
  window.addEventListener("storage", function (e) {    // تبويب تاني غيّر الوضع
    if (e.key === KEY) apply();
  });
  var onSys = function () { if (!saved()) apply(); };  // النظام اتغيّر
  if (mq.addEventListener) mq.addEventListener("change", onSys);
  else if (mq.addListener) mq.addListener(onSys);

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("#themeToggle");
    if (!btn) return;
    var next = current() === "dark" ? "light" : "dark";
    try {
      if (next === system()) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch (err) {}
    apply();
  });

  /* ===== حجم الخط لكل الصفحات ===== */
  var FKEY = "dar-font-scale", LEVELS = [85, 100, 115, 130, 150];
  function fIdx() {
    try { var v = parseInt(localStorage.getItem(FKEY), 10); var i = LEVELS.indexOf(v); return i < 0 ? 1 : i; }
    catch (e) { return 1; }
  }
  function fApply() {
    var i = fIdx();
    document.documentElement.style.fontSize = LEVELS[i] + "%";
    var d = document.getElementById("fontDec"), n = document.getElementById("fontInc");
    if (d) d.disabled = i === 0;
    if (n) n.disabled = i === LEVELS.length - 1;
  }
  function fSet(i) {
    i = Math.max(0, Math.min(LEVELS.length - 1, i));
    try { if (i === 1) localStorage.removeItem(FKEY); else localStorage.setItem(FKEY, String(LEVELS[i])); } catch (e) {}
    fApply();
  }
  function fBuild() {
    var tg = document.getElementById("themeToggle");
    if (!tg || document.getElementById("fontDec")) return fApply();
    var wrap = document.createElement("span");
    wrap.className = "font-ctl";
    function mk(id, txt, label) {
      var b = document.createElement("button");
      b.id = id; b.type = "button"; b.className = tg.className;
      b.setAttribute("aria-label", label); b.textContent = txt;
      return b;
    }
    wrap.appendChild(mk("fontDec", "أ−", "تصغير الخط"));
    wrap.appendChild(mk("fontInc", "أ+", "تكبير الخط"));
    tg.insertAdjacentElement("afterend", wrap);
    document.getElementById("fontDec").addEventListener("click", function () { fSet(fIdx() - 1); });
    document.getElementById("fontInc").addEventListener("click", function () { fSet(fIdx() + 1); });
    fApply();
  }
  fApply();
  document.addEventListener("DOMContentLoaded", fBuild);
  window.addEventListener("pageshow", fApply);
  window.addEventListener("storage", function (e) { if (e.key === FKEY) fApply(); });

  /* ===== إصلاح مدة التسجيلات الصوتية ===== */
  // تسجيلات المتصفح (webm) تُعرض أحيانًا بمدة غير محدودة ولا يمكن التقديم فيها؛ هذا يحسب المدة الحقيقية.
  document.addEventListener("loadedmetadata", function (e) {
    var a = e.target;
    if (!a || a.tagName !== "AUDIO" || a.duration !== Infinity) return;
    var onTime = function () {
      a.removeEventListener("timeupdate", onTime);
      a.currentTime = 0;
    };
    a.addEventListener("timeupdate", onTime);
    a.currentTime = 1e101;
  }, true);

  /* ===== شريط التنقل السفلي (يظهر على الموبايل فقط عبر CSS) ===== */
  document.addEventListener("DOMContentLoaded", function () {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page === "admin.html" || document.querySelector(".bnav")) return;
    var items = [
      ["index.html", "fa-house", "الرئيسية"],
      ["library.html", "fa-book-open", "المكتبة"],
      ["gallery.html", "fa-images", "المعرض"],
      ["account.html", "fa-user", "حسابي"]
    ];
    var nav = document.createElement("nav");
    nav.className = "bnav";
    nav.setAttribute("aria-label", "التنقل السريع");
    items.forEach(function (it) {
      var a = document.createElement("a");
      a.href = it[0];
      if (page === it[0]) { a.className = "active"; a.setAttribute("aria-current", "page"); }
      a.innerHTML = '<i class="fa-solid ' + it[1] + '"></i><span>' + it[2] + "</span>";
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    document.body.classList.add("has-bnav");
  });

  /* ===== حماية النماذج من السبام والروبوتات =====
     1) حقل مخفي لا يراه الإنسان (الروبوتات تملؤه)  2) فاصل قصير بعد فتح الصفحة  3) فاصل بين الإرسالات */
  window.darGuard = {
    attach: function (form) {
      if (!form || form.dataset.guard) return;
      form.dataset.guard = "1";
      form.dataset.t0 = String(Date.now());
      var hp = document.createElement("input");
      hp.type = "text"; hp.name = "hp_confirm_email"; hp.tabIndex = -1;
      hp.autocomplete = "off"; hp.className = "hp-field";
      hp.setAttribute("aria-hidden", "true");
      form.appendChild(hp);
    },
    // يرجّع "" لو كل شيء سليم، أو رسالة خطأ، أو "__bot__" لو الحقل المخفي ممتلئ
    check: function (form, key, cooldownSec) {
      var hp = form && form.querySelector(".hp-field");
      if (hp && hp.value) return "__bot__";
      var t0 = form ? Number(form.dataset.t0 || 0) : 0;
      if (t0 && Date.now() - t0 < 2500) return "انتظر لحظة ثم أعد المحاولة.";
      if (key) {
        try {
          var last = Number(localStorage.getItem("dar-last-" + key) || 0);
          var wait = Math.ceil((last + cooldownSec * 1000 - Date.now()) / 1000);
          if (wait > 0) return "تم الإرسال قبل قليل. انتظر " + wait + " ثانية ثم أعد المحاولة.";
          localStorage.setItem("dar-last-" + key, String(Date.now()));
        } catch (e) {}
      }
      return "";
    }
  };
})();
