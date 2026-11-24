(function () {
  "use strict";

  /* ------- Paramètres : tout le planning découle d'ici ------- */
  var ANCHOR_DATE = "2026-11-23"; // jour du bayt ANCHOR_LINE (page 18, bayt 1)
  var ANCHOR_LINE = 15;           // numéro global de ce bayt (la page 17 en compte 14)
  var KEY = "afaqus.lamiya.v1";

  /* ------- Le texte : début de chaque bayt (premier hémistiche), page par page ------- */
  var PAGES = [
    [17, ["الحمد لله لا أبغي به بدلا", "ثم الصلاة على خير الورى", "وبعد فالفعل من يحكم تصرفه", "فهاك نظما محيطا بالمهم",
          "بفعل الفعل ذو التجريد", "والضم من فعل الزم", "وجهان فيه من احسب", "وأفرد الكسر فيما من ورث",
          "وثقت مع وري المخ", "ذا الواو فاء أو اليا", "وضم عين معداه", "فذو التعدي بكسر",
          "وبت قطعا ونم", "هبت وذرت وأج"]],
    [18, ["وأل لمعا وصرخا", "وقش قوم عليه الليل", "أي رات طل دم", "قست كذا وع وجهي",
          "ترت وطرت ودرت", "وشطت الدار نس الشيء", "عينا له الواو أو لاما", "لما يدل على فخر",
          "وفتح ما حرف حلق", "في غير هذا لدى الحلقي", "إن لم يضاعف ولم يشهر", "عين المضارع من فعلت",
          "فاكسر أو اضمم إذا", "وانقل لفاء الثلاثي", "أو نونه وإذا فتحا"]],
    [19, ["كأعلم الفعل يأتي بالزيادة", "وافعل ذا ألف في الحشو", "تدحرجت عذيط احلولى", "واحبنطأ احونصل اسلنقى",
          "زهزقت هلقمت رهمست", "ترمست كلتبت جلمطت", "واعلوط اعثوججت بيطرت", "ببعض نأتي المضارع افتتح",
          "وافتحه متصلا بغيره", "أو ما تصدر همز الوصل", "في اليا وفي غيرها", "وكسر ما قبل آخر المضارع",
          "زيادة التاء أولا"]],
    [20, ["إن تسند الفعل للمفعول", "بعين اعتل واجعل", "ثالث ذي همز وصل", "وما لفا نحو باع",
          "من أفعل الأمر أفعل", "أوله وبهمز الوصل", "والهمز قبل لزوم الضم", "وشذ بالحذف مر وخذ",
          "كوزن فاعل اسم فاعل", "ومنه صيغ كسهل والظريف", "وكالفرات وعفر والحصور", "وصيغ من لازم موازن",
          "والشأز والأشنب الجذلان"]],
    [21, ["حملا على غيره لنسبة", "وفاعل صالح للكل", "وباسم فاعل غير ذي الثلاثة", "ميم تضم وإن ما قبل آخره",
          "من ذي الثلاثة بالمفعول", "به عن الأصل واستغنوا", "وللمصادر أوزان أبينها", "فعل وفعل وفعل أو بناء",
          "فعلان فعلان فعلان", "مجردا وبتا التأنيث", "فعالة وفعالة وجيء بهما", "ثم الفعيل وبالتا ذان",
          "وفعلل وفعول مع فعالية", "مع فعلوت فعلى مع فعلنية", "ومفعل مفعل ومفعل", "فعل مقيس المعدى"]],
    [22, ["وما على فعل استحق مصدره", "وقس فعالة أو فعولة", "وما سوى ذاك مسموع", "معناه وزن فعال فليقس",
          "فعالة لخصال والفعالة دع", "لمرة فعلة وفعلة وضعوا", "بكسر ثالث همز الوصل", "واضممه من فعل التا زيد",
          "لفعلل ائت بفعلال", "من لام اعتل للحاويه", "ومن يصل بتفعال تفعل", "وقد يجاء بتفعال لفعل",
          "ما للثلاثي فعيلى مبالغة", "وبالفعليلة افعلل", "لفاعل اجعل فعالا", "ما عينه اعتلت الإفعال منه"]],
    [23, ["من المزال وإن تلحق", "ومرة المصدر الذي تلازمه", "من ذي الثلاثة لا يفعل", "كذاك معتل لام مطلقا",
          "ولا يؤثر كون الواو فاء", "في غير ذا عينه افتح", "مظلمة مطلع المجمع", "مزلة مفرق مضلة",
          "ومعجز وبتاء ثم مهلكة", "معها من احسب وضرب", "والكسر أفرد لمرفق", "من أتو واغفر وعذر",
          "بمفعل اشرق مع اغرب", "واقبر ومن أرب وثلث", "وكالصحيح الذي اليا عينه", "وكاسم مفعول غير ذي الثلاثة"]],
    [24, ["من اسم ما كثر اسم الأرض", "من ذي المزيد كمفعاة", "غير الثلاثي من ذا الوضع", "كمفعل وكمفعال ومفعلة",
          "شذ المدق ومسعط", "ومن نوى عملا بهن", "وقد وفيت بما قد رمت", "ثم الصلاة وتسليم يقارنها",
          "وآله الغر والصحب الكرام", "وأسأل الله من أثواب رحمته", "وأن ييسر لي سعيا أكون به"]]
  ];

  /* Début de chaque bab / fasl (numéro global du bayt), tel que dans le livre */
  var SECTIONS = [
    [1, "المقدمة"],
    [5, "باب أبنية الفعل المجرد وتصاريفه"],
    [28, "فصل في بيان أحكام اتصال الفعل الماضي بتاء الضمير أو نونه"],
    [30, "باب أبنية الفعل المزيد فيه"],
    [37, "فصل في المضارع"],
    [43, "فصل في فعل ما لم يسم فاعله"],
    [47, "فصل في فعل الأمر"],
    [51, "باب أبنية أسماء الفاعلين والمفعولين"],
    [62, "باب أبنية المصادر"],
    [78, "فصل في مصادر ما زاد على الثلاثي"],
    [90, "باب المفعل والمفعل ومعانيهما"],
    [104, "فصل في بناء المفعلة للدلالة على الكثرة"],
    [107, "فصل في بناء الآلة"]
  ];

  /* ------- Dates (UTC, aucun décalage de fuseau) ------- */
  var DAY = 86400000;
  function parse(s) { var p = s.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function iso(ts) { return new Date(ts).toISOString().slice(0, 10); }
  var now = new Date();
  var TODAY = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  var TODAY_ISO = iso(TODAY);
  var ANCHOR = parse(ANCHOR_DATE);
  var F_LONG = new Intl.DateTimeFormat("ar-TN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  var F_MID = new Intl.DateTimeFormat("ar-TN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  var F_SHORT = new Intl.DateTimeFormat("ar-TN", { day: "numeric", month: "long", timeZone: "UTC" });

  /* ------- Accord des nombres en arabe ------- */
  function abyat(n) {
    var m = n % 100;
    if (n === 1) return "بيت واحد";
    if (n === 2) return "بيتان";
    if (m >= 3 && m <= 10) return n + " أبيات";
    if (m >= 11) return n + " بيتا";
    return n + " بيت";
  }
  function byDays(n) {
    var m = n % 100;
    if (n === 1) return "بيوم واحد";
    if (n === 2) return "بيومين";
    if (m >= 3 && m <= 10) return "بـ" + n + " أيام";
    return "بـ" + n + " يوما";
  }

  /* ------- Construction des abyat ------- */
  var LINES = [];
  var g = 0;
  PAGES.forEach(function (pg) {
    pg[1].forEach(function (txt, i) {
      g++;
      LINES.push({
        id: "b" + g,
        n: g,
        page: pg[0],
        line: i + 1,
        text: txt,
        prior: g < ANCHOR_LINE,
        date: g < ANCHOR_LINE ? null : ANCHOR + (g - ANCHOR_LINE) * DAY
      });
    });
  });
  var TOTAL = LINES.length; // 114
  var PLAN_END = LINES[TOTAL - 1].date;

  SECTIONS.forEach(function (s, i) {
    s.from = s[0];
    s.to = i + 1 < SECTIONS.length ? SECTIONS[i + 1][0] - 1 : TOTAL;
  });
  function sectionStartingAt(n) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].from === n) return SECTIONS[i];
    return null;
  }

  /* ------- État enregistré ------- */
  var state = {};
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw === null) {
      // Premier passage : la page 17 est déjà apprise.
      LINES.forEach(function (l) { if (l.prior) state[l.id] = "prior"; });
      save(true);
      return;
    }
    try {
      var obj = JSON.parse(raw);
      state = obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
    } catch (e) { state = {}; }
  }
  function save(silent) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { if (!silent) say("تعذّر الحفظ في هذا المتصفح.", true); }
    refreshDump();
  }
  function isDone(l) { return !!state[l.id]; }

  var todayLine = null;
  LINES.forEach(function (l) { if (l.date === TODAY) todayLine = l; });

  /* ------- Rendu des pages ------- */
  var list = document.getElementById("list");
  var pageBlocks = [];

  function rowEl(l) {
    var row = document.createElement("label");
    row.className = "row";
    row.setAttribute("data-id", l.id);

    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.setAttribute("aria-label", "الصفحة " + l.page + " البيت " + l.line);

    var lbl = document.createElement("span");
    lbl.className = "lbl";
    var v = document.createElement("span");
    v.className = "v";
    v.textContent = l.text + " …";
    var m = document.createElement("span");
    m.className = "m";
    m.textContent = "البيت " + l.line + " · " + l.n + " من " + TOTAL +
      (l.date ? " · " + F_MID.format(l.date) : " · محفوظ قبل البداية");
    lbl.appendChild(v);
    lbl.appendChild(m);

    var tag = document.createElement("span");
    row.appendChild(cb);
    row.appendChild(lbl);
    row.appendChild(tag);

    row.__paint = function () {
      var done = isDone(l);
      cb.checked = done;
      row.classList.toggle("done", done);
      row.classList.toggle("today", !done && l === todayLine);
      if (done) { tag.className = "tag ok"; tag.textContent = "محفوظ"; }
      else if (l === todayLine) { tag.className = "tag now"; tag.textContent = "اليوم"; }
      else if (l.date !== null && l.date < TODAY) { tag.className = "tag late"; tag.textContent = "متأخر"; }
      else { tag.className = "tag"; tag.textContent = ""; }
    };

    cb.addEventListener("change", function () {
      if (cb.checked) state[l.id] = l.prior ? "prior" : TODAY_ISO;
      else delete state[l.id];
      save();
      paintAll();
    });
    return row;
  }

  PAGES.forEach(function (pg) {
    var p = pg[0];
    var lines = LINES.filter(function (l) { return l.page === p; });
    var det = document.createElement("details");
    det.className = "page";
    det.id = "page-" + p;

    var sum = document.createElement("summary");
    var n = document.createElement("span"); n.className = "n"; n.textContent = p;
    var t = document.createElement("span"); t.className = "t";
    var tt = document.createElement("span"); tt.textContent = "الصفحة " + p;
    var em = document.createElement("em");
    var first = lines[0], last = lines[lines.length - 1];
    em.textContent = first.prior
      ? abyat(lines.length) + " · محفوظة قبل البداية"
      : abyat(lines.length) + " · من " + F_SHORT.format(first.date) + " إلى " + F_SHORT.format(last.date);
    t.appendChild(tt); t.appendChild(em);
    var tally = document.createElement("span"); tally.className = "tally";
    sum.appendChild(n); sum.appendChild(t); sum.appendChild(tally);

    var rows = document.createElement("div");
    rows.className = "rows";
    var rowEls = [];
    lines.forEach(function (l) {
      var sec = sectionStartingAt(l.n);
      if (sec) {
        var b = document.createElement("div");
        b.className = "bab";
        b.textContent = sec[1];
        rows.appendChild(b);
      }
      var r = rowEl(l);
      rows.appendChild(r);
      rowEls.push(r);
    });

    det.appendChild(sum);
    det.appendChild(rows);
    list.appendChild(det);
    pageBlocks.push({ page: p, lines: lines, el: det, tally: tally, rows: rowEls });
  });

  /* ------- Objectifs ------- */
  function goalEl(title, sub) {
    var row = document.createElement("div");
    row.className = "goal";
    var gt = document.createElement("div"); gt.className = "gt";
    var b = document.createElement("b"); b.textContent = title;
    var s = document.createElement("span"); s.textContent = sub;
    gt.appendChild(b); gt.appendChild(s);
    var tag = document.createElement("span");
    row.appendChild(gt); row.appendChild(tag);
    return { el: row, tag: tag };
  }
  function goalsFor(container, items) {
    return items.map(function (it) {
      var lines = LINES.filter(function (l) { return l.n >= it.from && l.n <= it.to; });
      var last = lines[lines.length - 1];
      var sub = "الأبيات " + it.from + "–" + it.to + " · " +
        (last.date ? "الهدف: " + F_MID.format(last.date) : "محفوظ قبل البداية");
      var gEl = goalEl(it.title, sub);
      container.appendChild(gEl.el);
      return { lines: lines, last: last, el: gEl.el, tag: gEl.tag };
    });
  }
  var goalsPages = goalsFor(document.getElementById("g-pages"), PAGES.map(function (pg) {
    var ls = LINES.filter(function (l) { return l.page === pg[0]; });
    return { title: "الصفحة " + pg[0], from: ls[0].n, to: ls[ls.length - 1].n };
  }));
  var goalsSecs = goalsFor(document.getElementById("g-secs"), SECTIONS.map(function (s) {
    return { title: s[1], from: s.from, to: s.to };
  }));

  function paintGoals(goals) {
    var nextMarked = false;
    goals.forEach(function (gl) {
      var left = gl.lines.filter(function (l) { return !isDone(l); }).length;
      gl.el.classList.remove("next");
      if (left === 0) { gl.tag.className = "tag ok"; gl.tag.textContent = "تمّ"; }
      else {
        if (!nextMarked) { gl.el.classList.add("next"); nextMarked = true; }
        if (gl.last.date !== null && gl.last.date < TODAY) { gl.tag.className = "tag late"; gl.tag.textContent = "متأخر · بقي " + left; }
        else { gl.tag.className = "tag soon"; gl.tag.textContent = "بقي " + left; }
      }
    });
  }

  /* ------- Compteurs, carte du jour, rythme ------- */
  function paintAll() {
    pageBlocks.forEach(function (pb) {
      pb.rows.forEach(function (r) { r.__paint(); });
      var d = pb.lines.filter(isDone).length;
      pb.tally.textContent = d + "/" + pb.lines.length;
      pb.el.classList.toggle("is-done", d === pb.lines.length);
      pb.el.classList.toggle("is-now", !!todayLine && todayLine.page === pb.page && d < pb.lines.length);
    });
    paintGoals(goalsPages);
    paintGoals(goalsSecs);

    var done = LINES.filter(isDone).length;
    var left = TOTAL - done;
    document.getElementById("s-done").textContent = done + " / " + TOTAL;
    document.getElementById("s-left").textContent = left === 0 ? "لا شيء" : abyat(left);
    document.getElementById("s-end").textContent = F_LONG.format(PLAN_END);
    document.getElementById("s-bar").style.width = (done / TOTAL * 100).toFixed(1) + "%";

    // Rythme réel : 1 bayt par jour à partir d'aujourd'hui, ou de demain si le bayt du jour est déjà coché.
    var pace = document.getElementById("s-pace");
    if (left === 0) {
      pace.textContent = "";
      var bEnd = document.createElement("b");
      bEnd.textContent = "تمّ حفظ المتن كاملا — الحمد لله.";
      pace.appendChild(bEnd);
    } else {
      var start = todayLine && isDone(todayLine) ? TODAY + DAY : TODAY;
      var proj = start + (left - 1) * DAY;
      var diff = Math.round((proj - PLAN_END) / DAY);
      pace.textContent = "";
      if (diff === 0) {
        pace.appendChild(document.createTextNode("أنت على الموعد: الختم "));
        var b0 = document.createElement("b"); b0.textContent = F_LONG.format(proj); pace.appendChild(b0);
      } else {
        pace.appendChild(document.createTextNode("بوتيرتك الحالية: الختم "));
        var b1 = document.createElement("b"); b1.textContent = F_LONG.format(proj); pace.appendChild(b1);
        pace.appendChild(document.createTextNode(diff > 0 ? " (متأخر " + byDays(diff) + ")" : " (متقدّم " + byDays(-diff) + ")"));
      }
    }

    // Carte du jour
    var label = document.getElementById("t-label"), where = document.getElementById("t-where"),
        verse = document.getElementById("t-verse"), when = document.getElementById("t-when"),
        warn = document.getElementById("t-warn");
    var focus = todayLine;
    if (focus && isDone(focus)) {
      var next = LINES.filter(function (l) { return !isDone(l) && l.date !== null && l.date > TODAY; })[0];
      label.textContent = "أتممت ورد اليوم ✓ — ورد الغد";
      focus = next || null;
    } else if (focus) {
      label.textContent = "ورد اليوم";
    } else {
      var firstLeft = LINES.filter(function (l) { return !isDone(l); })[0];
      label.textContent = firstLeft ? "البيت التالي" : "تمّ الحفظ";
      focus = firstLeft || null;
    }
    if (focus) {
      where.textContent = "الصفحة " + focus.page + " — البيت " + focus.line;
      verse.textContent = focus.text + " …";
      when.textContent = focus.date ? F_LONG.format(focus.date) : "";
    } else {
      where.textContent = "الحمد لله";
      verse.textContent = "";
      when.textContent = "";
    }
    var late = LINES.filter(function (l) { return !isDone(l) && l.date !== null && l.date < TODAY; });
    if (late.length) {
      warn.hidden = false;
      warn.textContent = late.length === 1
        ? "عليك بيت متأخر: الصفحة " + late[0].page + " — البيت " + late[0].line + ". علّمه إن كنت حفظته."
        : "أبيات متأخرة: " + late.length + " — أوّلها الصفحة " + late[0].page + " البيت " + late[0].line + ".";
    } else {
      warn.hidden = true;
    }
  }

  /* ------- Boutons ------- */
  function say(text, isErr) {
    var m = document.getElementById("msg");
    m.textContent = text;
    m.style.color = isErr ? "#B91C1C" : "#047857";
    if (text) setTimeout(function () { if (m.textContent === text) m.textContent = ""; }, 4000);
  }
  function openPage(p, scroll) {
    var el = document.getElementById("page-" + p);
    if (!el) return;
    el.open = true;
    if (scroll) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("b-today").addEventListener("click", function () {
    var target = todayLine || LINES.filter(function (l) { return !isDone(l); })[0] || LINES[TOTAL - 1];
    openPage(target.page, true);
  });
  document.getElementById("b-open").addEventListener("click", function () {
    pageBlocks.forEach(function (pb) { pb.el.open = true; });
  });
  document.getElementById("b-close").addEventListener("click", function () {
    pageBlocks.forEach(function (pb) { pb.el.open = false; });
  });

  var dump = document.getElementById("dump");
  var bPaste = document.getElementById("b-paste"), bRestore = document.getElementById("b-restore"),
      bCancel = document.getElementById("b-cancel"), bCopy = document.getElementById("b-copy");

  function refreshDump() { if (dump.readOnly) dump.value = JSON.stringify(state); }
  function lockDump() {
    dump.readOnly = true;
    bPaste.hidden = false; bCopy.hidden = false;
    bRestore.hidden = true; bCancel.hidden = true;
    refreshDump();
  }

  bCopy.addEventListener("click", function () {
    var txt = dump.value;
    function fallback() {
      dump.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      say(ok ? "تمّ النسخ." : "تعذّر النسخ — حدّد النص يدويا.", !ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { say("تمّ النسخ."); }, fallback);
    } else { fallback(); }
  });
  bPaste.addEventListener("click", function () {
    dump.readOnly = false;
    dump.value = "";
    dump.placeholder = "الصق هنا النص الذي نسخته سابقا";
    bPaste.hidden = true; bCopy.hidden = true;
    bRestore.hidden = false; bCancel.hidden = false;
    dump.focus();
  });
  bCancel.addEventListener("click", function () { lockDump(); say(""); });
  bRestore.addEventListener("click", function () {
    var txt = dump.value.trim();
    if (!txt) { say("الصق النص أوّلا.", true); return; }
    var obj;
    try { obj = JSON.parse(txt); } catch (e) { say("هذا النص ليس نسخة احتياطية صالحة.", true); return; }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) { say("هذا النص ليس نسخة احتياطية صالحة.", true); return; }
    var next = {}, n = 0;
    LINES.forEach(function (l) { if (obj[l.id]) { next[l.id] = obj[l.id]; n++; } });
    if (!n) { say("لم أجد أي بيت في هذا النص.", true); return; }
    state = next;
    save();
    lockDump();
    paintAll();
    say("تمّ استرجاع " + abyat(n) + ".");
  });

  /* ------- Démarrage ------- */
  load();
  lockDump();
  paintAll();
  openPage(todayLine ? todayLine.page : (LINES.filter(function (l) { return !isDone(l); })[0] || LINES[TOTAL - 1]).page, false);
})();
