#!/usr/bin/env python3
"""KYH smoke test: drives the real click path (profile -> symptoms -> diagnostics -> routine ->
exercises -> diet -> diet synthesis -> summary -> next steps) in headless Chromium, then runs
a few state-injected regression checks. It starts its own local web server, so nothing needs to
be running first.

    pip install playwright && playwright install chromium      (once)
    python3 tools/flow_test.py                                  (exit code 0 = all passed)

Add --headed to watch it. Every page is also checked for script errors and for local files that
fail to load. Keep the expectations here in step with the app: when wording or a rule changes on
purpose, change the matching check below.
"""
import contextlib
import functools
import http.server
import json
import re
import socket
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
STATE_KEY = 'chart_state_v1'
results = []          # (ok, name, detail)


def check(ok, name, detail=''):
    results.append((bool(ok), name, detail))
    print(('  ok    ' if ok else '  FAIL  ') + name + (('  -> ' + str(detail)) if (detail and not ok) else ''))
    return bool(ok)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


@contextlib.contextmanager
def serve():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    try:
        yield f'http://127.0.0.1:{port}/'
    finally:
        httpd.shutdown()


def watch(page, problems):
    page.on('pageerror', lambda e: problems.append(('script error', page.url.split('/')[-1], str(e)[:160])))
    page.on('response', lambda r: problems.append(('http %s' % r.status, r.url.split('/')[-1], ''))
            if r.status >= 400 and r.url.startswith('http://127.0.0.1') else None)


def state_of(page):
    return page.evaluate(f"JSON.parse(sessionStorage.getItem('{STATE_KEY}') || 'null')")


def inject(page, base, state, then):
    page.goto(base + 'about.html')
    page.evaluate("([k, s]) => sessionStorage.setItem(k, JSON.stringify(s))", [STATE_KEY, state])
    page.goto(base + then)
    page.wait_for_timeout(700)


def card_names(page):
    return page.eval_on_selector_all('.test-card', 'els => els.map(e => e.dataset.exercise || e.dataset.test || "")')


def answer_all_no(page):
    n = page.locator('.test-card').count()
    for i in range(n):
        page.locator(f'label[for$="-{i}-no"]').first.click()
    return n


