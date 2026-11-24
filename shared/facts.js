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
    var wrap = document.createElement('div'); wrap.className = 'fact-wrap';
    var card = document.createElement('aside');
    card.id = 'fact-card'; card.className = 'fact-card'; card.setAttribute('aria-label', 'Did you know');
    card.innerHTML =
      '<div class="fact-kicker">' + (f.kind === 'myth' ? 'Myth check' : 'Did you know?') + '</div>' +
      '<h3 class="fact-head">' + esc(f.headline) + '</h3>' +
      '<p class="fact-body">' + esc(f.claim) + '</p>' +
      '<p class="fact-src">Source: <a href="' + esc(f.source.url) + '" target="_blank" rel="noopener">' + esc(f.source.org) + ', ' + esc(f.source.title) + '</a>' +
      (f.caveat ? '. ' + esc(f.caveat) : '') + '</p>' +
      '<div class="fact-actions" id="fact-actions"></div>';
    wrap.appendChild(card);
    main.insertAdjacentElement('afterend', wrap);
    var text = shareText(f), link = (window.FACTS_SHARE_BASE || '') + '?ref=fact-' + f.id;
    var xText = (f.kind === 'myth' ? 'Myth check: ' : 'Did you know? ') + f.headline + '. ' + f.hook.text + ' (' + f.source.org + ')';
    var box = document.getElementById('fact-actions');
    function btn(label, id, secondary) { var b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'btn' + (secondary ? ' secondary' : ''); b.textContent = label; box.appendChild(b); return b; }
    var phone = window.matchMedia && matchMedia('(pointer:coarse)').matches && navigator.share;
    if (phone) {
      btn('Share this', 'fact-share').addEventListener('click', function () { navigator.share({ title: f.headline, text: text }).catch(function () {}); });
    } else {
      btn('Share on WhatsApp', 'fact-wa').addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); });
      btn('Share on X', 'fact-x', true).addEventListener('click', function () { window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(xText) + '&url=' + encodeURIComponent(link), '_blank', 'noopener'); });
    }
  }
  function init() { var f = pick(AREA_BY_PAGE[page]); if (f) mount(f); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.KYH_FACT_SHARE_TEXT = shareText;
})();
