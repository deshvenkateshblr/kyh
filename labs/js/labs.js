/* Lab binder: add a report, check the values it finds beside the page, keep them in one place.
   Stand-alone: needs only data.labs.js, pdf.js, fflate, labs-binder.js, labs-parse.js. The file is read in this browser and is never
   uploaded. The confirmed values and the original files are kept in this browser (IndexedDB) and travel in a .kylt bundle. */
(function () {
  var state = { labs: { reports: [], results: [] }, sex: '' };
  var main = document.getElementById('main-content');
  var sex = null;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var STATUS = { normal: 'In range', borderline: 'Borderline', low: 'Low', high: 'High', abnormal: 'Check', '': 'No range' };
  var MAX_RESULTS = 1400;
  var cur = null;   // report being reviewed: { rows, meta, pdf, page, scale, kind, imgUrl }

  function labs() { state.labs = state.labs || { reports: [], results: [] }; state.labs.reports = state.labs.reports || []; state.labs.results = state.labs.results || []; return state.labs; }
  function persist() { LabBinder.saveMeta({ labs: state.labs, sex: state.sex || '' }); }
  function analyteByKey(k) { return (window.LAB_ANALYTES || []).filter(function (a) { return a.key === k; })[0] || null; }
  function fmtDate(iso) { if (!iso) return 'undated'; var p = iso.split('-'); var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(+p[1] || 1) - 1]; return (+p[2]) + ' ' + m + ' ' + p[0]; }
  function badge(s) { return '<span class="lab-badge lab-' + (s || 'none') + '">' + STATUS[s || ''] + '</span>'; }
  function uid() { return 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

  /* ================= list view ================= */
  function renderList() {
    cur = null;
    var L = labs(), res = L.results;
    var byKey = {};
    res.forEach(function (r) { var k = r.k || ('n:' + (r.n || '').toLowerCase()); (byKey[k] = byKey[k] || []).push(r); });
    var groups = {}, flagged = [];
    Object.keys(byKey).forEach(function (k) {
      var list = byKey[k].slice().sort(function (a, b) { return (b.d || '').localeCompare(a.d || ''); });
      var a = analyteByKey(list[0].k), g = a ? a.group : 'Other';
      (groups[g] = groups[g] || []).push({ a: a, list: list });
      if (list[0].s && list[0].s !== 'normal') flagged.push({ a: a, r: list[0] });
    });
    var html = '<div class="lab-hero"><h1>My lab reports</h1>' +
      '<p class="lede">Add a report, check each value beside the page, and keep them all in one place. The report is read here in your browser and is never uploaded. ' +
      'The values you confirm and the original file stay in this browser only. To keep a copy or move them to another device, save a <strong>.kylt</strong> bundle (values and files together) below.</p></div>' +
      '<div class="note-block lab-add" id="lab-add"><span class="k">Add a report</span>' +
      '<p style="margin:6px 0 12px;font-size:14px;">A PDF from your lab works best. For a photo or scan, you can see the page and type the values in.</p>' +
      '<label class="btn" for="lab-file" id="lab-file-btn">Choose a PDF or photo</label>' +
      '<input type="file" id="lab-file" accept="application/pdf,image/*" style="position:absolute;left:-9999px;" aria-label="Choose a lab report PDF or photo">' +
      ' <button type="button" class="btn secondary" id="lab-manual">Type values by hand</button>' +
      ' <button type="button" class="btn secondary" id="lab-open-kylt">Open a .kylt bundle</button>' +
      '<input type="file" id="lab-kylt-file" style="position:absolute;left:-9999px;" aria-label="Open a .kylt bundle">' +
      '<div><label class="lab-sexpick">Ranges that differ by sex: use <select id="lab-sex"><option value="">not set</option><option value="Male"' + (sex === 'Male' ? ' selected' : '') + '>Male</option><option value="Female"' + (sex === 'Female' ? ' selected' : '') + '>Female</option></select></label></div>' +
      '<p id="lab-msg" class="lab-msg" role="status"></p></div>';
    if (!res.length && !labs().reports.length) {
      html += '<p class="lede" style="color:var(--muted);">No lab results saved yet.</p>';
    } else {
      if (flagged.length) {
        html += '<div class="note-block lab-flagged" id="lab-flagged"><span class="k">Worth raising with your doctor</span><ul class="lab-flag-list">' +
          flagged.map(function (f) { return '<li><strong>' + esc(f.a ? f.a.name : f.r.n) + '</strong> ' + esc(f.r.v) + ' ' + esc(f.r.u || '') + ' ' + badge(f.r.s) + ' <span class="lab-when">' + esc(fmtDate(f.r.d)) + '</span></li>'; }).join('') +
          '</ul><p class="lab-fine">These are the latest values that fall outside the range printed on the report. They are not a diagnosis.</p></div>';
      }
      Object.keys(groups).sort().forEach(function (g) {
        html += '<h2 class="lab-group">' + esc(g) + '</h2><div class="lab-cards">';
        groups[g].sort(function (x, y) { return (x.a ? x.a.name : x.list[0].n).localeCompare(y.a ? y.a.name : y.list[0].n); }).forEach(function (it) {
          var r = it.list[0], a = it.a, note = '';
          if (a) note = (r.s === 'low' ? a.low : r.s === 'high' || r.s === 'borderline' ? a.high : '');
          html += '<article class="lab-card"><div class="lab-card-top"><strong>' + esc(a ? a.name : r.n) + '</strong>' + badge(r.s) + '</div>' +
            '<div class="lab-val">' + esc(r.v) + ' <span class="lab-unit">' + esc(r.u || '') + '</span></div>' +
            '<div class="lab-ref">' + (r.f ? 'Range on report: ' + esc(r.f) + (r.b ? ' (' + esc(r.b) + ')' : '') : 'No range on report') + ' &middot; ' + esc(fmtDate(r.d)) + '</div>' +
            (it.list.length > 1 ? '<div class="lab-trend">Earlier: ' + it.list.slice(1, 5).map(function (e) { return esc(e.v) + ' (' + esc(fmtDate(e.d)) + ')'; }).join(' &middot; ') + '</div>' : '') +
            (a ? '<details class="lab-more"><summary>What this is</summary><p>' + esc(a.what) + '</p>' + (note ? '<p>' + esc(note) + '</p>' : '') + '</details>' : '') + '</article>';
        });
        html += '</div>';
      });
      html += '<h2 class="lab-group">Reports you added</h2><div id="lab-binder"></div>' +
        '<p class="lab-fine">General information, not medical advice. Ranges are the ones printed on your own report. A doctor reads results with your history.</p>';
    }
    main.innerHTML = html;
    document.getElementById('lab-file').addEventListener('change', onFile);
    document.getElementById('lab-sex').addEventListener('change', function (e) { state.sex = e.target.value; sex = state.sex || null; persist(); });
    document.getElementById('lab-open-kylt').addEventListener('click', function () { document.getElementById('lab-kylt-file').click(); });
    document.getElementById('lab-kylt-file').addEventListener('change', onKylt);
    if (document.getElementById('lab-binder')) paintBinder();
    document.getElementById('lab-manual').addEventListener('click', function () { openReview({ rows: [], meta: { date: '', lab: '' }, kind: 'none' }); });
  }

  /* ================= binder: filter by date and test, save a .kylt, files only ================= */
  var fFrom = '', fTo = '', fText = '', picked = {}, haveFile = {};
  function testNames(id) { var seen = {}, out = []; labs().results.forEach(function (x) { if (x.r === id && !seen[x.n]) { seen[x.n] = 1; out.push(x.n); } }); return out; }
  function matches(r) {
    if (fFrom && (r.date || '') < fFrom) return false;
    if (fTo && (r.date || '') > fTo) return false;
    if (fText) {
      var t = fText.toLowerCase();
      var hay = (r.lab || '') + ' ' + (r.t || '') + ' ' + labs().results.filter(function (x) { return x.r === r.id; }).map(function (x) { var a = analyteByKey(x.k); return x.n + ' ' + (a ? a.name : ''); }).join(' ');
      if (hay.toLowerCase().indexOf(t) < 0) return false;
    }
    return true;
  }
  function paintBinder() {
    var host = document.getElementById('lab-binder'); if (!host) return;
    LabBinder.keys().then(function (ks) {
      haveFile = {}; ks.forEach(function (k) { haveFile[k] = 1; });
      var L = labs(), all = L.reports.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      var shown = all.filter(matches);
      shown.forEach(function (r) { if (!(r.id in picked)) picked[r.id] = true; });
      var nSel = shown.filter(function (r) { return picked[r.id]; }).length;
      host.innerHTML =
        '<div class="lab-filter"><label>From <input type="date" id="lab-ff" value="' + esc(fFrom) + '"></label>' +
        '<label>To <input type="date" id="lab-ft" value="' + esc(fTo) + '"></label>' +
        '<label>Test or lab <input type="search" id="lab-fx" value="' + esc(fText) + '" placeholder="e.g. HbA1c, lipid" maxlength="40"></label></div>' +
        '<ul class="lab-reports">' + (shown.length ? shown.map(function (r) {
          var names = testNames(r.id), more = names.length > 4 ? ' +' + (names.length - 4) + ' more' : '';
          return '<li><label class="lab-pick"><input type="checkbox" data-pick="' + esc(r.id) + '"' + (picked[r.id] ? ' checked' : '') + '> <span><strong>' + esc(fmtDate(r.date)) + '</strong>' + (r.lab ? ' &middot; ' + esc(r.lab) : '') + ' &middot; ' + (r.n ? r.n + ' values' : 'written report, no values') +
            '<span class="lab-tests">' + esc(r.t ? r.t + (names.length ? ': ' : '') : '') + esc(names.slice(0, 4).join(', ')) + more + '</span></span></label>' +
            '<span class="lab-li-act">' + (haveFile[r.id] ? '<button type="button" class="refine-back" data-view="' + esc(r.id) + '">View file</button>' : '<span class="lab-when">no file kept</span>') +
            ' <button type="button" class="refine-back" data-del="' + esc(r.id) + '">Remove</button></span></li>';
        }).join('') : '<li><span class="lab-when">No report matches these filters.</span></li>') + '</ul>' +
        '<div class="lab-binder-act"><button type="button" class="btn" id="lab-kylt-save"' + (nSel ? '' : ' disabled') + '>Save ' + nSel + ' as .kylt (values + files)</button> ' +
        '<button type="button" class="btn secondary" id="lab-zip-save"' + (nSel ? '' : ' disabled') + '>Files only (.zip)</button></div>' +
        '<p class="lab-fine">A .kylt bundle contains your report files, which show your name and ID. Share it only with people you trust. To share just the numbers, use the values.csv inside the file. Reports added on another device appear here when you open the .kylt.</p>' +
        '<p id="lab-bmsg" class="lab-msg" role="status"></p>';
      var again = function () { paintBinder(); };
      document.getElementById('lab-ff').addEventListener('change', function (e) { fFrom = e.target.value; again(); });
      document.getElementById('lab-ft').addEventListener('change', function (e) { fTo = e.target.value; again(); });
      document.getElementById('lab-fx').addEventListener('change', function (e) { fText = e.target.value.trim(); again(); });
      host.querySelectorAll('[data-pick]').forEach(function (c) { c.addEventListener('change', function () { picked[c.getAttribute('data-pick')] = c.checked; again(); }); });
      host.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () {
        LabBinder.get(b.getAttribute('data-view')).then(function (rec) { if (!rec) return; var u = URL.createObjectURL(new Blob([rec.bytes], { type: rec.type })); var w = window.open(u, '_blank'); if (!w) location.href = u; setTimeout(function () { URL.revokeObjectURL(u); }, 60000); });
      }); });
      host.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () {
        if (!confirm('Remove this report, its values and the kept file from this browser?')) return;
        var id = b.getAttribute('data-del'), L2 = labs();
        L2.reports = L2.reports.filter(function (r) { return r.id !== id; }); L2.results = L2.results.filter(function (r) { return r.r !== id; });
        LabBinder.del(id).then(function () { persist(); renderList(); });
      }); });
      var chosen = function () { return shown.filter(function (r) { return picked[r.id]; }); };
      var bm = function (t) { var m = document.getElementById('lab-bmsg'); if (m) m.textContent = t; };
      var out = function (withData) {
        var sel = chosen(); if (!sel.length) return;
        LabBinder.buildZip(sel, labs().results, withData).then(function (z) {
          var ds = sel.map(function (r) { return r.date || ''; }).filter(Boolean).sort();
          var nm = (withData ? 'lab-binder-' : 'lab-files-') + (ds.length ? ds[0] + (ds.length > 1 && ds[ds.length - 1] !== ds[0] ? '_to_' + ds[ds.length - 1] : '') : 'undated') + (withData ? '.kylt' : '.zip');
          var u = URL.createObjectURL(z.blob), a = document.createElement('a'); a.href = u; a.download = nm; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
          bm('Saved ' + nm + ' with ' + z.count + ' file' + (z.count === 1 ? '' : 's') + (z.missing ? '. ' + z.missing + ' report' + (z.missing === 1 ? ' has' : 's have') + ' no file kept on this device, so only its values are in the list.' : '.'));
        }).catch(function () { bm('Could not build the file. Try fewer reports.'); });
      };
      document.getElementById('lab-kylt-save').addEventListener('click', function () { out(true); });
      document.getElementById('lab-zip-save').addEventListener('click', function () { out(false); });
    });
  }
  function onKylt(e) {
    var f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    LabBinder.readKylt(f).then(function (k) {
      var L = labs(), have = {}; L.reports.forEach(function (r) { have[r.id] = 1; });
      var add = (k.labs.reports || []).filter(function (r) { return r && r.id && !have[r.id]; }), ids = {}; add.forEach(function (r) { ids[r.id] = 1; });
      var res = (k.labs.results || []).filter(function (x) { return ids[x.r]; });
      if (L.results.length + res.length > MAX_RESULTS) { msg('That bundle has more values than can be kept in one list.'); return; }
      add.forEach(function (r) { L.reports.push({ id: String(r.id).slice(0, 30), date: String(r.date || '').slice(0, 10), lab: String(r.lab || '').slice(0, 60), n: +r.n || 0, t: String(r.t || '').slice(0, 120) }); });
      res.forEach(function (x) { L.results.push({ r: x.r, k: String(x.k || '').slice(0, 40), n: String(x.n || '').slice(0, 80), v: String(x.v || '').slice(0, 30), u: String(x.u || '').slice(0, 30), f: String(x.f || '').slice(0, 120), s: String(x.s || '').slice(0, 12), b: String(x.b || '').slice(0, 40), d: String(x.d || '').slice(0, 10) }); });
      return Promise.all(Object.keys(k.files).filter(function (id) { return ids[id]; }).map(function (id) { return LabBinder.put(id, k.files[id]); })).then(function () {
        persist(); renderList();
        msg('Added ' + add.length + ' report' + (add.length === 1 ? '' : 's') + ' from the bundle' + (add.length < (k.labs.reports || []).length ? ' (the rest were already here)' : '') + '. They are kept in this browser; save a .kylt copy to back them up.');
      });
    }).catch(function () { msg('That file could not be read. Pick a .kylt file saved from this page.'); });
  }

  /* ================= reading a file ================= */
  function msg(t) { var m = document.getElementById('lab-msg'); if (m) m.textContent = t || ''; }
  function onFile(e) {
    var keep = null;
    var f = e.target.files && e.target.files[0]; if (!f) return;
    if (/^image\//.test(f.type)) {
      f.arrayBuffer().then(function (b) { openReview({ rows: [], meta: { date: '', lab: '' }, kind: 'image', imgUrl: URL.createObjectURL(f), file: { name: f.name, type: f.type, bytes: b } }); });
      return;
    }
    msg('Reading the report in your browser…');
    f.arrayBuffer().then(function (buf) {
      keep = { name: f.name, type: 'application/pdf', bytes: buf.slice(0) };
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js?v=3.11.174';
      return pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    }).then(function (pdf) {
      var pages = [], p = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) (function (n) {
        p = p.then(function () { return pdf.getPage(n); }).then(function (pg) { return pg.getTextContent(); }).then(function (tc) { pages.push({ page: n, rows: LabParse.rowsFromItems(tc.items) }); });
      })(i);
      return p.then(function () {
        var pk = LabParse.pickPages(pages), g = LabParse.guessCols(pages, pk.sel), out = LabParse.extract(pages, sex, pk.sel, g && g.cols);
        var rows = toRows(out.tests), r = { rows: rows, meta: out.meta, kind: 'pdf', pdf: pdf, noText: !rows.length, file: keep, pages: pages, sel: pk.sel, scores: pk.scores, cols: g ? g.cols : null, how: g ? g.how : '', cls: LabParse.classifyPages(pages) };
        r.noText = !rows.length && !r.cls.some(function (c) { return c.kind === 'findings'; });
        if (r.noText) openReview(r); else openGuess(r);
      });
    }).catch(function (err) {
      msg('This file could not be opened. If it is password protected, remove the password first, or type the values by hand.');
      if (window.console) console.error(err);
    });
  }

  function reportTopics() {
    if (!cur || !cur.cls) return '';
    var seen = {}, out = [];
    cur.cls.forEach(function (c) { if (c.kind === 'findings' || cur.sel.indexOf(c.page) >= 0) c.topics.forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } }); });
    return out.join(', ');
  }
  function foundByTopic() {
    var by = {}, order = [];
    cur.rows.forEach(function (r) { var t = (r.analyte && LabParse.topicOfAnalyte(r.analyte)) || 'Not named'; if (!by[t]) { by[t] = 0; order.push(t); } by[t]++; });
    return order.map(function (t) { return t + ' ' + by[t]; }).join(', ');
  }
  var KIND_LABEL = { results: 'a table of results', findings: 'a written report', text: 'text only (summary or cover)' };
  function toRows(tests) { return tests.map(function (t) { return { page: t.page, box: t.box, name: t.name, analyte: t.analyte, value: t.value, unit: t.unit, ref: t.ref, flag: t.flag, status: t.status, band: t.band, on: true }; }); }

  /* ================= first: what we think this report is ================= */
  var ROLES = [['name', 'Test name'], ['value', 'Result'], ['unit', 'Unit'], ['ref', 'Range']];
  function ranges(a) { a = a.slice().sort(function (x, y) { return x - y; }); var out = [], st = null, pv = null; a.forEach(function (n) { if (st === null) { st = pv = n; } else if (n === pv + 1) { pv = n; } else { out.push(st === pv ? '' + st : st + '–' + pv); st = pv = n; } }); if (st !== null) out.push(st === pv ? '' + st : st + '–' + pv); return out.join(', '); }
  function openGuess(r) {
    cur = r; cur.page = 1; cur.scale = 1; cur.active = -1; cur.mode = 'guess'; cur.tap = '';
    var skipped = cur.pages.map(function (p) { return p.page; }).filter(function (n) { return cur.sel.indexOf(n) < 0; });
    main.innerHTML = '<div class="lab-hero"><h1>Is this what your report looks like?</h1>' +
      '<p class="lede">We looked at the report first and made a guess. Check it against the page. If something is off, fix it here; it takes a few taps and makes the whole report come out right.</p></div>' +
      '<div class="lab-split"><div class="lab-left">' +
      '<ul class="lab-guess" id="lab-guess"></ul><div id="lab-pages" class="lab-pages"></div>' +
      '<div class="lab-colfix" id="lab-colfix"></div><div id="lab-notebox"></div>' +
      '<div class="lab-pagehead">The first rows, read this way</div><div id="lab-sample"></div>' +
      '<div class="lab-binder-act"><button type="button" class="btn" id="lab-go">Yes, read the whole report this way</button> <button type="button" class="btn secondary" id="lab-cancel">Cancel</button></div>' +
      '<p id="lab-save-msg" class="lab-msg" role="status"></p></div>' +
      '<div class="lab-right"><div class="lab-viewer-bar" id="lab-viewer-bar"></div><div id="lab-thispage" class="lab-thispage" role="status" aria-live="polite"></div><div class="lab-canvas-wrap" id="lab-wrap"><canvas id="lab-canvas"></canvas><div id="lab-bands"></div></div></div></div>';
    paintGuess(); paintPages(); paintViewerBar();
    showPage(cur.sel[0] || 1);
    document.getElementById('lab-cancel').addEventListener('click', renderList);
    document.getElementById('lab-go').addEventListener('click', function () { cur.mode = 'review'; openReview(cur); });
    document.getElementById('lab-canvas').addEventListener('click', function (e) {
      if (!cur.tap || !cur.vp) return;
      var b = e.target.getBoundingClientRect(), pt = cur.vp.convertToPdfPoint(e.clientX - b.left, e.clientY - b.top);
      cur.cols = cur.cols || { name: null, value: null, unit: null, ref: null, flag: null };
      cur.cols[cur.tap] = pt[0]; cur.how = 'you'; cur.tap = '';
      reread(); drawBands();
    });
    window.scrollTo(0, 0);
  }
  /* the person says what a page is: results table, summary/cover (skipped) or written report */
  function setKind(n, kind) {
    var c = (cur.cls || []).filter(function (x) { return x.page === n; })[0]; if (!c) return;
    c.kind = kind; c.user = true;
    var at = cur.sel.indexOf(n);
    if (kind === 'results') { if (at < 0) cur.sel.push(n); } else if (at >= 0) cur.sel.splice(at, 1);
    if (kind === 'findings' && !c.topics.length) c.topics = ['Written report'];
    if (kind !== 'findings' && c.topics.length === 1 && c.topics[0] === 'Written report') c.topics = [];
    var manual = cur.rows.filter(function (r) { return !r.box; });
    cur.rows = toRows(LabParse.extract(cur.pages, sex, cur.sel, cur.cols).tests).concat(manual);
    paintPages(); paintGuess(); paintThisPage(); drawBands();
  }
  var KIND_PILL = { results: 'Results table', text: 'Summary or cover (skipped)', findings: 'Written report' };
  function paintThisPage() {
    var host = document.getElementById('lab-thispage'); if (!host || !cur.cls) return;
    var c = cur.cls.filter(function (x) { return x.page === cur.page; })[0]; if (!c) return;
    var nRows = cur.rows.filter(function (r) { return r.page === c.page; }).length, why;
    if (c.kind === 'results') why = (c.topics.length ? 'Looks like <strong>' + esc(c.topics.join(', ')) + '</strong>. ' : 'A table of results, but we could not name the panel. ') + 'Reading <strong>' + nRows + '</strong> result' + (nRows === 1 ? '' : 's') + ' from this page.';
    else if (c.kind === 'findings') why = 'Looks like <strong>' + esc(c.topics[0] || 'a written report') + '</strong>. It is words, not a table of numbers, so no values are read from it.';
    else why = c.user ? 'You marked this page as a summary or cover. Nothing is read from it.' : 'No table of results found here (' + c.table + ' line' + (c.table === 1 ? '' : 's') + ' with a number and a unit or range). Looks like summary or cover text, so it is skipped.';
    host.className = 'lab-thispage lab-tp-' + c.kind;
    host.innerHTML = (cur.flash ? '<div class="lab-flash">&#10003; ' + esc(cur.flash) + '</div>' : '') +
      '<div class="lab-tp-head"><strong>Page ' + c.page + ' of ' + cur.pages.length + '</strong><span class="lab-pill lab-pill-' + c.kind + '">' + KIND_PILL[c.kind] + (c.user ? ' &middot; set by you' : '') + '</span></div>' +
      '<p class="lab-tp-why">' + why + '</p>' +
      '<div class="lab-seg" role="group" aria-label="What is this page">' + [['results', 'Results table'], ['text', 'Summary, skip'], ['findings', 'Written report']].map(function (k) {
        return '<button type="button" class="lab-segbtn' + (c.kind === k[0] ? ' on' : '') + '" data-mark="' + k[0] + '" aria-pressed="' + (c.kind === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>' +
      '<p class="lab-fine">Pick what this page is and the next page opens.</p>';
    var w = document.getElementById('lab-wrap'); if (w) w.setAttribute('data-kind', c.kind);
    host.querySelectorAll('[data-mark]').forEach(function (b) { b.addEventListener('click', function () { markPage(b.getAttribute('data-mark')); }); });
    if (cur.flash) { var f = cur.flash; setTimeout(function () { if (cur && cur.flash === f) { cur.flash = ''; var el = document.querySelector('#lab-thispage .lab-flash'); if (el) el.remove(); } }, 4000); }
  }
  function markPage(kind) {
    var n = cur.page, last = n >= cur.pdf.numPages, words = { results: 'set as a results table, it will be read', text: 'marked as a summary and skipped', findings: 'marked as a written report' };
    setKind(n, kind);
    cur.flash = 'Page ' + n + ' ' + words[kind] + (last ? '.' : '. Now showing page ' + (n + 1) + '.');
    if (last) paintThisPage(); else showPage(n + 1);
  }
  function saveNote() {
    var d = document.getElementById('lab-note-date').value, m = document.getElementById('lab-save-msg');
    if (!d) { m.textContent = 'Add the date of the report first.'; return; }
    var L = labs(); if (L.reports.length >= 400) { m.textContent = 'That is the most reports one file can keep.'; return; }
    var id = 'r' + Date.now().toString(36);
    L.reports.push({ id: id, date: d, lab: (cur.meta.lab || '').slice(0, 60), n: 0, t: reportTopics().slice(0, 120) });
    if (cur.file) LabBinder.put(id, cur.file);
    persist(); renderList(); msg('Kept the report. Find it under Reports you added.');
  }
  function reread() {
    var out = LabParse.extract(cur.pages, sex, cur.sel, cur.cols);
    cur.rows = toRows(out.tests); if (!cur.meta.date) cur.meta.date = out.meta.date; if (!cur.meta.lab) cur.meta.lab = out.meta.lab;
    paintGuess();
  }
  function paintGuess() {
    var g = document.getElementById('lab-guess'); if (!g) return;
    var c = cur.cols || {}, skipped = cur.pages.map(function (p) { return p.page; }).filter(function (n) { return cur.sel.indexOf(n) < 0; });
    var cn = ROLES.filter(function (x) { return c[x[0]] !== null && c[x[0]] !== undefined; }).sort(function (a, b) { return c[a[0]] - c[b[0]]; }).map(function (x) { return x[1]; });
    g.innerHTML =
      '<li><strong>Lab:</strong> ' + (cur.meta.lab ? esc(cur.meta.lab) : 'not recognised (that is fine)') + '</li>' +
      '<li><strong>Sample taken:</strong> ' + (cur.meta.date ? esc(fmtDate(cur.meta.date)) : 'not found (you can add it next)') + '</li>' +
      '<li><strong>Results are on page' + (cur.sel.length === 1 ? '' : 's') + ':</strong> ' + (cur.sel.length ? ranges(cur.sel) : 'none found') + (skipped.length ? '. We skipped ' + ranges(skipped) + ' (looks like summary or cover text).' : '.') + '</li>' +
      '<li><strong>Each result row reads:</strong> ' + (cn.length ? esc(cn.join('  →  ')) : 'we could not find the columns, tap them below') + (cur.how === 'header' ? ' <span class="lab-when">(from the column headings)</span>' : cur.how === 'numbers' ? ' <span class="lab-when">(from where the numbers sit)</span>' : cur.how === 'you' ? ' <span class="lab-when">(as you set it)</span>' : '') + '</li>' +
      '<li><strong>Found so far:</strong> ' + cur.rows.length + ' result' + (cur.rows.length === 1 ? '' : 's') + (cur.rows.length ? ' (' + esc(foundByTopic()) + ')' : '') + '</li>' +
      '<li><strong>What each page is:</strong><ul class="lab-pagelist">' + (cur.cls || []).map(function (c) {
        return '<li class="' + (c.page === cur.page ? 'cur' : '') + '"><button type="button" class="refine-back" data-showpg="' + c.page + '">Page ' + c.page + '</button>: ' + KIND_LABEL[c.kind] + (c.topics.length ? ', looks like <strong>' + esc(c.topics.join(', ')) + '</strong>' : '') + (c.user ? ' <span class="lab-when">(you set this)</span>' : '') +
          '<select class="lab-kind" data-kind="' + c.page + '" aria-label="What is page ' + c.page + '"><option value="results"' + (c.kind === 'results' ? ' selected' : '') + '>Results table</option><option value="text"' + (c.kind === 'text' ? ' selected' : '') + '>Summary or cover, skip it</option><option value="findings"' + (c.kind === 'findings' ? ' selected' : '') + '>Written report</option></select></li>'; }).join('') + '</ul></li>';
    g.querySelectorAll('[data-kind]').forEach(function (sel) { sel.addEventListener('change', function () { setKind(+sel.getAttribute('data-kind'), sel.value); }); });
    g.querySelectorAll('[data-showpg]').forEach(function (b) { b.addEventListener('click', function () { showPage(+b.getAttribute('data-showpg')); }); });
    var fnd = (cur.cls || []).filter(function (c) { return c.kind === 'findings'; });
    var nb = document.getElementById('lab-notebox');
    if (nb) nb.innerHTML = fnd.length ? '<div class="lab-pages-t">Written report found</div><p class="lab-fine">' + esc(fnd.map(function (c) { return 'Page ' + c.page + ' looks like ' + c.topics[0]; }).join('; ')) + '. These carry no numbers to read. You can keep the report and its file under that name.</p>' +
      '<div class="lab-meta"><label>Report date <input type="date" id="lab-note-date" value="' + esc(cur.meta.date || '') + '"></label> <button type="button" class="btn secondary" id="lab-note">Keep as a report without values</button></div>' : '';
    var nbtn = document.getElementById('lab-note'); if (nbtn) nbtn.addEventListener('click', saveNote);
    var cf = document.getElementById('lab-colfix');
    cf.innerHTML = '<div class="lab-pages-t">Not right? Set a column, then tap it on the page</div><div class="lab-chips">' +
      ROLES.map(function (x) { return '<button type="button" class="lab-chip' + (cur.tap === x[0] ? ' on' : '') + '" data-role="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      (c.unit !== null && c.unit !== undefined ? '<button type="button" class="lab-chip" data-noncol="unit">No unit column</button>' : '') + '</div>' +
      (cur.tap ? '<p class="lab-fine"><strong>Now tap anywhere in the ' + esc(ROLES.filter(function (x) { return x[0] === cur.tap; })[0][1]) + ' column on the page.</strong></p>' : '');
    cf.querySelectorAll('[data-role]').forEach(function (b) { b.addEventListener('click', function () { cur.tap = cur.tap === b.getAttribute('data-role') ? '' : b.getAttribute('data-role'); paintGuess(); document.getElementById('lab-canvas').style.cursor = cur.tap ? 'crosshair' : ''; }); });
    cf.querySelectorAll('[data-noncol]').forEach(function (b) { b.addEventListener('click', function () { cur.cols[b.getAttribute('data-noncol')] = null; reread(); drawBands(); }); });
    var sm = document.getElementById('lab-sample');
    sm.innerHTML = cur.rows.length ? '<table class="lab-sample"><thead><tr><th>Test</th><th>Result</th><th>Unit</th><th>Range</th><th></th></tr></thead><tbody>' +
      cur.rows.slice(0, 8).map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.value) + '</td><td>' + esc(r.unit) + '</td><td>' + esc(r.ref) + '</td><td>' + badge(r.status) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="lab-fine">Nothing read yet. Set the columns above, or continue and type the values from the page.</p>';
  }
  function drawBands() {
    var host = document.getElementById('lab-bands'); if (!host) return;
    host.innerHTML = '';
    if (cur.mode !== 'guess' || !cur.vp || !cur.cols) return;
    var pc = (cur.cls || []).filter(function (x) { return x.page === cur.page; })[0]; if (pc && pc.kind !== 'results') return;
    var vp = cur.vp, h = vp.viewBox[3];
    ROLES.forEach(function (x) {
      var cx = cur.cols[x[0]]; if (cx === null || cx === undefined) return;
      var w = x[0] === 'name' ? 110 : 54, r = vp.convertToViewportRectangle([x[0] === 'name' ? cx : cx - w / 2, 0, x[0] === 'name' ? cx + w : cx + w / 2, h]);
      var d = document.createElement('div'); d.className = 'lab-band lab-band-' + x[0];
      d.style.left = Math.min(r[0], r[2]) + 'px'; d.style.width = Math.abs(r[2] - r[0]) + 'px'; d.style.top = '0px'; d.style.height = Math.abs(r[3] - r[1]) + 'px';
      d.innerHTML = '<span>' + x[1] + '</span>'; host.appendChild(d);
    });
  }

  /* ================= review view ================= */
  function openReview(r) {
    cur = r; cur.page = 1; cur.scale = 1; cur.active = -1; cur.mode = 'review';
    var d = r.meta.date || '';
    main.innerHTML = '<div class="lab-hero"><h1>Check the values</h1>' +
      '<p class="lede">' + (r.kind === 'pdf' ? (r.noText ? 'This PDF has no readable text (it is probably a scan). You can still see each page here and type the values in.' : 'Here is what we found. Tap a row to see it on the page, fix anything that is wrong, and untick what you do not want to keep.') : r.kind === 'image' ? 'Type the values from the photo. Nothing is read automatically from pictures.' : 'Type the values from your report.') + '</p></div>' +
      '<div class="lab-meta"><label class="intake-label" for="lab-date">Report date (when the sample was taken)</label><input type="date" id="lab-date" value="' + esc(d) + '" max="' + new Date().toISOString().slice(0, 10) + '">' +
      '<label class="intake-label" for="lab-lab" style="margin-left:14px;">Lab (optional)</label><input type="text" id="lab-lab" maxlength="60" value="' + esc(r.meta.lab || '') + '" placeholder="e.g. your lab’s name"></div>' +
      '<div class="lab-split">' +
      '<div class="lab-left">' + (r.pages && r.pages.length > 1 ? '<div class="lab-pages" id="lab-pages"></div>' : '') + '<div id="lab-rows"></div><button type="button" class="btn secondary" id="lab-add-row">+ Add a value I can see on the page</button></div>' +
      (r.kind === 'none' ? '' : '<div class="lab-right"><div class="lab-viewer-bar" id="lab-viewer-bar"></div><div class="lab-canvas-wrap" id="lab-wrap"><canvas id="lab-canvas"></canvas><img id="lab-img" alt="Your report page" style="display:none;max-width:100%;"><div id="lab-hl" class="lab-hl" hidden></div></div></div>') +
      '</div>' +
      '<datalist id="lab-names">' + (window.LAB_ANALYTES || []).map(function (a) { return '<option value="' + esc(a.name) + '">'; }).join('') + '</datalist>' +
      '<div class="page-footer-nav"><button type="button" class="btn secondary" id="lab-cancel">Cancel</button><div><span id="lab-save-msg" class="lab-msg"></span> <button type="button" class="btn" id="lab-save">Save these values</button></div></div>';
    paintPages();
    paintRows();
    if (r.kind === 'pdf') { paintViewerBar(); showPage(r.sel && r.sel.length ? r.sel[0] : 1); }
    if (r.kind === 'image') { var im = document.getElementById('lab-img'); im.src = r.imgUrl; im.style.display = ''; document.getElementById('lab-canvas').style.display = 'none'; }
    document.getElementById('lab-cancel').addEventListener('click', renderList);
    document.getElementById('lab-save').addEventListener('click', save);
    document.getElementById('lab-add-row').addEventListener('click', function () { cur.rows.push({ page: cur.page, box: null, name: '', analyte: '', value: '', unit: '', ref: '', flag: '', status: '', band: '', on: true }); paintRows(); var inp = document.querySelector('#lab-rows .lab-row:last-child input[data-f="name"]'); if (inp) inp.focus(); });
    window.scrollTo(0, 0);
  }

  function paintPages() {
    var host = document.getElementById('lab-pages'); if (!host || !cur.pages) return;
    host.innerHTML = '<div class="lab-pages-t">Pages we read <span class="lab-when">(tap a number to include or skip it)</span></div><div class="lab-chips">' +
      cur.pages.map(function (p, i) { var on = cur.sel.indexOf(p.page) >= 0; return '<button type="button" class="lab-chip' + (on ? ' on' : '') + '" data-pg="' + p.page + '" aria-pressed="' + on + '" title="' + cur.scores[i] + ' lines look like results">' + p.page + (on ? ' &#10003;' : '') + '</button>'; }).join('') + '</div>' +
      '<p class="lab-fine">Pages with units and printed ranges are ticked. Summary and cover pages are skipped. Changing pages re-reads the list and keeps rows you typed in.</p>';
    host.querySelectorAll('[data-pg]').forEach(function (b) { b.addEventListener('click', function () {
      var n = +b.getAttribute('data-pg'), at = cur.sel.indexOf(n);
      if (at >= 0) cur.sel.splice(at, 1); else cur.sel.push(n);
      (cur.cls || []).forEach(function (c) { if (c.page === n) { c.user = true; c.kind = cur.sel.indexOf(n) >= 0 ? 'results' : (c.kind === 'findings' ? 'findings' : 'text'); } });
      var manual = cur.rows.filter(function (r) { return !r.box; });
      var out = LabParse.extract(cur.pages, sex, cur.sel, cur.cols);
      cur.rows = toRows(out.tests).concat(manual);
      cur.active = -1; paintPages(); if (cur.mode === 'guess') paintGuess(); else paintRows(); showPage(n);
    }); });
  }
  /* what the parser sees on the current page, with name-like and id-like lines masked, so a layout can be shared for troubleshooting */
  function layoutDump() {
    var pg = cur.pages && cur.pages.filter(function (p) { return p.page === cur.page; })[0]; if (!pg) return '';
    return 'Layout, page ' + cur.page + '\n' + pg.rows.map(function (r) {
      var line = r.cells.map(function (c) { return c.text; }).join(' ');
      if (/(name|patient|customer|mobile|phone|address|e-?mail|\bdob\b|referred|lab visit|barcode|\bid\b|uhid|pin ?code|www\.|@)/i.test(line)) return 'y=' + Math.round(r.y) + ' [line removed]';
      return 'y=' + Math.round(r.y) + ' ' + r.cells.map(function (c) { return Math.round(c.x) + ':' + c.text.replace(/\d{7,}/g, '#'); }).join(' | ');
    }).join('\n');
  }
  function copyLayout() {
    var t = layoutDump(), host = document.getElementById('lab-dump');
    var show = function () { host.hidden = false; host.value = t; host.focus(); host.select(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { host.hidden = false; host.value = t; document.getElementById('lab-dump-msg').textContent = 'Copied. Name and ID lines are removed, but read it before sharing.'; }, show); else show();
  }

  function paintRows() {
    var host = document.getElementById('lab-rows'), html = '', lastPage = 0;
    cur.rows.forEach(function (r, i) {
      if (cur.kind === 'pdf' && r.page && r.page !== lastPage) { html += '<div class="lab-pagehead">Page ' + r.page + '</div>'; lastPage = r.page; }
      html += '<div class="lab-row' + (r.on ? '' : ' off') + (i === cur.active ? ' active' : '') + '" data-i="' + i + '">' +
        '<label class="lab-keep"><input type="checkbox" data-f="on"' + (r.on ? ' checked' : '') + ' aria-label="Keep this value"></label>' +
        '<div class="lab-fields"><input type="text" data-f="name" value="' + esc(r.name) + '" list="lab-names" placeholder="Test name" aria-label="Test name">' +
        '<div class="lab-nums"><input type="text" data-f="value" value="' + esc(r.value) + '" placeholder="Result" inputmode="decimal" aria-label="Result">' +
        '<input type="text" data-f="unit" value="' + esc(r.unit) + '" placeholder="Unit" aria-label="Unit">' +
        '<input type="text" data-f="ref" value="' + esc(r.ref) + '" placeholder="Range on report" aria-label="Range printed on the report"></div></div>' +
        '<div class="lab-st" data-st>' + badge(r.status) + '</div></div>';
    });
    host.innerHTML = html || '<p class="lab-fine">Nothing found yet. Add the values you can see on the page.</p>';
    host.querySelectorAll('.lab-row').forEach(function (row) {
      var i = +row.getAttribute('data-i');
      row.addEventListener('input', function (e) {
        var f = e.target.getAttribute('data-f'); if (!f) return;
        var r = cur.rows[i];
        if (f === 'on') { r.on = e.target.checked; row.classList.toggle('off', !r.on); return; }
        r[f] = e.target.value;
        if (f === 'name') { var a = LabParse.matchAnalyte(r.name); r.analyte = a ? a.key : ''; if (a && !r.unit) r.unit = a.unit; }
        var s = LabParse.statusFor(r.value, r.ref, sex, r.flag); r.status = s.status; r.band = s.band;
        row.querySelector('[data-st]').innerHTML = badge(r.status);
      });
      row.addEventListener('click', function (e) { if (e.target.tagName === 'INPUT') { if (e.target.getAttribute('data-f') !== 'on') focusRow(i, false); return; } focusRow(i, true); });
    });
  }
  function focusRow(i, scroll) {
    cur.active = i;
    document.querySelectorAll('#lab-rows .lab-row').forEach(function (r) { r.classList.toggle('active', +r.getAttribute('data-i') === i); });
    var r = cur.rows[i]; if (cur.kind !== 'pdf' || !r || !r.page) return;
    if (r.page !== cur.page) showPage(r.page, r.box); else highlight(r.box);
    if (scroll) { var w = document.getElementById('lab-wrap'); if (w && window.matchMedia('(max-width: 899px)').matches) w.scrollIntoView({ block: 'nearest' }); }
  }

  /* ---- page preview ---- */
  function paintViewerBar() {
    var bar = document.getElementById('lab-viewer-bar');
    bar.innerHTML = '<button type="button" class="btn secondary" id="lab-prev">&larr;</button><span>Page <strong id="lab-pg">1</strong> of ' + cur.pdf.numPages + '</span><button type="button" class="btn secondary" id="lab-next">&rarr;</button>' +
      '<button type="button" class="btn secondary" id="lab-zin" aria-label="Zoom in">+</button><button type="button" class="btn secondary" id="lab-zout" aria-label="Zoom out">&minus;</button>' +
      '<button type="button" class="refine-back" id="lab-dumpbtn">Copy page layout</button><span id="lab-dump-msg" class="lab-when"></span><textarea id="lab-dump" class="lab-dump" readonly hidden aria-label="Page layout text"></textarea>';
    document.getElementById('lab-dumpbtn').addEventListener('click', copyLayout);
    document.getElementById('lab-prev').addEventListener('click', function () { showPage(cur.page - 1); });
    document.getElementById('lab-next').addEventListener('click', function () { showPage(cur.page + 1); });
    document.getElementById('lab-zin').addEventListener('click', function () { cur.scale = Math.min(3, cur.scale + 0.25); showPage(cur.page, cur.hlBox); });
    document.getElementById('lab-zout').addEventListener('click', function () { cur.scale = Math.max(0.6, cur.scale - 0.25); showPage(cur.page, cur.hlBox); });
  }
  function showPage(n, box) {
    if (!cur.pdf || n < 1 || n > cur.pdf.numPages) return;
    cur.page = n; document.getElementById('lab-pg').textContent = n;
    if (cur.mode === 'guess') { paintGuess(); paintThisPage(); }
    cur.pdf.getPage(n).then(function (pg) {
      var dpr = window.devicePixelRatio || 1, wrap = document.getElementById('lab-wrap'), w1 = pg.getViewport({ scale: 1 }).width, fit = Math.max(0.5, Math.min(3, ((wrap ? wrap.clientWidth : 600) - 18) / w1)), vp = pg.getViewport({ scale: fit * cur.scale });
      var cv = document.getElementById('lab-canvas'); cv.width = Math.floor(vp.width * dpr); cv.height = Math.floor(vp.height * dpr);
      cv.style.width = vp.width + 'px'; cv.style.height = vp.height + 'px';
      cur.vp = vp;
      return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
    }).then(function () { highlight(box || null); drawBands(); });
  }
  function highlight(box) {
    var hl = document.getElementById('lab-hl'); cur.hlBox = box;
    if (!hl) return;
    if (!box || !cur.vp) { hl.hidden = true; return; }
    var r = cur.vp.convertToViewportRectangle([box.x1 - 3, box.y1 - 2, box.x2 + 3, box.y2 + 2]);
    var x = Math.min(r[0], r[2]), y = Math.min(r[1], r[3]), w = Math.abs(r[2] - r[0]), h = Math.abs(r[3] - r[1]);
    hl.style.left = x + 'px'; hl.style.top = y + 'px'; hl.style.width = w + 'px'; hl.style.height = h + 'px'; hl.hidden = false;
  }

  /* ---- save ---- */
  function save() {
    var date = document.getElementById('lab-date').value, labName = document.getElementById('lab-lab').value.trim().slice(0, 60);
    var keep = cur.rows.filter(function (r) { return r.on && r.name.trim() && String(r.value).trim(); });
    var sm = document.getElementById('lab-save-msg');
    if (!keep.length) { sm.textContent = 'Nothing to save yet. Add at least one value with a name and result.'; return; }
    if (!date) { sm.textContent = 'Add the report date first. It lets the page show how your values change over time.'; document.getElementById('lab-date').focus(); return; }
    var L = labs();
    if (L.results.length + keep.length > MAX_RESULTS) { sm.textContent = 'That is more values than can be kept in one list. Remove an older report first.'; return; }
    var id = uid();
    keep.forEach(function (r) {
      var key = r.analyte || '', nm = r.name.trim().slice(0, 80);
      // the same test on the same date replaces the earlier copy
      L.results = L.results.filter(function (x) { return !(x.d === date && (key ? x.k === key : x.n === nm)); });
      L.results.push({ r: id, k: key, n: nm, v: String(r.value).trim().slice(0, 30), u: String(r.unit || '').trim().slice(0, 30), f: String(r.ref || '').trim().slice(0, 120), s: r.status || '', b: r.band || '', d: date });
    });
    L.reports.push({ id: id, date: date, lab: labName, n: keep.length, t: reportTopics().slice(0, 120) });
    if (cur && cur.file) LabBinder.put(id, cur.file);
    persist();
    renderList();
    msg('Saved ' + keep.length + ' value' + (keep.length > 1 ? 's' : '') + '. Kept in this browser; save a .kylt copy to back them up.');
  }

  LabBinder.loadMeta().then(function (m) {
    if (m && m.labs) { state.labs = m.labs; state.sex = m.sex || ''; }
    sex = state.sex || null;
    renderList();
  });
})();