def full_flow(page, base, problems):
    print('\nFull flow, real clicks')
    # --- home
    page.goto(base + 'index.html')
    logo = page.evaluate("[...document.images].filter(i => /kyh_logo/.test(i.src)).map(i => [i.naturalWidth, i.complete])")
    check(logo and all(w > 0 and c for w, c in logo), 'home: logo loads', logo)
    page.locator('a[href="profile.html"], a[href^="profile.html#"]').first.click()
    page.wait_for_url(re.compile(r'profile\.html'))

    # --- profile
    page.select_option('#f-sex', 'Female')
    page.fill('#f-age', '52')
    page.fill('#f-height-cm', '160')
    page.fill('#f-weight-kg', '70')
    page.evaluate("() => { document.getElementById('more-detail').open = true; }")
    page.fill('#f-waist-cm', '92')
    page.select_option('#f-smoking', 'Never')
    page.select_option('#f-alcohol', 'Occasional')
    page.select_option('#f-repro-status', 'Post-menopausal')
    page.select_option('#f-diet-type', 'Vegetarian')
    page.evaluate("() => { const s = document.getElementById('f-cuisine-type'); if (s.options.length < 2) throw new Error('no cuisines'); }")
    page.select_option('#f-cuisine-type', index=1)
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_url(re.compile(r'symptoms\.html'))
    check(True, 'profile: form accepted, moved to symptoms')

    # --- symptoms
    for s in ('Back Pain', 'Fatigue', 'Insomnia'):
        page.fill('#symptom-input', s)
        page.locator(f'.browse-chip[data-s="{s}"]').first.click()
    page.fill('#symptom-input', '')
    page.locator('#continue-btn').click()
    page.wait_for_url(re.compile(r'diagnostics\.html'))
    check(sorted(state_of(page)['profile']['symptoms']) == ['Back Pain', 'Fatigue', 'Insomnia'], 'symptoms: three picked and carried forward')

    # --- diagnostics
    page.wait_for_selector('.test-card')
    n = answer_all_no(page)
    check(0 < n <= 10, 'diagnostics: cards shown, at most 10', n)
    page.locator('#continue-btn').click()
    page.wait_for_url(re.compile(r'routine\.html'))

    # --- routine (nothing pre-selected; daily and weekly)
    page.wait_for_selector('#continue-btn')
    check(page.locator('.browse-chip.selected').count() == 0, 'routine: nothing pre-selected')
    page.locator('.browse-chip[data-id="sleep-7"]').click()
    page.locator('.browse-chip[data-id="act_015"]').click()
    page.locator('label[for="hd-act_015-480"]').click()
    page.locator('.browse-chip[data-id="act_101"]').click()
    page.locator('label[for="hd-act_101-30"]').click()
    page.locator('.browse-chip[data-id="act_207"]').click()          # Weightlifting (Light), weekly
    page.locator('label[for="pw-act_207-3"]').click()
    page.locator('label[for="ln-act_207-60"]').click()
    strip = page.inner_text('#rt-sum')
    check(re.search(r'~[\d,]+\s*kcal / day', strip, re.I) and re.search(r'\d+\.\d\s*out of 24 hrs', strip, re.I), 'routine: energy and hours strip shown', strip)
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)"); page.wait_for_timeout(200)
    top = page.evaluate("() => { const r = document.getElementById('rt-sum').getBoundingClientRect(); return [r.top, r.height]; }")
    check(top[0] <= 1 and top[1] < 120, 'routine: the strip stays pinned at the top while scrolling', top)
    page.evaluate("() => window.scrollTo(0, 0)")
    nudge = page.inner_text('#rt-nudge')
    check('Not in the daily total' in nudge and re.search(r'about [\d,]+ kcal each time', nudge), 'routine: weekly activity priced and kept out of the daily total', nudge[-200:])
    page.locator('#continue-btn').click()
    page.wait_for_url(re.compile(r'routine-plan\.html'))
    routine = state_of(page)['routine']
    check(routine.get('estimatedCalories', 0) > 1000, 'routine: daily burn saved', routine.get('estimatedCalories'))
    check(any(a.get('freq') == 'weekly' for a in routine['activities']), 'routine: weekly activity saved')

    # --- exercises
    page.wait_for_selector('.test-card')
    check(page.inner_text('h2').strip() == 'Your matched exercises', 'exercises: heading says "matched"', page.inner_text('h2'))
    n = answer_all_no(page)
    check(n == 10, 'exercises: ten cards', n)
    page.locator('#continue-btn').click()
    page.wait_for_url(re.compile(r'diet\.html'))

    # --- diet: the six food-quality markers are required; nutrients use the soft gate (continue anyway)
    page.wait_for_selector('#nutrient-list .test-card')
    page.locator('#continue-btn').click()
    check('Please answer all Food Quality markers' in page.inner_text('#answer-counter'), 'diet: unanswered food markers are asked for')
    marker_foods = page.eval_on_selector_all('.fq-desktop-only input[type=radio][data-food]', 'els => [...new Set(els.map(e => e.dataset.food))]')
    for food in marker_foods:
        page.locator(f'.fq-desktop-only input[data-food="{food}"][value="1-2x/Wk"]').check()
    check(len(marker_foods) == 6, 'diet: six food markers answered', marker_foods)
    page.locator('#continue-btn').click()
    page.locator('#soft-gate-continue-link').click()
    page.wait_for_url(re.compile(r'diet-synthesis\.html'))
    diet = state_of(page)['diet']
    check(diet.get('target', {}).get('cal', 0) >= 1200, 'diet: calorie target at or above the intake floor', diet.get('target'))

    # --- diet synthesis -> summary
    page.wait_for_selector('a.btn:has-text("Finish")')
    page.locator('a.btn:has-text("Finish")').click()
    page.wait_for_url(re.compile(r'summary\.html'))
    page.wait_for_timeout(800)
    body = page.inner_text('body')
    check('Your weekly activities' in body, 'summary: weekly activities insight shown')
    check('Your estimated daily energy use' in body, 'summary: daily energy insight shown')
    brief = page.evaluate("""() => { const d = document.createElement('div');
        KYHDoctorBrief.mountDoctorBrief(d, JSON.parse(sessionStorage.getItem('%s'))); return d.textContent; }""" % STATE_KEY)
    check('Weekly activities:' in brief and 'kcal a week' in brief, 'doctor brief: weekly activities line present')
    check('Typical day:' in brief, 'doctor brief: typical day present')

    # --- next steps
    page.goto(base + 'nextsteps.html')
    page.wait_for_timeout(900)
    ns = page.inner_text('body')
    check('prepare for your doctor consultation' in ns.lower(), 'next steps: doctor prep shown')   # headings are styled in capitals
    check(page.locator('.video-card, [data-video-id], a[href*="youtube.com/watch"]').count() > 0, 'next steps: learning videos listed')


