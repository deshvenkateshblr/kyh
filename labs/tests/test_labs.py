"""Browser test for the stand-alone lab binder. Serves labs/ on its own, so it also proves nothing outside this folder is needed.
Run: python3 labs/tests/test_labs.py   (needs playwright and chromium)"""
import os, sys, threading, http.server, functools, zipfile, tempfile
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); FX = os.path.join(HERE, 'fixtures')
passed = failed = 0
def check(ok, name, detail=''):
    global passed, failed
    if ok: passed += 1; print('  ok   ', name)
    else: failed += 1; print('  FAIL ', name, ('-> ' + detail) if detail else '')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d/' % srv.server_address[1]

def newpage(b, **kw):
    ctx = b.new_context(viewport={'width': 1200, 'height': 900}, **kw); pg = ctx.new_page()
    pg.errs = []; pg.reqs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e))); pg.on('dialog', lambda d: d.accept()); pg.on('request', lambda r: pg.reqs.append(r.url))
    pg.goto(BASE + 'index.html'); pg.wait_for_selector('#lab-file', state='attached')
    return pg
def load(pg, name, go=True):
    pg.goto(BASE + 'index.html'); pg.wait_for_selector('#lab-file', state='attached')
    pg.set_input_files('#lab-file', os.path.join(FX, name))
    pg.wait_for_selector('#lab-go, #lab-save', timeout=20000)
    if go and pg.locator('#lab-go').count():
        pg.click('#lab-go')
    if go: pg.wait_for_selector('#lab-save', timeout=20000); pg.wait_for_timeout(500)
    else: pg.wait_for_timeout(500)
