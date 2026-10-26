(function () {
  "use strict";

  /* ------- Paramètres : tout le calendrier découle d'ici ------- */
  var ANCHOR_END = "2026-10-26";   // fin du thumn 1 du hizb 9 (lundi)
  var DAYS       = 5;              // durée d'un thumn, en jours
  var HIZB_FROM  = 9, HIZB_TO = 60;
  var KEY        = "afaqus.quran.v1";

  var AR_ORD = ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن"];
  var FR_ORD = ["1ᵉʳ","2ᵉ","3ᵉ","4ᵉ","5ᵉ","6ᵉ","7ᵉ","8ᵉ"];

  function arNum(n) {
    return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[+d]; });
  }

  /* ------- Dates (UTC pour éviter tout décalage de fuseau) ------- */
  function parse(s) {
    var p = s.split("-");
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(ts, n) { return ts + n * 86400000; }
  function iso(ts) { return new Date(ts).toISOString().slice(0, 10); }
  function todayTs() {
    var d = new Date();
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }
  var FMT_LONG  = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  var FMT_SHORT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  var FMT_MY    = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

  /* ------- Construction du planning ------- */
  var anchorStart = addDays(parse(ANCHOR_END), -(DAYS - 1));
  var PLAN = [];
  var k = 0;
  for (var h = HIZB_FROM; h <= HIZB_TO; h++) {
    for (var t = 1; t <= 8; t++) {
      var start = addDays(anchorStart, k * DAYS);
      PLAN.push({
        id: h + "-" + t,
        hizb: h,
        thumn: t,
        juz: Math.ceil(h / 2),
        start: start,
        end: addDays(start, DAYS - 1)
      });
      k++;
    }
  }

  /* ------- État enregistré ------- */
  var state = {};
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : {};
      if (!state || typeof state !== "object" || Array.isArray(state)) state = {};
    } catch (e) { state = {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { say("Impossible d'enregistrer dans ce navigateur.", true); }
    refreshDump();
  }
  load();

  var TODAY = todayTs();
  var current = null;
  for (var i = 0; i < PLAN.length; i++) {
    if (TODAY >= PLAN[i].start && TODAY <= PLAN[i].end) { current = PLAN[i]; break; }
  }
  if (!current) current = TODAY < PLAN[0].start ? PLAN[0] : PLAN[PLAN.length - 1];

  /* ------- Rendu ------- */
  var list = document.getElementById("list");

  function rowEl(item) {
    var row = document.createElement("label");
    row.className = "row";
    row.setAttribute("data-id", item.id);

    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!state[item.id];
    cb.setAttribute("aria-label", "Thumn " + item.thumn + " du hizb " + item.hizb);

    var lbl = document.createElement("div");
    lbl.className = "lbl";
    var b = document.createElement("b");
    b.textContent = FR_ORD[item.thumn - 1] + " thumn — hizb " + item.hizb;
    var sp = document.createElement("span");
    sp.textContent = FMT_SHORT.format(item.start) + " → " + FMT_SHORT.format(item.end);
    lbl.appendChild(b);
    lbl.appendChild(sp);

    var tag = document.createElement("span");
    tag.className = "tag";

    row.appendChild(cb);
    row.appendChild(lbl);
    row.appendChild(tag);

    function paint() {
      var done = !!state[item.id];
      row.classList.toggle("done", done);
      row.classList.toggle("today", !done && item === current);
      if (done) {
        tag.className = "tag ok";
        tag.textContent = state[item.id] === true ? "fait" : "fait";
      } else if (item === current) {
        tag.className = "tag now";
        tag.textContent = "en cours";
      } else if (item.end < TODAY) {
        tag.className = "tag late";
        tag.textContent = "à rattraper";
      } else {
        tag.className = "tag";
        tag.textContent = "";
      }
    }

    cb.addEventListener("change", function () {
      if (cb.checked) state[item.id] = iso(TODAY);
      else delete state[item.id];
      save();
      paint();
      updateAll();
    });

    row.__paint = paint;
    paint();
    return row;
  }

  var groups = [];
  for (var hh = HIZB_FROM; hh <= HIZB_TO; hh++) {
    (function (hizb) {
      var items = PLAN.filter(function (p) { return p.hizb === hizb; });

      var det = document.createElement("details");
      det.className = "hizb";
      if (hizb === current.hizb) det.open = true;
      det.id = "hizb-" + hizb;

      var sum = document.createElement("summary");
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = hizb;
      var tbox = document.createElement("span");
      tbox.className = "t";
      var tt = document.createElement("span");
      tt.innerHTML = "Hizb " + hizb + " &nbsp;<span class=\"ar\" dir=\"rtl\">الحزب " + arNum(hizb) + "</span>";
      var em = document.createElement("em");
      em.textContent = "Juz " + items[0].juz + " · " + FMT_MY.format(items[0].start) + " → " + FMT_MY.format(items[7].end);
      tbox.appendChild(tt);
      tbox.appendChild(em);
      var tally = document.createElement("span");
      tally.className = "tally";
      sum.appendChild(n);
      sum.appendChild(tbox);
      sum.appendChild(tally);

      var rows = document.createElement("div");
      rows.className = "rows";
      var rowEls = items.map(function (it) {
        var r = rowEl(it);
        rows.appendChild(r);
        return r;
      });

      det.appendChild(sum);
      det.appendChild(rows);
      list.appendChild(det);

      groups.push({
        hizb: hizb, items: items, el: det, tally: tally, rows: rowEls,
        update: function () {
          var d = items.filter(function (it) { return !!state[it.id]; }).length;
          tally.textContent = d + "/8";
          det.classList.toggle("is-done", d === 8);
          det.classList.toggle("is-now", hizb === current.hizb && d < 8);
        }
      });
    })(hh);
  }

  /* ------- Compteurs globaux ------- */
  function updateAll() {
    var done = PLAN.filter(function (p) { return !!state[p.id]; }).length;
    var total = PLAN.length;
    document.getElementById("s-done").textContent = done + " / " + total;
    document.getElementById("s-left").textContent = (total - done) + " thumn";
    document.getElementById("s-bar").style.width = (done / total * 100).toFixed(1) + "%";

    // Fin prévue : on repart d'aujourd'hui, 5 jours par thumn restant
    var left = total - done;
    var endTs = addDays(TODAY, left * DAYS);
    document.getElementById("s-end").textContent =
      new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(endTs);

    groups.forEach(function (g) { g.update(); });
  }

  document.getElementById("n-title").textContent =
    FR_ORD[current.thumn - 1] + " thumn du hizb " + current.hizb + " (juz " + current.juz + ")";
  document.getElementById("n-dates").textContent =
    "Du " + FMT_LONG.format(current.start) + " au " + FMT_LONG.format(current.end);

  updateAll();

  /* ------- Boutons ------- */
  function say(text, isErr) {
    var m = document.getElementById("msg");
    m.textContent = text;
    m.style.color = isErr ? "#B91C1C" : "#047857";
    if (text) setTimeout(function () { if (m.textContent === text) m.textContent = ""; }, 4000);
  }

  document.getElementById("b-now").addEventListener("click", function () {
    var el = document.getElementById("hizb-" + current.hizb);
    if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  });
  document.getElementById("b-open").addEventListener("click", function () {
    groups.forEach(function (g) { g.el.open = true; });
  });
  document.getElementById("b-close").addEventListener("click", function () {
    groups.forEach(function (g) { g.el.open = false; });
  });

  function refreshDump() {
    document.getElementById("dump").value = JSON.stringify(state);
  }
  refreshDump();

  document.getElementById("b-copy").addEventListener("click", function () {
    var ta = document.getElementById("dump");
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    if (navigator.clipboard && !ok) {
      navigator.clipboard.writeText(ta.value).then(
        function () { say("Copié."); },
        function () { say("Copie impossible — sélectionne le texte à la main.", true); }
      );
    } else {
      say(ok ? "Copié." : "Copie impossible — sélectionne le texte à la main.", !ok);
    }
  });

  document.getElementById("b-restore").addEventListener("click", function () {
    var txt = document.getElementById("dump").value.trim();
    if (!txt) { say("Colle d'abord une sauvegarde.", true); return; }
    var obj;
    try { obj = JSON.parse(txt); } catch (e) { say("Texte illisible.", true); return; }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) { say("Texte illisible.", true); return; }
    var valid = {}, n = 0;
    PLAN.forEach(function (p) { if (obj[p.id]) { valid[p.id] = obj[p.id]; n++; } });
    state = valid;
    save();
    groups.forEach(function (g) { g.rows.forEach(function (r) { r.__paint(); }); });
    document.querySelectorAll('.row input[type=checkbox]').forEach(function (cb) {
      var id = cb.closest(".row").getAttribute("data-id");
      cb.checked = !!state[id];
    });
    updateAll();
    say(n + " thumn restaurés.");
  });
})();