def regressions(page, base):
    print('\nRegression checks, injected state')
    prof = {'age': 45, 'sex': 'Female', 'heightCm': 160, 'weightKg': 65, 'bmi': 25.4, 'whtr': 0.5,
            'symptoms': ['Balance Issues', 'Osteoporosis', 'Muscle Weakness', 'Memory Loss', 'Cognitive Decline']}
    seniors = ("Farmer's Walk (Loaded Carries)", 'Shadow Boxing / Light Sparring (Seated or Standing)', 'Static Lunge (Split Squat Hold)')
    shown = {}
    for age in (64, 65):
        inject(page, base, {'profile': dict(prof, age=age), 'vitals': {}, 'diagnostics': {}, 'routine': {}}, 'routine-plan.html')
        names = card_names(page)
        shown[age] = [x for x in seniors if x in names]
        check(len(names) == 10, f'age {age}: exercise list still fills 10', len(names))
        check('Senior Citizen' not in page.inner_text('body'), f'age {age}: derived flag is never printed')
    check(len(shown[64]) >= 1, 'age 64: moderate-to-high items can still appear', shown[64])
    check(shown[65] == [], 'age 65: moderate-to-high items are hidden', shown[65])

    # incoming links are untrusted: red flags are dropped when state arrives in a #d= fragment
    page.goto(base + 'about.html')
    link = page.evaluate("p => encodeStateParam(p)", {'profile': dict(prof, symptoms=['Chest Pain', 'Back Pain', 'Fainting / Passing Out']), 'vitals': {}, 'diagnostics': {}, 'routine': {}})
    page.goto(base + 'symptoms.html#d=' + link)
    page.wait_for_timeout(700)
    st = state_of(page)
    check(st and 'Chest Pain' not in st['profile']['symptoms'] and 'Fainting / Passing Out' not in st['profile']['symptoms'] and 'Back Pain' in st['profile']['symptoms'],
          'red-flag symptoms are stripped from an incoming link', st and st['profile']['symptoms'])

    # a weekly-only routine must not change the daily burn
    base_acts = [{'id': 'act_011', 'hours': 7, 'mins': 0, 'freq': 'daily'}, {'id': 'act_015', 'hours': 8, 'mins': 0, 'freq': 'daily'}]
    weekly = base_acts + [{'id': 'act_207', 'freq': 'weekly', 'perWeek': 3, 'hours': 1, 'mins': 0}]
    burns = []
    for acts in (base_acts, weekly):
        inject(page, base, {'profile': prof, 'vitals': {}, 'diagnostics': {}, 'routine': {'activities': acts, 'activitiesConfirmed': True}}, 'summary.html')
        burns.append(page.evaluate("estimateTdeeFromActivities(JSON.parse(sessionStorage.getItem('%s')).routine.activities, 65, undefined, JSON.parse(sessionStorage.getItem('%s')).profile)" % (STATE_KEY, STATE_KEY)))
    check(burns[0] == burns[1] and burns[0] > 1000, 'weekly activities do not change the daily burn', burns)

    # pregnancy is out of scope: the profile page pauses with a care message instead of continuing
    page.goto(base + 'about.html')
    page.evaluate("k => sessionStorage.removeItem(k)", STATE_KEY)
    page.goto(base + 'profile.html')
    page.select_option('#f-sex', 'Female')
    page.select_option('#f-repro-status', 'Currently pregnant')
    page.wait_for_timeout(400)
    check('Your pregnancy deserves specialized care' in page.inner_text('body'), 'pregnancy: profile pauses with a care message')


