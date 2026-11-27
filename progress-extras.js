/* progress-extras.js — خريطة الحفظ، شارات الإنجاز، والتقرير الشهري (تُستخدم في حساب الطالب وبوابة ولي الأمر).
   تعتمد على سجل المتابعة (progress): النوع، السورة، الآيات، التقييم، التاريخ. */
(function () {
  var SURAHS = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];
  var AYAHS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
  var TOTAL = 6236;
  var RATING_PCT = { "ممتاز": 100, "جيد جدًا": 80, "جيد": 60, "يحتاج مراجعة": 40 };
  var MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  function normDigits(s) {
    return String(s || "")
      .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); })
      .replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); });
  }
  function surahIndex(name) { return SURAHS.indexOf(String(name || "").trim()); }

  /* يرجّع: {full:true} أو {a,b} أو null (غير مفهوم، مثل أرقام الصفحات) */
  function parseRange(text, total) {
    var s = normDigits(text);
    if (/كامل|الكل|بالكامل|السورة كلها/.test(s)) return { full: true };
    if (/صفح|ص\s*\d/.test(s)) return null;
    var m = s.match(/(\d+)\D+(\d+)/);
    var a, b;
    if (m) { a = +m[1]; b = +m[2]; if (a > b) { var t = a; a = b; b = t; } }
    else { m = s.match(/(\d+)/); if (!m) return null; a = b = +m[1]; }
    a = Math.max(1, Math.min(a, total)); b = Math.max(1, Math.min(b, total));
    return { a: a, b: b };
  }

  /* تغطية الحفظ لكل سورة من سجلات "حفظ جديد" */
  function coverage(rows) {
    var per = SURAHS.map(function (n, i) { return { name: n, total: AYAHS[i], ints: [], full: false, touched: false, covered: 0 }; });
    (rows || []).forEach(function (r) {
      if (r.type !== "حفظ جديد") return;
      var i = surahIndex(r.surah); if (i < 0) return;
      var p = per[i]; p.touched = true;
      var pr = parseRange(r.range, p.total);
      if (!pr) return;
      if (pr.full) p.full = true; else p.ints.push([pr.a, pr.b]);
    });
    var totalCovered = 0, fullCount = 0;
    per.forEach(function (p) {
      if (p.full) p.covered = p.total;
      else {
        p.ints.sort(function (x, y) { return x[0] - y[0]; });
        var cur = null, sum = 0;
        p.ints.forEach(function (iv) {
          if (!cur) cur = iv.slice();
          else if (iv[0] <= cur[1] + 1) cur[1] = Math.max(cur[1], iv[1]);
          else { sum += cur[1] - cur[0] + 1; cur = iv.slice(); }
        });
        if (cur) sum += cur[1] - cur[0] + 1;
        p.covered = Math.min(sum, p.total);
      }
      p.pct = Math.round(p.covered * 100 / p.total);
      p.isFull = p.covered >= p.total;
      if (p.isFull) fullCount++;
      totalCovered += p.covered;
    });
    return { per: per, totalCovered: totalCovered, fullCount: fullCount };
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ---------- خريطة الحفظ ---------- */
  function renderMap(container, rows) {
    container.replaceChildren();
    var cov = coverage(rows);
    var pct = (cov.totalCovered * 100 / TOTAL);
    var details = el("details", "mq");
    var sum = el("summary", "", "");
    sum.innerHTML = '<i class="fa-solid fa-map"></i> خريطة الحفظ — <b></b>';
    sum.querySelector("b").textContent = cov.totalCovered + " آية من 6236 (" + (pct < 1 && cov.totalCovered ? "<1" : Math.round(pct)) + "٪)";
    details.append(sum);
    var legend = el("div", "mq-legend");
    legend.innerHTML = '<span><i class="mq-dot none"></i>لم يبدأ</span><span><i class="mq-dot part"></i>جزئي</span><span><i class="mq-dot full"></i>تمّ حفظها</span>';
    details.append(legend);
    var grid = el("div", "mq-grid");
    cov.per.forEach(function (p, i) {
      var t = el("div", "mq-tile " + (p.isFull ? "full" : p.touched ? "part" : "none"));
      if (p.touched && !p.isFull) t.style.setProperty("--p", Math.max(p.pct, 8));
      t.title = p.name + ": " + p.covered + " / " + p.total;
      t.append(el("small", "", String(i + 1)), el("span", "", p.name));
      grid.append(t);
    });
    details.append(grid);
    container.append(details);
    return cov;
  }

  /* ---------- شارات الإنجاز ---------- */
  function badgeList(rows, cov) {
    rows = rows || [];
    var n = rows.length;
    var excellent = rows.filter(function (r) { return r.rating === "ممتاز"; }).length;
    var reviews = rows.filter(function (r) { return r.type === "مراجعة"; }).length;
    var juzAmma = cov.per.slice(77).every(function (p) { return p.isFull; });
    return [
      { id: "s1", icon: "fa-seedling", name: "بداية الرحلة", desc: "أول جلسة مسجّلة", ok: n >= 1 },
      { id: "s10", icon: "fa-person-walking", name: "عشر جلسات", desc: "10 جلسات", ok: n >= 10 },
      { id: "s25", icon: "fa-mountain", name: "خمس وعشرون جلسة", desc: "25 جلسة", ok: n >= 25 },
      { id: "s50", icon: "fa-gem", name: "خمسون جلسة", desc: "50 جلسة", ok: n >= 50 },
      { id: "e1", icon: "fa-star", name: "تقييم ممتاز", desc: "أول تقييم ممتاز", ok: excellent >= 1 },
      { id: "e5", icon: "fa-stars", name: "خمسة ممتاز", desc: "5 تقييمات ممتازة", ok: excellent >= 5 },
      { id: "r10", icon: "fa-rotate", name: "محافظ على المراجعة", desc: "10 جلسات مراجعة", ok: reviews >= 10 },
      { id: "a100", icon: "fa-book-open", name: "مئة آية", desc: "حفظ 100 آية", ok: cov.totalCovered >= 100 },
      { id: "a1000", icon: "fa-book-quran", name: "ألف آية", desc: "حفظ 1000 آية", ok: cov.totalCovered >= 1000 },
      { id: "f1", icon: "fa-circle-check", name: "أتممت سورة", desc: "حفظ سورة كاملة", ok: cov.fullCount >= 1 },
      { id: "f5", icon: "fa-layer-group", name: "خمس سور", desc: "حفظ 5 سور كاملة", ok: cov.fullCount >= 5 },
      { id: "juz", icon: "fa-crown", name: "أتممت جزء عمّ", desc: "حفظ سور جزء عمّ كلها", ok: juzAmma }
    ];
  }
  function renderBadges(container, rows, cov) {
    container.replaceChildren();
    var list = badgeList(rows, cov);
    var got = list.filter(function (b) { return b.ok; }).length;
    var head = el("div", "bdg-head");
    head.innerHTML = '<i class="fa-solid fa-medal"></i> الإنجازات — <b></b>';
    head.querySelector("b").textContent = got + " من " + list.length + " شارة";
    container.append(head);
    var grid = el("div", "bdg-grid");
    list.forEach(function (b) {
      var d = el("div", "bdg" + (b.ok ? " on" : ""));
      d.title = b.desc;
      var i = el("span", "bdg-ic"); i.innerHTML = '<i class="fa-solid ' + (b.ok ? b.icon : "fa-lock") + '"></i>';
      d.append(i, el("span", "bdg-n", b.name));
      grid.append(d);
    });
    container.append(grid);
  }

  /* ---------- التقرير الشهري ---------- */
  function ymOf(r) { if (!r.createdAt) return ""; var d = r.createdAt.toDate(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function monthsOf(rows) {
    var set = {}; (rows || []).forEach(function (r) { var k = ymOf(r); if (k) set[k] = 1; });
    var cur = new Date(); set[cur.getFullYear() + "-" + String(cur.getMonth() + 1).padStart(2, "0")] = 1;
    return Object.keys(set).sort().reverse();
  }
  function monthLabel(ym) { var p = ym.split("-"); return MONTHS[+p[1] - 1] + " " + p[0]; }
  function monthStats(rows, ym) {
    var rs = (rows || []).filter(function (r) { return ymOf(r) === ym; });
    var ayat = 0;
    rs.forEach(function (r) {
      if (r.type !== "حفظ جديد") return;
      var i = surahIndex(r.surah); if (i < 0) return;
      var pr = parseRange(r.range, AYAHS[i]);
      if (pr) ayat += pr.full ? AYAHS[i] : (pr.b - pr.a + 1);
    });
    var rated = rs.filter(function (r) { return RATING_PCT[r.rating]; });
    var avg = rated.length ? Math.round(rated.reduce(function (s, r) { return s + RATING_PCT[r.rating]; }, 0) / rated.length) : null;
    return {
      rows: rs, sessions: rs.length, ayat: ayat,
      reviews: rs.filter(function (r) { return r.type === "مراجعة"; }).length,
      avg: avg
    };
  }
  function avgLabel(a) { return a == null ? "—" : a >= 90 ? "ممتاز" : a >= 70 ? "جيد جدًا" : a >= 50 ? "جيد" : "يحتاج مراجعة"; }
  function fmtDate(r) { return r.createdAt ? r.createdAt.toDate().toLocaleDateString("ar-EG") : ""; }

  function reportText(rows, name, ym) {
    var s = monthStats(rows, ym);
    var t = "تقرير شهر " + monthLabel(ym) + " للطالب " + name + " — دار الفرقان\n";
    t += "الجلسات: " + s.sessions + " | آيات الحفظ الجديد: " + s.ayat + " | جلسات المراجعة: " + s.reviews + " | المستوى العام: " + avgLabel(s.avg);
    var last = s.rows.slice(0, 3).map(function (r) { return "• " + r.type + " — سورة " + r.surah + (r.range ? " (" + r.range + ")" : "") + (r.rating ? " — " + r.rating : ""); });
    if (last.length) t += "\nآخر الجلسات:\n" + last.join("\n");
    return t;
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function openReport(rows, name, ym) {
    var s = monthStats(rows, ym);
    var logo = new URL("icon-256.png", location.href).href;
    var trs = s.rows.map(function (r) {
      return "<tr><td>" + esc(fmtDate(r)) + "</td><td>" + esc(r.type) + "</td><td>" + esc(r.surah) + "</td><td>" + esc(r.range || "") + "</td><td>" + esc(r.rating || "") + "</td><td>" + esc(r.note || "") + "</td></tr>";
    }).join("") || '<tr><td colspan="6" style="text-align:center;padding:18px">لا توجد جلسات مسجّلة في هذا الشهر.</td></tr>';
    var html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير ' + esc(monthLabel(ym)) + " - " + esc(name) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">' +
      '<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Cairo,Tahoma,Arial,sans-serif;color:#2B1015;margin:0;padding:18px;background:#fff}' +
      '.hd{display:flex;align-items:center;gap:14px;border-bottom:4px solid #FAC81B;padding-bottom:12px;margin-bottom:16px}.hd img{width:70px;height:70px;border-radius:50%}' +
      'h1{margin:0;color:#3A181E;font-size:1.5rem}.sub{color:#6B4A47;margin:2px 0 0}' +
      '.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.t{border:1px solid #E4C060;border-top:4px solid #FAC81B;border-radius:8px;padding:10px;text-align:center}' +
      '.t b{display:block;font-size:1.4rem;color:#3A181E}.t span{font-size:.8rem;color:#6B4A47}' +
      'table{width:100%;border-collapse:collapse;font-size:.85rem}th{background:#3A181E;color:#FAC81B;padding:8px;text-align:right}td{border-bottom:1px solid #E6CDBE;padding:7px 8px;vertical-align:top}' +
      '.ft{margin-top:18px;color:#6B4A47;font-size:.8rem;text-align:center}.pr{margin:14px 0;text-align:center}@media print{.pr{display:none}}</style></head><body>' +
      '<div class="hd"><img src="' + logo + '" alt=""><div><h1>تقرير الطالب — ' + esc(monthLabel(ym)) + '</h1><p class="sub">الطالب: <b>' + esc(name) + '</b> · دار الفرقان لتحفيظ القرآن الكريم</p></div></div>' +
      '<div class="tiles"><div class="t"><b>' + s.sessions + '</b><span>عدد الجلسات</span></div><div class="t"><b>' + s.ayat + '</b><span>آيات الحفظ الجديد</span></div><div class="t"><b>' + s.reviews + '</b><span>جلسات المراجعة</span></div><div class="t"><b>' + esc(avgLabel(s.avg)) + '</b><span>المستوى العام</span></div></div>' +
      '<table><thead><tr><th>التاريخ</th><th>النوع</th><th>السورة</th><th>الآيات</th><th>التقييم</th><th>ملاحظة الشيخ</th></tr></thead><tbody>' + trs + '</tbody></table>' +
      '<div class="ft">صدر بتاريخ ' + esc(new Date().toLocaleDateString("ar-EG")) + ' — «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»</div>' +
      '<div class="pr"><button onclick="print()" style="padding:10px 22px;font:inherit;background:#FAC81B;border:0;border-radius:20px;font-weight:700;cursor:pointer">طباعة / حفظ PDF</button></div></body></html>';
    var url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    var w = window.open(url, "_blank");
    if (!w) location.href = url;
  }

  /* واجهة جاهزة: شريط اختيار الشهر مع أزرار الطباعة والواتساب */
  function renderReportBar(container, rows, name) {
    container.replaceChildren();
    var months = monthsOf(rows);
    var bar = el("div", "rpt-bar");
    var lab = el("span", "", "تقرير شهري:");
    var sel = el("select"); sel.setAttribute("aria-label", "الشهر");
    months.forEach(function (m) { var o = el("option", "", monthLabel(m)); o.value = m; sel.append(o); });
    var pr = el("button", "link"); pr.type = "button"; pr.innerHTML = '<i class="fa-solid fa-print"></i>طباعة / PDF';
    var wa = el("button", "link"); wa.type = "button"; wa.innerHTML = '<i class="fa-brands fa-whatsapp"></i>مشاركة';
    pr.onclick = function () { openReport(rows, name, sel.value); };
    wa.onclick = function () { window.open("https://wa.me/?text=" + encodeURIComponent(reportText(rows, name, sel.value)), "_blank", "noopener"); };
    bar.append(lab, sel, pr, wa);
    container.append(bar);
  }

  window.DarProgress = {
    SURAHS: SURAHS, AYAHS: AYAHS, coverage: coverage, renderMap: renderMap, renderBadges: renderBadges,
    renderReportBar: renderReportBar, openReport: openReport, reportText: reportText, parseRange: parseRange
  };
})();
