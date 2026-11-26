/* Reads lab-report text into rows of (test, result, unit, reference). Runs in the browser, nothing is uploaded.
   Not tied to one lab: it finds the table header on each page, falls back to a plain line pattern, and always
   leaves the final say to the person (the page shows every row for checking). Works in Node too, for tests. */
(function (root) {
  var ANALYTES = (root.LAB_ANALYTES || []);
  var QUAL = /^(negative|positive|nil|absent|present|trace|clear|reactive|non[- ]?reactive|normal|abnormal|detected|not detected|pale yellow|yellow|straw|hazy|turbid|adequate|nill|\+{1,4}|\d\+)$/i;
  var QUAL_BAD = /^(positive|present|reactive|detected|abnormal|turbid|\+{1,4}|\d\+)$/i;
  var HEADER_WORDS = /(test|investigation|parameter|analyte|result|value|observed|unit|reference|range|interval|normal|method|flag|biological|bio\.?)/i;
  var SKIP_NAME = /^(page|patient|name|age|sex|gender|doctor|dr\b|ref\.? by|referred|sample|specimen|collected|collection|received|reported|report|date|time|lab|registered|barcode|sid|uhid|mobile|phone|address|email|test name|investigation|method|comments?|note|interpretation|disclaimer|end of report|printed|authori[sz]ed|pathologist|technician|signature|verified|booking)/i;
  var LABS = ['Tata 1mg', 'Thyrocare', 'Dr Lal PathLabs', 'Dr. Lal PathLabs', 'SRL Diagnostics', 'Agilus', 'Metropolis', 'Apollo Diagnostics', 'Redcliffe', 'Healthians', 'Orange Health', 'Neuberg', 'Vijaya Diagnostic', 'Lucid', 'PharmEasy', 'Medall', 'Suburban Diagnostics', 'Pathkind', 'Aarthi Scans', 'Krsnaa', 'Max Lab', 'Fortis', 'Manipal'];

  function norm(s) { return String(s || '').toLowerCase().replace(/[()\[\]:,.*]/g, ' ').replace(/[^a-z0-9%+ ]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function matchAnalyte(name) {
    var n = norm(name);
    if (!n) return null;
    for (var i = 0; i < ANALYTES.length; i++) {
      var al = ANALYTES[i].alias;
      for (var j = 0; j < al.length; j++) if (al[j] === n) return ANALYTES[i];
    }
    // name with a method or sample suffix, e.g. "Cholesterol - Total, Serum"
    var stripped = n.replace(/\b(serum|plasma|blood|whole blood|method|calculated|direct|enzymatic|photometry|cbc)\b/g, '').replace(/\s+/g, ' ').trim();
    if (stripped !== n) for (i = 0; i < ANALYTES.length; i++) { al = ANALYTES[i].alias; for (j = 0; j < al.length; j++) if (al[j] === stripped) return ANALYTES[i]; }
    return null;
  }

  /* ---- text items -> rows of cells ---- */
  function rowsFromItems(items) {
    var its = items.filter(function (i) { return i.str && i.str.trim(); }).map(function (i) {
      return { t: i.str, x: i.transform[4], y: i.transform[5], w: i.width || 0, h: i.height || Math.abs(i.transform[3]) || 9 };
    });
    if (!its.length) return [];
    var hs = its.map(function (i) { return i.h; }).sort(function (a, b) { return a - b; });
    var med = hs[Math.floor(hs.length / 2)] || 9, tol = Math.max(2, med * 0.45);
    its.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var rows = [];
    its.forEach(function (it) {
      var r = rows.length ? rows[rows.length - 1] : null;
      if (r && Math.abs(r.y - it.y) <= tol) { r.items.push(it); r.y = (r.y * (r.items.length - 1) + it.y) / r.items.length; }
      else rows.push({ y: it.y, items: [it] });
    });
    rows.forEach(function (r) {
      r.items.sort(function (a, b) { return a.x - b.x; });
      var cells = [];
      r.items.forEach(function (it) {
        var c = cells[cells.length - 1];
        var gap = c ? it.x - c.x2 : 0;
        if (c && gap < Math.max(med * 0.9, 4)) { c.text += (gap > med * 0.15 ? ' ' : '') + it.t.trim(); c.x2 = it.x + it.w; c.h = Math.max(c.h, it.h); }
        else cells.push({ text: it.t.trim(), x: it.x, x2: it.x + it.w, h: it.h, y: it.y });
      });
      r.cells = cells; r.h = Math.max.apply(null, cells.map(function (c) { return c.h; }));
    });
    return rows;
  }

  /* ---- header detection ---- */
  function headerCols(row) {
    var hits = row.cells.filter(function (c) { return HEADER_WORDS.test(c.text) && c.text.length < 40 && !/\d/.test(c.text); });
    if (hits.length < 3 || row.cells.length > 9) return null;
    var cols = { name: null, value: null, unit: null, ref: null, flag: null };
    row.cells.forEach(function (c, i) {
      var t = c.text.toLowerCase(), cx = (c.x + c.x2) / 2;
      if (/(test|investigation|parameter|analyte)/.test(t) && !cols.name) cols.name = cx;
      else if (/(result|value|observed)/.test(t) && !cols.value) cols.value = cx;
      else if (/\bunits?\b/.test(t) && !cols.unit) cols.unit = cx;
      else if (/(reference|range|interval|normal|biological|bio\.?)/.test(t) && !cols.ref) cols.ref = cx;
      else if (/flag/.test(t)) cols.flag = cx;
    });
    if (cols.name === null) cols.name = row.cells[0].x;
    if (cols.value === null) return null;
    return cols;
  }
  function assign(row, cols) {
    var keys = Object.keys(cols).filter(function (k) { return cols[k] !== null; });
    var out = { name: '', value: '', unit: '', ref: '', flag: '' };
    row.cells.forEach(function (c) {
      var cx = (c.x + c.x2) / 2, best = null, bd = 1e9;
      keys.forEach(function (k) { var d = Math.abs(cols[k] - cx); if (k === 'name' && c.x < cols.name + 3) d = Math.min(d, 0); if (d < bd) { bd = d; best = k; } });
      out[best] = (out[best] ? out[best] + ' ' : '') + c.text;
    });
    return out;
  }

  /* ---- fallback: one line of text -> parts ---- */
  var NUM = /^[<>]?\s*[+-]?\d[\d,]*\.?\d*$/;
  var UNIT = /^(%|[a-zA-Z\u00b5\u03bc][a-zA-Z0-9\u00b5\u03bc\/\^\.%\-]*|x?10\^?\d+\/?[a-zA-Z]*|[a-zA-Z]+\/[a-zA-Z0-9\.\^]+)$/;
  function splitLine(cells) {
    var toks = cells.map(function (c) { return c.text; }).join(' ').split(/\s+/);
    var vi = -1;
    for (var i = 1; i < toks.length; i++) if (NUM.test(toks[i]) || QUAL.test(toks[i])) { vi = i; break; }
    if (vi < 1) return null;
    var out = { name: toks.slice(0, vi).join(' '), value: toks[vi], unit: '', ref: '', flag: '' };
    var k = vi + 1;
    if (/^(H|L|High|Low|HH|LL|\*)$/i.test(toks[k] || '')) { out.flag = toks[k]; k++; }
    if (toks[k] && UNIT.test(toks[k]) && !NUM.test(toks[k]) && !/^(to|up|less|more|above|below|male|female|m|f)$/i.test(toks[k])) { out.unit = toks[k]; k++; }
    out.ref = toks.slice(k).join(' ');
    return out;
  }

  /* ---- reference ranges and status ---- */
  function num(s) { return parseFloat(String(s).replace(/,/g, '')); }
  function bandsOf(ref) {
    var out = [], m, re;
    var lab = '([A-Za-z][A-Za-z \\/]*?)';
    var op = '(<=|>=|<|>|\u2264|\u2265)?';
    var nm = '(\\d+(?:\\.\\d+)?)';
    var reLabel = new RegExp(lab + '\\s*[:\\-]?\\s*' + op + '\\s*' + nm + '(?:\\s*(?:-|\u2013|to)\\s*' + nm + ')?', 'g');
    var reNum = new RegExp(op + '\\s*' + nm + '(?:\\s*(?:-|\u2013|to)\\s*' + nm + ')?\\s*[:\\-]?\\s*' + lab + '(?=\\s*(?:<|>|\u2264|\u2265|\\d)|\\s*$)', 'g');
    function runLabel() { var o = []; reLabel.lastIndex = 0; while ((m = reLabel.exec(ref))) o.push({ label: m[1].trim(), op: m[2] || '', a: num(m[3]), b: m[4] ? num(m[4]) : null }); return o; }
    function runNum() { var o = []; reNum.lastIndex = 0; while ((m = reNum.exec(ref))) o.push({ label: m[4].trim(), op: m[1] || '', a: num(m[2]), b: m[3] ? num(m[3]) : null }); return o; }
    // Text that starts with a number or comparison reads "<5.7 Normal 5.7-6.4 Prediabetes"; otherwise "Desirable: <200 Borderline: 200-239"
    var numberFirst = /^\s*[<>\u2264\u2265\d]/.test(ref);
    out = numberFirst ? runNum() : runLabel();
    if (out.length < 2) out = numberFirst ? runLabel() : runNum();
    return out.filter(function (b) { return b.label; });
  }
  function inBand(v, b) {
    if (b.b !== null) return v >= b.a && v <= b.b;
    if (b.op === '<') return v < b.a; if (b.op === '<=' || b.op === '\u2264') return v <= b.a;
    if (b.op === '>') return v > b.a; if (b.op === '>=' || b.op === '\u2265') return v >= b.a;
    return v === b.a;
  }
  function bandStatus(label) {
    var l = label.toLowerCase();
    if (/(borderline|prediabet|pre-diabet|insufficien|intermediate|moderate)/.test(l)) return 'borderline';
    if (/(normal|desirable|optimal|sufficien|adequate|low risk|acceptable|non[- ]?diabetic|healthy)/.test(l)) return 'normal';
    if (/(deficien|low)/.test(l)) return 'low';
    return 'high';
  }
  function sexPart(ref, sex) {
    if (!/(male|female|\bm\s*[:\-]|\bf\s*[:\-])/i.test(ref)) return ref;
    var s = sex === 'Female' ? 'f' : sex === 'Male' ? 'm' : null;
    if (!s) return null;
    var parts = ref.split(/(?=\b(?:male|female|m|f)\b\s*[:\-])/i).map(function (p) { return p.trim(); }).filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].toLowerCase();
      if (s === 'f' ? /^(female|f)\b/.test(p) : /^(male|m)\b/.test(p)) return parts[i].replace(/^[A-Za-z]+\s*[:\-]?\s*/, '');
    }
    return null;
  }
  /* returns { status, band } ; status is one of normal, borderline, low, high, abnormal or '' (cannot tell) */
  function statusFor(valueText, refText, sex, flag) {
    var v = String(valueText || '').trim(), ref = String(refText || '').replace(/\s+/g, ' ').trim();
    var f = String(flag || '').trim().toLowerCase(), printed = /^(h|hh|high)$/.test(f) ? 'high' : /^(l|ll|low)$/.test(f) ? 'low' : '';
    if (QUAL.test(v)) {
      var bad = QUAL_BAD.test(v);
      return { status: bad ? 'abnormal' : 'normal', band: '' };
    }
    var x = num(v.replace(/^[<>]/, ''));
    if (isNaN(x)) return { status: printed, band: '' };
    var r = ref ? sexPart(ref, sex) : '';
    if (r === null) return { status: printed, band: '' };
    var res = { status: '', band: '' }, m;
    var bands = /(normal|desirable|optimal|borderline|prediabet|deficien|insufficien|sufficien|risk|diabet|high|low|near)/i.test(r) ? bandsOf(r) : [];
    if (bands.length >= 2) {
      for (var i = 0; i < bands.length; i++) if (inBand(x, bands[i])) { res = { status: bandStatus(bands[i].label), band: bands[i].label }; break; }
    } else if ((m = r.match(/(\d+(?:\.\d+)?)\s*(?:-|\u2013|to)\s*(\d+(?:\.\d+)?)/))) {
      var lo = num(m[1]), hi = num(m[2]);
      res.status = x < lo ? 'low' : x > hi ? 'high' : 'normal';
    } else if ((m = r.match(/(?:<=|\u2264|<|up to|upto|less than|below|not more than)\s*(\d+(?:\.\d+)?)/i))) {
      var u = num(m[1]); res.status = (/<=|\u2264|up ?to|not more/i.test(m[0]) ? x > u : x >= u) ? 'high' : 'normal';
    } else if ((m = r.match(/(?:>=|\u2265|>|more than|above|greater than|at least)\s*(\d+(?:\.\d+)?)/i))) {
      var l2 = num(m[1]); res.status = (/>=|\u2265|at least/i.test(m[0]) ? x < l2 : x <= l2) ? 'low' : 'normal';
    }
    if (printed) res.status = printed;
    return res;
  }

  /* ---- metadata ---- */
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function isoDate(s) {
    var m;
    if ((m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/))) { var y = +m[3]; if (y < 100) y += 2000; return fmt(y, +m[2], +m[1]); }
    if ((m = s.match(/(\d{1,2})[\s\-]([A-Za-z]{3})[a-z]*[\s\-,]+(\d{2,4})/))) { var mo = MONTHS[m[2].toLowerCase()]; if (mo) { var yy = +m[3]; if (yy < 100) yy += 2000; return fmt(yy, mo, +m[1]); } }
    return '';
  }
  function fmt(y, mo, d) { if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return ''; return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2); }

  /* ---- main: pages = [{ page, rows }] ---- */
  function extract(pages, sex) {
    var meta = { date: '', lab: '' }, tests = [], cols = null, cat = '', last = null;
    pages.forEach(function (pg) {
      var rows = pg.rows;
      rows.forEach(function (r) {
        var line = r.cells.map(function (c) { return c.text; }).join(' ');
        if (!meta.date && /(collect|sample|drawn|registered|reported|received|date)/i.test(line)) { var d = isoDate(line); if (d) meta.date = d; }
        if (!meta.lab) LABS.forEach(function (n) { if (!meta.lab && line.toLowerCase().indexOf(n.toLowerCase()) >= 0) meta.lab = n.replace('Dr. ', 'Dr '); });
      });
      rows.forEach(function (r, ri) {
        var hc = headerCols(r);
        if (hc) { cols = hc; return; }
        var line = r.cells.map(function (c) { return c.text; }).join(' ').trim();
        if (!line) return;
        if (last && Math.abs(last.y - r.y) < r.h * 3.2 && /^(male|female|desirable|optimal|borderline|normal|near optimal|high|very high|low|deficien\w*|insufficien\w*|sufficien\w*|prediabet\w*|diabet\w*|adult|child\w*)\s*:/i.test(line)) { last.ref = (last.ref + ' ' + line).trim(); last.y = r.y; return; }
        var parts = cols ? assign(r, cols) : null;
        if (!parts || !(NUM.test((parts.value || '').split(/\s+/)[0] || '') || QUAL.test((parts.value || '').trim()))) parts = splitLine(r.cells);
        var valTok = parts ? (parts.value || '').trim().split(/\s+/)[0] : '';
        var okVal = parts && (NUM.test(valTok) || QUAL.test((parts.value || '').trim()));
        if (!okVal) {
          // continuation of the previous test (wrapped name, or a reference range on its own line)
          if (last && Math.abs(last.y - r.y) < r.h * 3.2) {
            if (r.cells.length === 1 && /^\(.*\)$/.test(line)) { last.name += ' ' + line; last.analyte = (matchAnalyte(last.name) || {}).key || last.analyte; return; }
            if (/^(male|female|m\s*[:\-]|f\s*[:\-]|[<>]=?|\d+(\.\d+)?\s*(-|\u2013|to)\s*\d|up to|desirable|optimal|borderline|normal|high|low|deficien|insufficien|sufficien|\d+(\.\d+)?\s*[-:]?\s*(normal|desirable|optimal|borderline|high|low))/i.test(line) && r.cells.length <= 3) { last.ref = (last.ref + ' ' + line).trim(); last.y = r.y; return; }
          }
          if (r.cells.length <= 2 && line.length < 60 && !/\d{3,}/.test(line) && /[A-Za-z]{4,}/.test(line) && !SKIP_NAME.test(line) && (line === line.toUpperCase() || /profile|panel|count|function|studies|routine|test$/i.test(line))) cat = line.replace(/\s+/g, ' ');
          return;
        }
        var name = (parts.name || '').replace(/\s+/g, ' ').trim();
        if (name.length < 2 || !/[A-Za-z]{2}/.test(name) || SKIP_NAME.test(name) || /^\d/.test(name)) return;
        var a = matchAnalyte(name);
        var unit = (parts.unit || '').trim(), ref = (parts.ref || '').trim();
        if (!a && !ref && !unit) return;            // address lines, ids and other noise
        var first = r.cells[0], box = { x1: Math.min.apply(null, r.cells.map(function (c) { return c.x; })), x2: Math.max.apply(null, r.cells.map(function (c) { return c.x2; })), y1: r.y - 2, y2: r.y + r.h };
        var t = { page: pg.page, y: r.y, category: cat, name: name, analyte: a ? a.key : '', value: (parts.value || '').trim(), unit: unit || (a ? a.unit : ''), ref: ref, flag: (parts.flag || '').trim(), box: box };
        tests.push(t); last = t;
      });
    });
    tests.forEach(function (t) { var s = statusFor(t.value, t.ref, sex, t.flag); t.status = s.status; t.band = s.band; });
    return { meta: meta, tests: tests };
  }

  root.LabParse = { rowsFromItems: rowsFromItems, extract: extract, statusFor: statusFor, matchAnalyte: matchAnalyte, norm: norm, isoDate: isoDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.LabParse;
})(typeof window !== 'undefined' ? window : globalThis);