def save_and_open(browser, base):
    print('\nSave and Open (.kyh file)')
    ctx = browser.new_context(viewport={'width': 390, 'height': 800}, accept_downloads=True)
    page = ctx.new_page()
    state = {'profile': {'age': 45, 'sex': 'Female', 'heightCm': 160, 'weightKg': 65, 'symptoms': ['Fatigue']}, 'vitals': {}, 'diagnostics': {}, 'routine': {}}
    # nothing to save yet: a note, no download
    page.goto(base + 'profile.html'); page.wait_for_timeout(500)
    page.locator('.kyh-vault [data-kyh=save]').click()
    check('Nothing to save yet' in page.inner_text('#kyh-vault-note'), 'save: nothing entered yet says so, no empty file')
    inject(page, base, state, 'summary.html')
    check(page.locator('.kyh-vault [data-kyh=save]').count() == 1 and page.locator('.kyh-vault [data-kyh=open]').count() == 1, 'step pages show Open and Save')
    with page.expect_download() as dl:
        page.locator('.kyh-vault [data-kyh=save]').click()
    name = dl.value.suggested_filename
    check(name.startswith('kyh-') and name.endswith('.kyh'), 'save: one tap downloads a .kyh file', name)
    check(page.locator('[role=dialog]').count() == 0 and 'Saved as' in page.inner_text('#kyh-vault-note'), 'save: no dialog, a short note says where it went')
    path = ROOT / 'tools' / '_test.kyh'; dl.value.save_as(str(path))
    import json
    doc = json.loads(path.read_text())
    check(doc['fileType'] == 'kyh-vault' and doc['data']['state']['profile']['age'] == 45, 'file: envelope holds the answers')
    # a fresh browser (tab closed, other device): open brings everything back
    page2 = ctx.new_page(); page2.goto(base + 'about.html'); page2.evaluate("() => sessionStorage.clear()")
    page2.goto(base + 'profile.html'); page2.wait_for_timeout(400)
    check(state_of(page2) is None or not (state_of(page2) or {}).get('profile', {}).get('age'), 'new session starts empty')
    page2.once('dialog', lambda d: d.accept())
    page2.set_input_files('#kyh-vault-file', str(path)) if page2.locator('#kyh-vault-file').count() else None
    if not page2.locator('#kyh-vault-file').count():
        page2.evaluate("() => window.KYHVault.pick = window.KYHVault.pick")
        with page2.expect_file_chooser() as fc:
            page2.locator('.kyh-vault [data-kyh=open]').click()
        fc.value.set_files(str(path))
    page2.wait_for_timeout(900)
    check((state_of(page2) or {}).get('profile', {}).get('age') == 45, 'open: answers are back from the file', state_of(page2))
    check('Opened' in (page2.inner_text('body')), 'open: a note confirms')
    # a wrong file is refused without changing anything
    bad = ROOT / 'tools' / '_bad.kyh'; bad.write_text('{"hello": 1}')
    with page2.expect_file_chooser() as fc:
        page2.locator('.kyh-vault [data-kyh=open]').click()
    fc.value.set_files(str(bad)); page2.wait_for_timeout(500)
    check('not a KYH file' in page2.inner_text('#kyh-vault-note') and (state_of(page2) or {}).get('profile', {}).get('age') == 45, 'open: a wrong file is refused, answers untouched')
    # home page: Open and Save in the nav, and opening there goes to Profile
    page3 = ctx.new_page(); page3.goto(base + 'index.html')
    check(page3.locator('.nav-links [data-kyh=open]').is_visible() and page3.locator('.nav-links [data-kyh=save]').is_visible(), 'home: Open and Save are in the nav, also on a phone')
    with page3.expect_file_chooser() as fc:
        page3.locator('.nav-links [data-kyh=open]').click()
    fc.value.set_files(str(path)); page3.wait_for_url(re.compile(r'profile\.html'), timeout=5000)
    check((state_of(page3) or {}).get('profile', {}).get('age') == 45, 'home: opening a file goes to Profile with the answers loaded')
    path.unlink(); bad.unlink()
    # the old "Remember my progress" option is gone, and an earlier remembered copy is carried into the tab once, then removed
    page4 = ctx.new_page(); page4.goto(base + 'about.html')
    page4.evaluate("([k, s]) => { sessionStorage.clear(); localStorage.setItem('kyh_remember_v1', '1'); localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('kyh_brief_history_v1', 'old note'); }", [STATE_KEY, state])
    page4.goto(base + 'profile.html'); page4.wait_for_timeout(500)
    check(page4.locator('#f-remember').count() == 0 and 'Remember my progress' not in page4.inner_text('body'), 'profile: no Remember my progress option')
    check((state_of(page4) or {}).get('profile', {}).get('age') == 45, 'an earlier remembered copy still loads once')
    check(page4.evaluate("() => [localStorage.getItem('kyh_remember_v1'), localStorage.getItem('chart_state_v1'), localStorage.getItem('kyh_brief_history_v1')]") == [None, None, None], 'then nothing health-related stays in localStorage')
    check(page4.evaluate("() => sessionStorage.getItem('kyh_brief_history_v1')") == 'old note', 'Doctor Brief notes carried over too')
    # Open and Save sit inside the header, not on a line of their own
    box = page.evaluate("() => { const m = document.querySelector('.masthead').getBoundingClientRect(), v = document.querySelector('.kyh-vault').getBoundingClientRect(); return [v.top >= m.top, v.bottom <= m.bottom, v.right <= m.right]; }")
    h_with = page.evaluate("() => document.querySelector('.masthead').offsetHeight")
    page.evaluate("() => document.querySelector('.kyh-vault').style.display = 'none'")
    h_without = page.evaluate("() => document.querySelector('.masthead').offsetHeight")
    check(all(box) and h_with == h_without, 'Open and Save sit inside the header and add no height', [box, h_with, h_without])
    ctx.close()


