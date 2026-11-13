/* KYH Save and Open: your answers in one small file you keep (.kyh), the same idea as KYF's Save Data and Open.
   - Save: one tap downloads the file. Nothing is asked first and nothing nags while you work.
   - Open: pick a .kyh file and your answers come back, on any device or after the tab was closed.
   The file holds what you entered (profile, symptoms, routine, diet) plus any Doctor Brief notes, as plain JSON.
   It stays on your device: nothing is sent anywhere. Keep it private, it is your health information. */
(function () {
  'use strict';
  var STATE_KEY = 'chart_state_v1', HISTORY_KEY = 'kyh_brief_history_v1', NOTE_KEY = 'kyh_opened_note';
  var FILE_TYPE = 'kyh-vault', EXT = '.kyh';

  function readStore(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function currentState() {
    try { var s = JSON.parse(readStore(STATE_KEY) || 'null'); return s && typeof s === 'object' && !Array.isArray(s) ? s : null; } catch (e) { return null; }
  }
  function hasAnswers(s) { return !!(s && Object.keys(s).some(function (k) { var v = s[k]; return v && (typeof v !== 'object' || Object.keys(v).length); })); }

  function note(html, withOpen) {
    var old = document.getElementById('kyh-vault-note'); if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'kyh-vault-note'; el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9999;max-width:520px;margin:0 auto;padding:12px 16px;border-radius:12px;background:#1b2a2a;color:#fff;font:600 13.5px/1.45 system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.3)';
    el.innerHTML = html + (withOpen ? ' <button type="button" id="kyh-vault-open2" style="margin-left:6px;background:none;border:0;color:#9ee0d3;font:700 13.5px system-ui;text-decoration:underline;padding:6px 2px;cursor:pointer">Open a file</button>' : '');
    document.body.appendChild(el);
    var b = el.querySelector('#kyh-vault-open2'); if (b) b.onclick = function () { el.remove(); pick(); };
    setTimeout(function () { el.remove(); }, 8000);
  }
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var isPhone = function () { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); };

  function buildFile() {
    var state = currentState();
    var history = null; try { history = readStore(HISTORY_KEY); } catch (e) { /* none */ }
    return { app: 'Know Your Health', fileType: FILE_TYPE, version: '1.0.0', savedAt: new Date().toISOString(), data: { state: state || {}, briefHistory: history || null } };
  }

  function save() {
    if (!hasAnswers(currentState())) { note('Nothing to save yet. Fill in a step first, then save.', true); return null; }
    var payload = buildFile();
    var name = 'kyh-' + new Date().toISOString().slice(0, 10) + EXT;
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: isPhone() ? 'application/octet-stream' : 'application/json' });   // generic type: iOS keeps the .kyh name
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    note('✓ Saved as <strong>' + esc(name) + '</strong>' + (isPhone() ? ', in Downloads' : '') + '. It holds your health answers, so keep it private.', true);
    return name;
  }

  /* utils.js (sanitizeIncomingState, persistState) is on every step page; the home page does not load it, so fetch it on demand. */
  function withUtils() {
    if (typeof window.sanitizeIncomingState === 'function') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      var me = document.querySelector('script[src*="shared/vault.js"]');
      s.src = (me ? me.getAttribute('src').replace(/vault\.js/, 'utils.js') : 'shared/utils.js');
      s.onload = resolve; s.onerror = function () { reject(new Error('could not load')); };
      document.head.appendChild(s);
    });
  }

  function parse(text) {
    var j; try { j = JSON.parse(text); } catch (e) { return { error: 'That file could not be read. Is it a KYH file (.kyh)?' }; }
    if (j && j.fileType === FILE_TYPE && j.data && typeof j.data.state === 'object' && j.data.state && !Array.isArray(j.data.state)) return { state: j.data.state, history: j.data.briefHistory };
    return { error: 'This is not a KYH file. Pick a file that was saved from KYH (it ends in .kyh).' };
  }

  async function openFile(file) {
    try {
      var r = parse(await file.text());
      if (r.error) return note(esc(r.error));
      await withUtils();
      var state = window.sanitizeIncomingState(r.state);
      if (!hasAnswers(state)) return note('That file has no answers in it, so nothing was changed.');
      if (hasAnswers(currentState()) && !confirm('Open this file? It replaces the answers in this browser now. (Save first if you want to keep them.)')) return;
      window.persistState(state);
      var h = typeof r.history === 'string' && r.history.length < 200000 ? r.history : null;
      try {
        if (h) sessionStorage.setItem(HISTORY_KEY, h);
        sessionStorage.setItem(NOTE_KEY, file.name || 'file');
      } catch (e) { /* ignore */ }
      var onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
      if (onHome) location.href = 'profile.html'; else location.reload();
    } catch (e) { note('Could not open that file: ' + esc(e.message || e)); }
  }

  function pick() {
    var inp = document.getElementById('kyh-vault-file');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file'; inp.id = 'kyh-vault-file'; inp.hidden = true;   // no accept filter: iOS greys out unknown extensions
      inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; if (f) openFile(f); inp.value = ''; });
      document.body.appendChild(inp);
    }
    inp.click();
  }

  var CSS = '.masthead{position:relative}.kyh-vault{position:absolute;top:50%;transform:translateY(-50%);right:clamp(16px,4vw,48px);display:flex;gap:14px;margin:0;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase}' +
    '.kyh-vault button,.nav-links button[data-kyh]{background:none;border:0;padding:8px 2px;min-height:36px;font:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;cursor:pointer}' +
    '.kyh-vault button:hover,.nav-links button[data-kyh]:hover{color:#1f7a6c;text-decoration:underline}' +
    '@media(min-width:769px){.masthead{padding-right:calc(clamp(16px,4vw,48px) + 118px)}}' +
    '@media(max-width:768px){.kyh-vault{top:12px;transform:none;right:10px;gap:10px}}';
  function wire(root) {
    root.querySelectorAll('[data-kyh="save"]').forEach(function (b) { if (!b.dataset.bound) { b.dataset.bound = '1'; b.addEventListener('click', save); } });
    root.querySelectorAll('[data-kyh="open"]').forEach(function (b) { if (!b.dataset.bound) { b.dataset.bound = '1'; b.addEventListener('click', pick); } });
  }
  function mount() {
    if (!document.getElementById('kyh-vault-css')) { var st = document.createElement('style'); st.id = 'kyh-vault-css'; st.textContent = CSS; document.head.appendChild(st); }
    var bar = document.querySelector('.masthead');
    if (bar && !bar.querySelector('.kyh-vault')) {
      var d = document.createElement('div'); d.className = 'kyh-vault';
      d.innerHTML = '<button type="button" data-kyh="open" title="Open a saved .kyh file">Open</button><button type="button" data-kyh="save" title="Save your answers to a .kyh file">Save</button>';
      bar.appendChild(d);
    }
    var nav = document.querySelector('.nav-links');
    if (nav && !nav.querySelector('[data-kyh]')) {
      var start = nav.querySelector('.btn');
      ['open', 'save'].forEach(function (k) {
        var b = document.createElement('button'); b.type = 'button'; b.dataset.kyh = k; b.textContent = k === 'open' ? 'Open' : 'Save'; b.title = k === 'open' ? 'Open a saved .kyh file' : 'Save your answers to a .kyh file';
        nav.insertBefore(b, start);
      });
    }
    wire(document);
    try { var n = sessionStorage.getItem(NOTE_KEY); if (n) { sessionStorage.removeItem(NOTE_KEY); note('✓ Opened <strong>' + esc(n) + '</strong>. Your answers are back.'); } } catch (e) { /* ignore */ }
  }
  window.KYHVault = { save: save, openFile: openFile, pick: pick, mount: mount, buildFile: buildFile, parse: parse };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
