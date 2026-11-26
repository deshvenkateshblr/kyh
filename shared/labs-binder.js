/* KYH lab binder: keeps the original report files in this browser (IndexedDB) and packs them with the confirmed
   values into one .kylt file (a normal zip). Nothing is uploaded. The .kyh file never contains the files. */
(function (root) {
  'use strict';
  var DB = 'kyh_labs_files_v1', STORE = 'files', mem = {};
  function open() {
    return new Promise(function (res, rej) {
      try {
        var q = indexedDB.open(DB, 1);
        q.onupgradeneeded = function () { q.result.createObjectStore(STORE); };
        q.onsuccess = function () { res(q.result); };
        q.onerror = function () { rej(q.error); };
      } catch (e) { rej(e); }
    });
  }
  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode), out = fn(t.objectStore(STORE));
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : undefined); db.close(); };
        t.onerror = t.onabort = function () { rej(t.error); db.close(); };
      });
    });
  }
  function put(id, rec) { mem[id] = rec; return tx('readwrite', function (s) { return s.put(rec, id); }).catch(function () {}); }
  function get(id) { if (mem[id]) return Promise.resolve(mem[id]); return tx('readonly', function (s) { return s.get(id); }).catch(function () { return null; }); }
  function del(id) { delete mem[id]; return tx('readwrite', function (s) { return s.delete(id); }).catch(function () {}); }
  function keys() { return tx('readonly', function (s) { return s.getAllKeys(); }).then(function (k) { return (k || []).concat(Object.keys(mem)); }).catch(function () { return Object.keys(mem); }); }

  var EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' };
  function safe(s) { return String(s || '').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40); }
  function fileName(rep, names) {
    var rec = names && names.rec, ext = rec ? (EXT[rec.type] || (rec.name.split('.').pop() || 'pdf').toLowerCase()) : 'pdf';
    var tests = (names && names.tests || []).slice(0, 3).map(safe).filter(Boolean).join('+');
    return [rep.date || 'undated', safe(rep.lab), tests, rep.id].filter(Boolean).join('_') + '.' + ext;
  }
  function csv(reports, results) {
    var byR = {}; reports.forEach(function (r) { byR[r.id] = r; });
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = ['date,lab,test,value,unit,printed range,status'];
    results.slice().sort(function (a, b) { return (a.d || '').localeCompare(b.d || '') || (a.n || '').localeCompare(b.n || ''); }).forEach(function (x) {
      var r = byR[x.r] || {}; lines.push([x.d, r.lab, x.n, x.v, x.u, x.f, x.s].map(q).join(','));
    });
    return lines.join('\n');
  }
  /* reports: chosen report objects. withData: include labs.json so KYH can open it again (.kylt). */
  function buildZip(reports, results, withData) {
    var ids = {}; reports.forEach(function (r) { ids[r.id] = 1; });
    var res = results.filter(function (x) { return ids[x.r]; });
    return Promise.all(reports.map(function (r) { return get(r.id).then(function (rec) { return { r: r, rec: rec }; }); })).then(function (items) {
      var files = {}, index = {};
      items.forEach(function (it) {
        if (!it.rec) return;
        var tests = res.filter(function (x) { return x.r === it.r.id; }).map(function (x) { return x.n; });
        var nm = fileName(it.r, { rec: it.rec, tests: tests });
        files['reports/' + nm] = [new Uint8Array(it.rec.bytes), { level: 0 }];
        index[it.r.id] = 'reports/' + nm;
      });
      files['values.csv'] = fflate.strToU8(csv(reports, res));
      if (withData) {
        files['manifest.json'] = fflate.strToU8(JSON.stringify({ type: 'kyh-labs', version: 1, created: new Date().toISOString(), files: index }, null, 1));
        files['labs.json'] = fflate.strToU8(JSON.stringify({ reports: reports, results: res }));
      }
      var missing = reports.length - Object.keys(index).length;
      return { blob: new Blob([fflate.zipSync(files)], { type: 'application/octet-stream' }), count: Object.keys(index).length, missing: missing };
    });
  }
  /* open a .kylt: returns { labs, files:{id:{name,type,bytes}} } */
  function readKylt(file) {
    return file.arrayBuffer().then(function (buf) {
      var z = fflate.unzipSync(new Uint8Array(buf));
      if (!z['manifest.json'] || !z['labs.json']) throw new Error('not kylt');
      var man = JSON.parse(fflate.strFromU8(z['manifest.json']));
      if (man.type !== 'kyh-labs') throw new Error('not kylt');
      var labs = JSON.parse(fflate.strFromU8(z['labs.json'])), out = {};
      Object.keys(man.files || {}).forEach(function (id) {
        var p = man.files[id], b = z[p]; if (!b) return;
        var ext = p.split('.').pop().toLowerCase(), type = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        out[id] = { name: p.split('/').pop(), type: type, bytes: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
      });
      return { labs: labs, files: out };
    });
  }
  root.LabBinder = { put: put, get: get, del: del, keys: keys, buildZip: buildZip, readKylt: readKylt, fileName: fileName };
})(window);