def hidden_unit_does_not_block(browser, base):
    print('\nProfile: a hidden unit box must not block Continue')
    page = browser.new_page(viewport={'width': 1000, 'height': 900})
    page.goto(base + 'profile.html')
    page.evaluate("() => { document.getElementById('more-detail').open = true; }")
    for t in ('height-unit-toggle', 'weight-unit-toggle', 'waist-unit-toggle'):
        page.locator(f'#{t} [data-unit]:not(.active)').first.click()
    # old values left in the boxes that are now hidden, outside their limits
    page.evaluate("() => { document.getElementById('f-waist-cm').disabled = false; document.getElementById('f-waist-cm').value = '3'; document.getElementById('f-height-cm').value = '5'; document.getElementById('f-weight-kg').value = '1'; }")
    page.select_option('#f-sex', 'Female'); page.fill('#f-age', '40')
    page.fill('#f-height-ft', '5'); page.fill('#f-height-in', '4'); page.fill('#f-weight-lb', '150'); page.fill('#f-waist-in', '34')
    page.select_option('#f-smoking', 'Never'); page.select_option('#f-alcohol', 'Occasional')
    page.select_option('#f-repro-status', 'Regular cycle'); page.select_option('#f-diet-type', 'Vegetarian'); page.select_option('#f-cuisine-type', index=1)
    page.evaluate("() => { for (const id of ['f-waist-cm','f-height-cm','f-weight-kg']) { document.getElementById(id).value = id === 'f-waist-cm' ? '3' : (id === 'f-height-cm' ? '5' : '1'); } }")
    page.locator('#profile-form button[type=submit]').click()
    try:
        page.wait_for_url(re.compile(r'symptoms\.html'), timeout=5000); ok = True
    except Exception:
        ok = False
    check(ok, 'profile: with inches and lb chosen, Continue goes on even if a hidden cm or kg box holds an old value', page.inner_text('#validation-msg') if not ok else '')
    page.close()


