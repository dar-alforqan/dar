/* news-feed.js — منشورات الدار بشكل يشبه تغذية فيسبوك (للقراءة فقط).
   تُقرأ من مجموعة news عبر واجهة REST العامة بدون مكتبة Firebase.
   الاستخدام: <div id="newsList" data-limit="3" data-preview="1"></div> أو في صفحة news.html بدون preview. */
(function () {
  var AV = "icon-96.png";
  var LONG = 260;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeUrl(u) { return /^https:\/\//i.test(u || "") ? u : ""; }

  function ago(iso) {
    var t = new Date(iso).getTime();
    if (!t) return "";
    var diff = Math.round((t - Date.now()) / 1000);
    var abs = Math.abs(diff);
    try {
      var rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
      if (abs < 60) return "الآن";
      if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
      if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
      if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
    } catch (e) {}
    return new Date(t).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
  }

  function share(post) {
    var url = location.origin + location.pathname.replace(/[^/]*$/, "") + "news.html#post-" + post.id;
    var text = (post.title ? post.title + " — " : "") + String(post.body || "").slice(0, 120);
    if (navigator.share) { navigator.share({ title: "دار الفرقان", text: text, url: url }).catch(function () {}); return; }
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank", "noopener");
  }

  function card(p, preview) {
    var a = el("article", "post" + (p.pinned ? " pinned" : ""));
    a.id = "post-" + p.id;

    var h = el("div", "post-h");
    var av = el("img", "post-av"); av.src = AV; av.alt = ""; av.width = 44; av.height = 44; av.decoding = "async";
    var who = el("div", "post-who");
    var name = el("b", "", "دار الفرقان");
    name.append(" ");
    var v = el("i", "fa-solid fa-circle-check post-v"); v.setAttribute("aria-label", "حساب رسمي"); name.append(v);
    var meta = el("small", "", ago(p.createdAt));
    if (p.pinned) { var pin = el("span", "post-pin"); pin.innerHTML = '<i class="fa-solid fa-thumbtack"></i> منشور مثبّت'; meta.append(" · ", pin); }
    who.append(name, meta);
    var kind = el("span", "post-kind" + (p.kind === "مسابقة" ? " contest" : p.kind === "إعلان" ? " ann" : ""), p.kind || "منشور");
    h.append(av, who, kind);
    a.append(h);

    var b = el("div", "post-b");
    if (p.title) b.append(el("h3", "", p.title));
    var body = String(p.body || "");
    var txt = el("p", "post-t", body);
    b.append(txt);
    if (body.length > LONG) {
      txt.classList.add("clamp");
      var more = el("button", "post-more", "عرض المزيد"); more.type = "button";
      more.onclick = function () { var c = txt.classList.toggle("clamp"); more.textContent = c ? "عرض المزيد" : "عرض أقل"; };
      b.append(more);
    }
    a.append(b);

    var img = safeUrl(p.imageUrl) || (p.imageData && /^data:image\//.test(p.imageData) ? p.imageData : "");
    if (img) {
      var im = el("img", "post-img"); im.src = img; im.alt = p.title || "صورة المنشور"; im.loading = "lazy"; im.decoding = "async";
      a.append(im);
    } else if (p.hasImage && preview) {
      var ph = el("a", "post-img-ph"); ph.href = "news.html#post-" + p.id;
      ph.innerHTML = '<i class="fa-solid fa-image"></i> يحتوي المنشور على صورة — اضغط للعرض الكامل';
      a.append(ph);
    }

    var link = safeUrl(p.link);
    if (link) {
      var l = el("a", "post-link"); l.href = link; l.target = "_blank"; l.rel = "noopener";
      l.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> ';
      l.append(document.createTextNode(p.kind === "مسابقة" ? "تفاصيل المسابقة والمشاركة" : "فتح الرابط"));
      a.append(l);
    }

    var f = el("div", "post-f");
    var sh = el("button", "", ""); sh.type = "button"; sh.innerHTML = '<i class="fa-solid fa-share-nodes"></i> مشاركة';
    sh.onclick = function () { share(p); };
    f.append(sh);
    a.append(f);
    return a;
  }

  function fetchPosts(limit, preview) {
    return import("./firebase-config.js").then(function (m) {
      var c = m.firebaseConfig;
      var q = {
        from: [{ collectionId: "news" }],
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: limit
      };
      // في معاينة الرئيسية لا نحمّل الصور المخزّنة داخل الوثيقة (أخف بكثير)
      if (preview) q.select = { fields: ["title", "body", "kind", "link", "imageUrl", "hasImage", "pinned", "createdAt"].map(function (f) { return { fieldPath: f }; }) };
      var url = "https://firestore.googleapis.com/v1/projects/" + c.projectId + "/databases/(default)/documents:runQuery?key=" + encodeURIComponent(c.apiKey);
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: q }) })
        .then(function (r) { return r.ok ? r.json() : []; });
    }).then(function (rows) {
      var rest = window.darFirestoreREST;
      return (rows || []).filter(function (x) { return x.document; }).map(function (x) {
        var o = rest.fromFields(x.document.fields || {});
        o.id = x.document.name.split("/").pop();
        return o;
      });
    });
  }

  function init(box) {
    var preview = box.dataset.preview === "1";
    var limit = Number(box.dataset.limit || 20);
    var sec = box.closest("[data-feed-section]");
    fetchPosts(limit, preview).then(function (items) {
      items.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
      if (!items.length) {
        if (sec) sec.classList.add("hidden");
        else { box.replaceChildren(el("div", "empty-state", "")); box.firstChild.innerHTML = "<p>لا توجد منشورات بعد.</p>"; }
        return;
      }
      box.replaceChildren();
      var pageSize = preview ? items.length : 8, shown = 0;
      var btn = el("button", "link feed-more", "عرض منشورات أقدم"); btn.type = "button";
      function more() {
        items.slice(shown, shown + pageSize).forEach(function (p) { box.insertBefore(card(p, preview), btn.parentNode === box ? btn : null); });
        shown += pageSize;
        if (shown >= items.length && btn.parentNode) btn.remove();
      }
      if (!preview && items.length > pageSize) { box.append(btn); btn.onclick = more; }
      more();
      if (sec) sec.classList.remove("hidden");
      var h = location.hash;
      if (h && h.indexOf("#post-") === 0) {
        var t = document.getElementById(h.slice(1));
        if (t) { t.classList.add("flash"); setTimeout(function () { t.scrollIntoView({ block: "center" }); }, 100); }
      }
    }).catch(function () {
      if (sec) sec.classList.add("hidden");
      else box.innerHTML = '<div class="empty-state"><p>تعذر تحميل المنشورات الآن. تأكد من الاتصال وأعد المحاولة.</p></div>';
    });
  }

  function start() { document.querySelectorAll("[data-feed]").forEach(init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
