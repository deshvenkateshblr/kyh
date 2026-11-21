/* One-line fixed bar along the bottom of every page: version, Refresh, Feedback.
   Self-contained (injects its own style) so it also works on pages that do not load styles.css.
   The version people see is the release number in the VERSION file (1.0, 1.1, ...), which tools/stamp.py
   writes into APP_VERSION below. The build id on this script's own address (?v=...) is kept as a tooltip
   and in the feedback email, so a report can be traced to the exact files.
   Feedback opens an email to info@vividnova.com with only the version and page name in it:
   nothing the person entered is ever added to the message. */
(function () {
  if (window.__kyhStatusBar) return;
  window.__kyhStatusBar = true;

  var FEEDBACK_TO = 'info@vividnova.com';

  var APP_VERSION = '1.4';

  function build() {
    var me = document.currentScript || document.querySelector('script[src*="statusbar.js"]');
    var m = me && /[?&]v=([^&#]+)/.exec(me.getAttribute('src') || '');
    return m ? m[1] : 'dev';
  }
  var B = build();
  var V = APP_VERSION;

  function pageName() {
    var f = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    return f || 'index';
  }

  var css = [
    '#kyh-statusbar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;height:32px;box-sizing:border-box;',
    'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;',
    'background:#fff;border-top:1px solid #d7ddd2;color:#5a665e;white-space:nowrap;overflow:hidden;',
    'font:11px/1 ui-monospace,"SF Mono","Cascadia Mono","Roboto Mono",Menlo,Consolas,monospace;letter-spacing:.04em}',
    '#kyh-statusbar .kyh-sb-v{overflow:hidden;text-overflow:ellipsis}',
    '#kyh-statusbar .kyh-sb-actions{display:flex;align-items:center;gap:16px;flex:none}',
    '#kyh-statusbar a,#kyh-statusbar button{font:inherit;letter-spacing:inherit;text-transform:uppercase;color:#1b7164;',
    'background:none;border:0;padding:6px 2px;margin:0;cursor:pointer;text-decoration:none}',
    '#kyh-statusbar a:hover,#kyh-statusbar button:hover{text-decoration:underline}',
    '#kyh-statusbar a:focus-visible,#kyh-statusbar button:focus-visible{outline:2px solid #1b7164;outline-offset:1px}',
    'body.kyh-has-statusbar{padding-bottom:32px}',
    '@media (max-width:420px){#kyh-statusbar{padding:0 10px;gap:8px}#kyh-statusbar .kyh-sb-actions{gap:12px}}',
    '@media print{#kyh-statusbar{display:none!important}body.kyh-has-statusbar{padding-bottom:0}}'
  ].join('');

  function mount() {
    if (document.getElementById('kyh-statusbar')) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var subject = 'KYH feedback (v' + V + ')';
    var body = 'Hi,\n\n[Write your feedback here. Please do not include personal health details.]\n\n' +
               '---\nVersion: ' + V + ' (build ' + B + ')\nPage: ' + pageName();
    var mailto = 'mailto:' + FEEDBACK_TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    var bar = document.createElement('div');
    bar.id = 'kyh-statusbar';
    bar.setAttribute('role', 'contentinfo');
    bar.innerHTML =
      '<span class="kyh-sb-v" title="Build ' + B.replace(/[<>&"]/g, '') + '">KYH &middot; v' + V.replace(/[<>&"]/g, '') + '</span>' +
      '<span class="kyh-sb-actions">' +
        '<button type="button" id="kyh-sb-refresh" title="Reload this page with the latest version. Your answers are kept.">Refresh</button>' +
        '<a id="kyh-sb-feedback" href="' + mailto + '">Feedback</a>' +
      '</span>';
    document.body.appendChild(bar);
    document.body.classList.add('kyh-has-statusbar');

    document.getElementById('kyh-sb-refresh').addEventListener('click', function () {
      // Answers live in this tab's session storage, so a reload keeps them. A reload also fetches
      // the page again, which picks up a newer build id and with it the newest scripts.
      location.reload();
    });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