def lighter_start(browser, base):
    print('\nShorter start: fewer required fields, no About gate, one disclaimer')
    page = browser.new_page(viewport={'width': 1000, 'height': 900})
    # home goes straight to the profile (no About screen, no checkbox)
    page.goto(base + 'index.html')
    hrefs = page.eval_on_selector_all('a.btn', 'els => els.map(e => e.getAttribute("href"))')
    starts = [h for h in hrefs if h and not h.startswith('#')]
    check(starts and all(h.startswith('profile.html') for h in starts), 'home: every Start button goes to the profile', hrefs)
    page.goto(base + 'about.html')
    check(page.locator('input[type=checkbox]').count() == 0, 'about: no acknowledgement checkbox')
    check(page.locator('#btn-continue').is_visible(), 'about: Continue is available straight away')
    check(len((page.inner_text('main') or '').split()) < 260, 'about: short enough to read in under a minute')

    # profile: only sex, age, height, weight are needed
    page.goto(base + 'profile.html')
    check(not page.locator('#more-detail').evaluate('e => e.open'), 'profile: optional detail starts closed')
    page.select_option('#f-sex', 'Male'); page.fill('#f-age', '45')
    page.fill('#f-height-cm', '172'); page.fill('#f-weight-kg', '80')
    page.locator('#profile-form button[type=submit]').click()
    try:
        page.wait_for_url(re.compile(r'symptoms\.html'), timeout=5000); ok = True
    except Exception:
        ok = False
    check(ok, 'profile: four fields are enough to continue', page.inner_text('#validation-msg') if not ok else '')
    pr = (state_of(page) or {}).get('profile', {})
    check(pr.get('waistCm') is None and pr.get('whtr') is None, 'profile: blank waist is saved as nothing, not zero or NaN', pr)

    # a woman is still asked the pregnancy question
    page.goto(base + 'profile.html')
    page.select_option('#f-sex', 'Female'); page.fill('#f-age', '33')
    page.fill('#f-height-cm', '160'); page.fill('#f-weight-kg', '60')
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_timeout(400)
    check('profile.html' in page.url and 'menstrual' in page.inner_text('#validation-msg').lower(), 'profile: women are still asked the pregnancy question first')

    # out-of-range optional waist opens the detail section and says why
    page.select_option('#f-repro-status', 'Regular cycle')
    page.evaluate("() => { document.getElementById('f-waist-cm').value = '3'; }")
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_timeout(400)
    check(page.locator('#more-detail').evaluate('e => e.open') and 'waist' in page.inner_text('#validation-msg').lower(), 'profile: a bad waist opens the detail section and explains')

    # quick path: straight to tests, with nothing else filled in
    page.goto(base + 'profile.html')
    page.select_option('#f-sex', 'Male'); page.fill('#f-age', '52')
    page.fill('#f-height-cm', '170'); page.fill('#f-weight-kg', '82')
    page.locator('#btn-quick').click()
    try:
        page.wait_for_url(re.compile(r'diagnostics\.html'), timeout=5000); ok = True
    except Exception:
        ok = False
    check(ok, 'quick path: four fields, then straight to the tests list')
    page.wait_for_selector('.test-card', timeout=8000)
    check(page.locator('.test-card').count() > 0, 'quick path: a starter list of tests is shown')
    check('starter list' in page.inner_text('main').lower(), 'quick path: the list is framed as a usable starter result')

    # diet page asks for its own preference instead of sending people back
    page.goto(base + 'diet.html')
    page.wait_for_timeout(700)
    check(page.locator('#d-type').count() == 1 and 'Go back to Profile' not in page.inner_text('main'), 'diet: asks for dietary preference in place, no bounce to Profile')
    page.select_option('#d-type', 'Vegan')
    page.wait_for_timeout(300)
    check((state_of(page) or {}).get('profile', {}).get('dietType') == 'Vegan', 'diet: the choice is saved to the profile')

    # one disclaimer: step pages do not repeat it, results pages do
    for pg in ('profile.html', 'symptoms.html', 'diagnostics.html'):
        page.goto(base + pg); page.wait_for_timeout(500)
        foot = page.inner_text('footer').lower()
        check('substitute for professional' not in foot, f'{pg}: footer does not repeat the disclaimer')
    page.close()


def main():
    headed = '--headed' in sys.argv
    problems = []
    with serve() as base, sync_playwright() as p:
        browser = p.chromium.launch(headless=not headed)
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        watch(page, problems)
        try:
            full_flow(page, base, problems)
        except Exception as e:                       # the flow stops at its first failure; later steps depend on it
            check(False, 'full flow stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}  (at {page.url.split("/")[-1][:60]})')
        try:
            regressions(page, base)
        except Exception as e:
            check(False, 'regression checks stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        try:
            save_and_open(browser, base)
        except Exception as e:
            check(False, 'save and open stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        try:
            lighter_start(browser, base)
        except Exception as e:
            check(False, 'shorter start checks stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        try:
            hidden_unit_does_not_block(browser, base)
        except Exception as e:
            check(False, 'hidden unit check stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        browser.close()
    print('\nPage health')
    check(not problems, 'no script errors or failed local files on any page', problems[:6])
    failed = [r for r in results if not r[0]]
    print(f'\n{len(results) - len(failed)} passed, {len(failed)} failed')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
