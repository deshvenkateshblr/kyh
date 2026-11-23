/* "Did you know?" card: one quote-checked fact from an approved source, with a Share button.
   A share carries only the generic fact, its source link and a link back to the app. Never the user's answers.
   Needs shared/data.facts.js and shared/utils.js (loadState). Mounts itself after <main>. */
(function () {
  if (!window.FACTS || !window.FACTS.length) return;
  var AREA_BY_PAGE = { 'diagnostics.html': 'tests', 'routine.html': 'routine', 'diet.html': 'diet', 'summary.html': null };
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (!(page in AREA_BY_PAGE)) return;

  function profile() { try { return (loadState() || {}).profile || {}; } catch (e) { return {}; } }
  function applies(f, p) {
    var w = f.when; if (!w) return true;
    var age = Number(p.age) || 0;
    if (w.minAge && age && age < w.minAge) return false;
    if (w.sex && p.sex && String(p.sex).charAt(0).toUpperCase() !== w.sex) return false;
    if (w.smoker && !(typeof isSmokingRisk === 'function' && isSmokingRisk(p.smoking))) return false;
    if (w.diet && !/veg/i.test(String(p.dietType || ''))) return false;
    return true;
  }
  function pick(area) {
    var p = profile();
    var pool = window.FACTS.filter(function (f) { return f.status === 'ready' && (!area || f.area === area) && applies(f, p); });
    if (!pool.length) return null;
    var day = Math.floor(Date.now() / 86400000);
    return pool[day % pool.length];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shareText(f) {
    var base = (window.FACTS_SHARE_BASE || '') + '?ref=fact-' + f.id;
    return (f.kind === 'myth' ? 'Myth check: ' : 'Did you know? ') + f.headline + '\n' + f.claim +
      '\nSource: ' + f.source.org + ' (' + f.source.url + ')\n\n' + f.hook.text + ' ' + base;
  }
  function flash(btn, msg) { var o = btn.textContent; btn.textContent = msg; setTimeout(function () { btn.textContent = o; }, 1600); }
  function mount(f) {
    var main = document.querySelector('main'); if (!main || document.getElementById('fact-card')) return;
    var card = document.createElement('aside');
    card.id = 'fact-card'; card.className = 'fact-card'; card.setAttribute('aria-label', 'Did you know');
    card.innerHTML =
      '<div class="fact-kicker">' + (f.kind === 'myth' ? 'Myth check' : 'Did you know?') + '</div>' +
      '<h3 class="fact-head">' + esc(f.headline) + '</h3>' +
      '<p class="fact-body">' + esc(f.claim) + '</p>' +
      '<p class="fact-src">Source: <a href="' + esc(f.source.url) + '" target="_blank" rel="noopener">' + esc(f.source.org) + ', ' + esc(f.source.title) + '</a>' +
      (f.source.pageDate ? ' &middot; ' + esc(f.source.pageDate) : '') + '. ' + esc(f.caveat || '') + '</p>' +
      '<div class="fact-actions"><button type="button" class="btn-fact" id="fact-share">Share this</button>' +
      '<button type="button" class="btn-fact ghost" id="fact-copy">Copy</button></div>';
    main.insertAdjacentElement('afterend', card);
    var text = shareText(f);
    document.getElementById('fact-share').addEventListener('click', function () {
      var b = this;
      if (navigator.share) { navigator.share({ title: f.headline, text: text }).catch(function () {}); }
      else { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); }
    });
    document.getElementById('fact-copy').addEventListener('click', function () {
      var b = this;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { flash(b, 'Copied'); }, function () { flash(b, 'Copy failed'); });
      else flash(b, 'Copy not available');
    });
  }
  function init() { var f = pick(AREA_BY_PAGE[page]); if (f) mount(f); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.KYH_FACT_SHARE_TEXT = shareText;
})();
