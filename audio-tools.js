/* audio-tools.js — أدوات المشغّل الصوتي للمتون: سرعة التشغيل وتكرار مقطع (من نقطة أ إلى ب).
   تُضاف تلقائيًا تحت أي عنصر <audio controls> يظهر في الصفحة (الموجود والذي يُضاف لاحقًا). */
(function () {
  var SPEEDS = [0.75, 1, 1.25, 1.5];

  function fmt(t) {
    t = Math.max(0, Math.floor(t || 0));
    return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  }

  function enhance(audio) {
    if (audio.dataset.tools || audio.hasAttribute("data-no-tools")) return;
    audio.dataset.tools = "1";
    try { audio.preservesPitch = true; audio.webkitPreservesPitch = true; } catch (e) {}

    var box = document.createElement("div");
    box.className = "atools";
    var a = null, b = null;

    function btn(text, label) {
      var x = document.createElement("button");
      x.type = "button"; x.textContent = text;
      if (label) x.setAttribute("aria-label", label);
      return x;
    }

    var row1 = document.createElement("div"); row1.className = "atools-row";
    var l1 = document.createElement("span"); l1.textContent = "السرعة:";
    row1.append(l1);
    var speedBtns = SPEEDS.map(function (s) {
      var x = btn(s + "×");
      x.onclick = function () { audio.playbackRate = s; mark(); };
      row1.append(x);
      return [s, x];
    });
    function mark() {
      speedBtns.forEach(function (p) { p[1].classList.toggle("on", Math.abs(audio.playbackRate - p[0]) < 0.01); });
    }
    audio.addEventListener("ratechange", mark);
    mark();

    var row2 = document.createElement("div"); row2.className = "atools-row";
    var l2 = document.createElement("span"); l2.textContent = "تكرار مقطع:";
    var bA = btn("نقطة أ", "تحديد بداية المقطع"), bB = btn("نقطة ب", "تحديد نهاية المقطع"), bX = btn("إلغاء", "إلغاء التكرار");
    var info = document.createElement("small"); info.className = "atools-info";
    row2.append(l2, bA, bB, bX, info);

    function show() {
      if (a == null) info.textContent = "";
      else if (b == null) info.textContent = "البداية " + fmt(a) + " — حدّد النهاية";
      else info.textContent = "يتكرر من " + fmt(a) + " إلى " + fmt(b);
      bA.classList.toggle("on", a != null); bB.classList.toggle("on", b != null);
    }
    bA.onclick = function () { a = audio.currentTime; if (b != null && b <= a) b = null; show(); };
    bB.onclick = function () {
      if (a == null) { info.textContent = "حدّد نقطة البداية (أ) أولًا"; return; }
      if (audio.currentTime <= a + 0.5) { info.textContent = "النهاية يجب أن تكون بعد البداية"; return; }
      b = audio.currentTime; audio.currentTime = a; if (audio.paused) audio.play().catch(function () {}); show();
    };
    bX.onclick = function () { a = b = null; show(); };
    audio.addEventListener("timeupdate", function () {
      if (a != null && b != null && audio.currentTime >= b) audio.currentTime = a;
    });

    box.append(row1, row2);
    audio.insertAdjacentElement("afterend", box);
  }

  function scan(root) {
    (root.querySelectorAll ? root.querySelectorAll("audio[controls]") : []).forEach(enhance);
    if (root.tagName === "AUDIO" && root.controls) enhance(root);
  }

  function start() {
    scan(document);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