def rows(pg):
    return pg.evaluate("() => [...document.querySelectorAll('#lab-rows .lab-row')].map(r => [...r.querySelectorAll('input[data-f]')].map(i => i.value).join('|'))")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = newpage(b)
    print('Reading')
    load(pg, 'style_a_table.pdf'); ra = rows(pg)
    check(len(ra) >= 12, 'style A: rows extracted', str(len(ra)))
    check(pg.input_value('#lab-date') == '2026-03-12', 'style A: date read')
    check(any('|HbA1c|' in r for r in ra), 'style A: HbA1c present')
    load(pg, 'style_b_flags.pdf'); check(len(rows(pg)) >= 6, 'style B: rows extracted')
    load(pg, 'style_c_plain.pdf'); check(len(rows(pg)) >= 6 and pg.input_value('#lab-date') == '2026-03-05', 'style C: rows from both pages and date')
    load(pg, 'style_d_scan.pdf'); check(len(rows(pg)) == 0 and 'no readable text' in pg.inner_text('main'), 'style D: scan says no readable text')

    print('Guess screen')
    load(pg, 'style_e_summary_first.pdf', go=False)
    gt = pg.inner_text('#lab-guess')
    check('Tata 1mg' in gt and '12 Mar 2026' in gt and '4–5' in gt, 'names the lab, date and result pages', gt[:160].replace('\n', ' '))
    check(all(w in gt for w in ('Test name', 'Result', 'Unit', 'Range')), 'shows the column layout')
    check(pg.locator('.lab-band').count() >= 4, 'columns are drawn on the page')
    check(pg.locator('#lab-sample tbody tr').count() >= 5, 'shows the first rows read this way')
    check('Complete blood count' in gt and 'Lipid profile' in gt and 'Page 1: text only' in gt, 'says what is on each page')
    n0 = pg.locator('#lab-sample tbody tr').count()
    pg.select_option('[data-kind="4"]', 'text'); pg.wait_for_timeout(400)
    check('you set this' in pg.inner_text('#lab-guess') and pg.locator('#lab-sample tbody tr').count() < n0, 'marking a page as summary skips it')
    pg.select_option('[data-kind="4"]', 'results'); pg.wait_for_timeout(400)
    check(pg.locator('#lab-sample tbody tr').count() == n0, 'marking it as results brings the rows back')
    pg.click('[data-showpg="4"]'); pg.wait_for_timeout(500)
    check('Page 4 of 5' in pg.inner_text('#lab-thispage') and 'Complete blood count' in pg.inner_text('#lab-thispage'), 'the page card follows the page being viewed', pg.inner_text('#lab-thispage')[:120].replace('\n', ' '))
    check(pg.locator('.lab-pagelist li.cur').count() == 1 and 'Page 4' in pg.inner_text('.lab-pagelist li.cur'), 'the page list highlights the current page')
    pg.click('#lab-prev'); pg.wait_for_timeout(500)
    check('Page 3 of 5' in pg.inner_text('#lab-thispage') and 'skipped' in pg.inner_text('#lab-thispage'), 'page 3 shows its own reading (summary text)')
    pg.click('[data-mark="text"]'); pg.wait_for_timeout(700)
    tp = pg.inner_text('#lab-thispage')
    check('Page 4 of 5' in tp and 'Page 3 marked as a summary and skipped' in tp, 'marking shows a confirmation and moves to the next page', tp[:140].replace('\n', ' '))
    pg.click('#lab-prev'); pg.wait_for_timeout(500)
    check('set by you' in pg.inner_text('#lab-thispage').lower() and pg.get_attribute('#lab-wrap', 'data-kind') == 'text', 'a page you marked shows as set by you and is dimmed')
    pg.click('[data-showpg="4"]'); pg.wait_for_timeout(300)
    n1 = pg.locator('#lab-sample tbody tr').count()
    pg.click('[data-mark="text"]'); pg.wait_for_timeout(600)
    check(pg.locator('#lab-sample tbody tr').count() < n1, 'marking the results page as summary removes its rows')
    pg.click('[data-showpg="4"]'); pg.wait_for_timeout(300); pg.click('[data-mark="results"]'); pg.wait_for_timeout(600)
    check(pg.locator('#lab-sample tbody tr').count() == n1, 'marking it as results brings them back')
    pg.click('[data-showpg="4"]'); pg.wait_for_timeout(300)
    pg.click('[data-role="unit"]'); bx = pg.locator('#lab-canvas').bounding_box(); pg.mouse.click(bx['x'] + bx['width'] * 0.8, bx['y'] + 200); pg.wait_for_timeout(400)
    check('as you set it' in pg.inner_text('#lab-guess'), 'tapping the page sets a column')
    load(pg, 'style_e_summary_first.pdf')
    chips = pg.evaluate("() => [...document.querySelectorAll('.lab-chip')].map(c => c.classList.contains('on'))")
    check(chips == [False, False, False, True, True] and len(rows(pg)) >= 12, 'summary pages skipped, results found', str(chips))
    pg.click('#lab-dumpbtn'); pg.wait_for_timeout(300)
    check(pg.evaluate("() => document.getElementById('lab-dump').value").startswith('Layout'), 'layout dump available')
    pg.context.close()

    print('Review, save, keep')
    pg = newpage(b)
    load(pg, 'style_a_table.pdf')
    pg.click('#lab-rows .lab-row >> nth=2'); pg.wait_for_timeout(400)
    check(pg.evaluate("() => { const h = document.getElementById('lab-hl'); return !!h && h.offsetWidth > 0; }"), 'row click highlights the page')
    pg.fill('#lab-rows .lab-row >> nth=0 >> input[data-f=value]', '14.0')
    check('range' in pg.inner_text('#lab-rows .lab-row >> nth=0 >> [data-st]').lower(), 'editing a value recomputes status')
    pg.click('#lab-save'); pg.wait_for_timeout(600)
    check(pg.locator('.lab-reports li').count() == 1 and 'worth raising' in pg.inner_text('main').lower(), 'saved: report listed and flagged values shown')
    pg.reload(); pg.wait_for_selector('.lab-reports li', timeout=8000)
    check(pg.locator('.lab-reports li').count() == 1 and pg.locator('[data-view]').count() == 1, 'still there after reload (kept in the browser, with its file)')
    pg.select_option('#lab-sex', 'Female'); pg.wait_for_timeout(300); pg.reload(); pg.wait_for_selector('#lab-sex')
    check(pg.input_value('#lab-sex') == 'Female', 'sex setting is remembered')
    pg.click('[data-del] >> nth=0'); pg.wait_for_timeout(500)
    check('No lab results saved yet' in pg.inner_text('main'), 'removing a report clears it')
    load(pg, 'style_f_echo.pdf', go=False)
    check('Echocardiogram' in pg.inner_text('#lab-guess') and pg.locator('#lab-note').count() == 1, 'echo report recognised as a written report')
    pg.fill('#lab-note-date', '2026-03-14'); pg.click('#lab-note'); pg.wait_for_timeout(500)
    check('written report' in pg.inner_text('.lab-reports'), 'written report kept without values')
    pg.context.close()

    print('Binder')
    ctx = b.new_context(viewport={'width': 1200, 'height': 900}, accept_downloads=True); p2 = ctx.new_page(); p2.errs = []; p2.reqs = []
    p2.on('pageerror', lambda e: p2.errs.append(str(e))); p2.on('dialog', lambda d: d.accept()); p2.on('request', lambda r: p2.reqs.append(r.url))
    p2.goto(BASE + 'index.html')
    for f in ('style_a_table.pdf', 'style_c_plain.pdf'):
        p2.wait_for_selector('#lab-file', state='attached'); p2.set_input_files('#lab-file', os.path.join(FX, f))
        p2.wait_for_selector('#lab-go'); p2.click('#lab-go'); p2.wait_for_selector('#lab-save'); p2.wait_for_timeout(400); p2.click('#lab-save'); p2.wait_for_timeout(600)
    check(p2.locator('.lab-reports li').count() == 2, 'lists both reports')
    p2.fill('#lab-ff', '2026-03-10'); p2.wait_for_timeout(500)
    check(p2.locator('.lab-reports li').count() == 1, 'filter by from-date')
    p2.fill('#lab-ff', ''); p2.fill('#lab-fx', 'lipid'); p2.press('#lab-fx', 'Enter'); p2.wait_for_timeout(500)
    check(p2.locator('.lab-reports li').count() == 1, 'filter by test name')
    p2.fill('#lab-fx', ''); p2.press('#lab-fx', 'Enter'); p2.wait_for_timeout(400)
    with p2.expect_download() as dl: p2.click('#lab-kylt-save')
    kp = os.path.join(tempfile.gettempdir(), '_labs_test.kylt'); dl.value.save_as(kp); names = zipfile.ZipFile(kp).namelist()
    check(dl.value.suggested_filename.endswith('.kylt') and sum(n.endswith('.pdf') for n in names) == 2 and 'labs.json' in names and 'values.csv' in names, '.kylt holds both PDFs, the values and a csv', str(names)[:140])
    ctx2 = b.new_context(viewport={'width': 1200, 'height': 900}); p3 = ctx2.new_page(); p3.reqs = []; p3.on('request', lambda r: p3.reqs.append(r.url)); p3.goto(BASE + 'index.html'); p3.wait_for_selector('#lab-kylt-file', state='attached')
    p3.set_input_files('#lab-kylt-file', kp); p3.wait_for_timeout(1200)
    check(p3.locator('.lab-reports li').count() == 2 and p3.locator('[data-view]').count() == 2, 'opening a .kylt on a fresh browser restores reports and files')
    outside = [u for u in p2.reqs + p3.reqs if not u.startswith(BASE) and not u.startswith('blob:') and not u.startswith('data:')]
    check(not outside, 'nothing is requested from outside this folder', str(outside[:3]))
    check(not p2.errs, 'no script errors', str(p2.errs[:2]))
    ctx.close(); ctx2.close(); b.close()

print('\n%d passed, %d failed' % (passed, failed)); sys.exit(1 if failed else 0)
