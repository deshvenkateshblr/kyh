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


def card_names(page, scope=''):
    return page.eval_on_selector_all(f'{scope} .test-card', 'els => els.map(e => e.dataset.exercise || e.dataset.test || "")')


def answer_all_no(page, scope=''):
    n = page.locator(f'{scope} .test-card').count()
    for i in range(n):
        lab = page.locator(f'{scope} label[for$="-{i}-no"]').first
        while not lab.is_visible() and page.locator('#tp-next').is_visible():      # tests are shown two at a time
            page.locator('#tp-next').click()
        lab.click()
    return n


def full_flow(page, base, problems):
    print('\nFull flow, real clicks')
    # --- home
    page.goto(base + 'index.html')
    logo = page.evaluate("[...document.images].filter(i => /kyh_logo/.test(i.src)).map(i => [i.naturalWidth, i.complete])")
    check(logo and all(w > 0 and c for w, c in logo), 'home: logo loads', logo)
    page.locator('a[href="profile.html"], a[href^="profile.html#"]').first.click()
    page.wait_for_url(re.compile(r'profile\.html'))

    # --- profile: sex and age only (women are also asked the pregnancy question), then straight to tests
    check(not page.locator('#f-height-cm').is_visible() and not page.locator('#f-diet-type').is_visible(), 'profile: first visit asks only for sex and age')
    page.select_option('#f-sex', 'Female')
    page.fill('#f-age', '52')
    page.select_option('#f-repro-status', 'Post-menopausal')
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_url(re.compile(r'diagnostics\.html'))
    check(True, 'profile: sex and age are enough, went straight to the tests')

    # --- first list, from age and sex alone
    page.wait_for_selector('.test-card')
    check(page.locator('.test-card').count() > 0, 'tests: a starter list is shown from age and sex alone')
    check('refine this list' in page.inner_text('main').lower(), 'tests: offers to refine with BMI and dietary preference')
    starter = card_names(page)

    # --- refine in place: the panel opens on the tests page; each change redraws the list, no new screen
    check(not page.locator('#refine-body').is_visible(), 'refine: panel starts collapsed')
    page.locator('#refine-toggle').click()
    check(page.locator('#rf-height').is_visible() and not page.locator('#rf-sym-search').is_visible() and not page.locator('#rf-diet').is_visible(), 'refine: one step at a time, BMI first')
    check('step 1 of 3' in page.inner_text('#refine-count').lower(), 'refine: shows which step of three')
    order = page.evaluate("() => [...document.querySelectorAll('#refine-body .refine-step-h')].map(e => e.textContent.toLowerCase())")
    check('bmi' in order[0] and 'symptom' in order[1] and 'diet' in order[2], 'refine: steps run BMI, symptoms, dietary preference', order)
    check(all(len(t.strip()) > 20 for t in page.evaluate("() => [...document.querySelectorAll('#refine-body .refine-step > p:first-of-type')].map(e => e.textContent)")), 'refine: each step has a short description')
    check('skip' in page.inner_text('#refine-next').lower(), 'refine: an untouched step offers Skip')
    page.fill('#rf-height', '160'); page.fill('#rf-weight', '70')
    check('bmi 27.3' in page.inner_text('#rf-bmi').lower(), 'refine: BMI shown live as the numbers are typed', page.inner_text('#rf-bmi'))
    page.wait_for_function("() => (JSON.parse(sessionStorage.getItem('%s')).profile || {}).bmi > 27" % STATE_KEY, timeout=5000)
    check('diagnostics.html' in page.url and 'profile.html' not in page.url, 'refine: BMI applied without leaving the page')
    pr = state_of(page)['profile']
    check(abs(pr['bmi'] - 27.3) < 0.2, 'refine: BMI saved', pr.get('bmi'))
    before_waist = card_names(page)
    page.fill('#rf-waist', '92')
    check('waist-to-height 0.57' in page.inner_text('#rf-bmi').lower(), 'refine: waist-to-height shown live beside BMI', page.inner_text('#rf-bmi'))
    page.wait_for_function("() => (JSON.parse(sessionStorage.getItem('%s')).profile || {}).waistCm === 92" % STATE_KEY, timeout=5000)
    pw = state_of(page)['profile']
    check(abs(pw['whtr'] - 92/160) < 0.01, 'refine: waist and waist-to-height saved in place', pw.get('whtr'))
    after_bmi = card_names(page)
    check('bmi 27.3' in page.inner_text('#refine-summary').lower(), 'refine: summary shows what the list was refined with')
    check('next' in page.inner_text('#refine-next').lower(), 'refine: a filled step offers Next')
    page.locator('#refine-next').click()
    check(page.locator('#rf-sym-search').is_visible() and not page.locator('#rf-height').is_visible(), 'refine: Next moves to symptoms and hides BMI')
    page.locator('#rf-sym-suggest .browse-chip').first.click()
    first_sym = state_of(page)['profile']['symptoms']
    check(len(first_sym) == 1 and 'symptom' in page.inner_text('#refine-summary').lower(), 'refine: a symptom picked in place is saved', first_sym)
    check(page.locator('#rf-sym-suggest .browse-chip').count() == 10 and not page.locator('#rf-sym-prev').is_visible(), 'refine: symptoms show ten at a time, no Previous on the first page')
    first_page = page.locator('#rf-sym-suggest .browse-chip').all_inner_texts()
    page.locator('#rf-sym-next').click()
    second = page.locator('#rf-sym-suggest .browse-chip').all_inner_texts()
    check(len(second) == 10 and not set(second) & set(first_page) and page.locator('#rf-sym-prev').is_visible(), 'refine: Show next 10 brings ten different symptoms and offers Previous', second[:3])
    page.locator('#rf-sym-suggest .browse-chip').nth(5).click()
    check(len(state_of(page)['profile']['symptoms']) == 2, 'refine: a symptom picked on page two is saved')
    page.locator('#rf-sym-prev').click()
    check(page.locator('#rf-sym-suggest .browse-chip').all_inner_texts() == first_page, 'refine: Previous returns to the first ten')
    for _ in range(20):
        if not page.locator('#rf-sym-next').is_visible(): break
        page.locator('#rf-sym-next').click()
    check(not page.locator('#rf-sym-next').is_visible(), 'refine: the last page has no Show next')
    page.fill('#rf-sym-search', 'Fatigue')
    page.locator('#rf-sym-suggest .browse-chip[data-s="Fatigue"]').click()
    check('Fatigue' in state_of(page)['profile']['symptoms'], 'refine: symptom search works in place')
    page.fill('#rf-sym-search', '')
    page.locator('#refine-next').click()
    check(page.locator('#rf-diet').is_visible(), 'refine: Next moves to dietary preference')
    page.select_option('#rf-diet', 'Vegetarian')
    check(state_of(page)['profile']['dietType'] == 'Vegetarian', 'refine: dietary preference saved')
    check('updated' in page.inner_text('#refine-live').lower() or 'changed' in page.inner_text('#refine-live').lower() or 'same' in page.inner_text('#refine-live').lower(), 'refine: says what changed in the list', page.inner_text('#refine-live'))
    refined = card_names(page)
    check(refined != starter, 'refine: BMI, symptoms and diet change the list', (len(starter), len(refined)))
    # answers given before a change are kept
    page.locator('label[for="done-0-no"]').click()
    kept = page.locator('.test-card').first.get_attribute('data-test')
    page.select_option('#rf-diet', 'Vegan')
    still = page.evaluate("(t) => { const c = [...document.querySelectorAll('.test-card')].find(x => x.dataset.test === t); return !c || !!c.querySelector('input[type=radio]:checked'); }", kept)
    check(still, 'refine: an answer already given survives a list change')
    page.locator('#refine-back').click()
    check(page.locator('#rf-sym-search').is_visible(), 'refine: Back returns to the previous step')
    page.locator('#refine-next').click(); page.locator('#refine-next').click()
    check(not page.locator('#refine-body').is_visible(), 'refine: Done closes the panel')
    check('change my answers' in page.inner_text('#refine-toggle').lower(), 'refine: toggle now offers to change answers')
    page.locator('#refine-toggle').click()
    page.wait_for_function("() => !document.getElementById('rf-height').hidden || true")
    check('step 1 of 3' in page.inner_text('#refine-count').lower() or page.locator('#refine-body').is_visible(), 'refine: reopens')
    # symptom wording is not repeated on every card
    check(page.locator('.test-card .symptom').count() == 0, 'tests: no "Watch for" symptom line repeated on each card')
    # the full form is still there for waist, feet/pounds and lifestyle
    page.locator('#refine-body .refine-step[data-step="0"]').evaluate("e => { document.querySelectorAll('#refine-body .refine-step').forEach(x => x.hidden = true); e.hidden = false; }")
    page.locator('#refine a:has-text("full form")').click()
    page.wait_for_url(re.compile(r'profile\.html#refine'))
    check(page.input_value('#f-height-cm') == '160' and page.input_value('#f-age') == '52', 'refine: full form keeps what was entered in place')
    page.evaluate("() => { document.getElementById('more-detail').open = true; }")
    page.fill('#f-waist-cm', '92')
    page.select_option('#f-smoking', 'Never')
    page.select_option('#f-alcohol', 'Occasional')
    page.select_option('#f-diet-type', 'Vegetarian')
    page.select_option('#f-cuisine-type', index=1)
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_url(re.compile(r'diagnostics\.html'))
    page.wait_for_selector('.test-card')
    check(page.locator('#refine-body').is_visible() is False, 'refine: tests page opens with the panel collapsed after the full form')
    # returning user: the first screen stays simple and wording follows where they came from
    page.goto(page.url.split('diagnostics.html')[0] + 'profile.html')
    page.wait_for_selector('#btn-submit')
    check('show my tests' in page.inner_text('#btn-submit').lower() and not page.locator('#body-section').is_visible(), 'returning: profile opens as sex and age with "Show my tests", not the detailed form')
    check(page.input_value('#f-age') == '52', 'returning: sex and age are prefilled')
    page.goto(page.url.split('profile.html')[0] + 'profile.html#refine&next=routine.html')
    page.wait_for_selector('#btn-submit')
    check('back to routine' in page.inner_text('#btn-submit').lower() and 'back to my routine' in page.inner_text('#btn-back-list').lower(), 'returning: detailed form wording follows the page you came from', page.inner_text('#btn-submit'))
    check('update my list' not in page.content().lower(), 'returning: no "Update my list" wording')
    page.goto(page.url.split('profile.html')[0] + 'diagnostics.html')
    page.wait_for_selector('.test-card')

    # --- symptoms, added from the tests page
    page.locator('#refine-toggle').click(); page.locator('#refine-next').click()
    page.locator('#refine a[href="symptoms.html"]').click()
    page.wait_for_url(re.compile(r'symptoms\.html'))
    for s in ('Back Pain', 'Fatigue', 'Insomnia'):
        page.fill('#symptom-input', s)
        page.locator(f'.browse-chip[data-s="{s}"]').first.click()
    page.fill('#symptom-input', '')
    page.locator('#continue-btn').click()
    page.wait_for_url(re.compile(r'diagnostics\.html'))
    check(set(['Back Pain', 'Insomnia', 'High Blood Pressure']) <= set(state_of(page)['profile']['symptoms']), 'symptoms: new picks carried forward and the one picked in place kept (Fatigue was toggled off on purpose)', state_of(page)['profile']['symptoms'])

    # --- diagnostics
    page.wait_for_selector('.test-card')
    vis = page.locator('.test-card:visible').count()
    check(vis == 2, 'tests: two tests are shown at a time', vis)
    check('tests 1' in page.inner_text('#tp-range').lower() and page.locator('.tp-pill').count() == page.locator('.test-card').count(), 'tests: range label and one numbered pill per test')
    check(page.locator('#tp-next').is_visible() and not page.locator('#continue-btn').is_visible(), 'tests: Next 2 first, Continue only on the last page')
    page.locator('label[for="done-0-no"]').click()
    check('done' in page.locator('.tp-pill').first.get_attribute('class'), 'tests: an answered test marks its pill')
    first_two = page.locator('.test-card:visible').evaluate_all('els => els.map(e => e.dataset.test)')
    page.locator('#tp-next').click()
    next_two = page.locator('.test-card:visible').evaluate_all('els => els.map(e => e.dataset.test)')
    check(len(next_two) == 2 and not set(first_two) & set(next_two) and page.locator('#tp-prev').is_visible(), 'tests: Next 2 shows the next two and offers Previous', next_two)
    page.locator('.tp-pill').last.click()
    check(page.locator('#continue-btn').is_visible() and not page.locator('#tp-next').is_visible(), 'tests: the last page shows Continue, not Next')
    page.locator('.tp-pill').first.click()
    check(page.locator('.test-card:visible').evaluate_all('els => els.map(e => e.dataset.test)') == first_two, 'tests: a pill jumps back to its page')
    labels = [t.lower() for t in page.locator('.test-card:visible').first.locator('.decide-row label').all_inner_texts()]
    check(labels == ['keep it', 'already done', 'decide later', 'not for me'], 'tests: four choices per test', labels)
    # Decide later = parked for another visit: one line of text, no extra decisions now
    page.locator('label[for="done-1-later"]').click()
    check(page.locator('#later-row-1').is_visible() and 'parked' in page.inner_text('#later-row-1').lower(), 'parked: Decide later says it waits for a later visit')
    check('later' in page.locator('.tp-pill').nth(1).get_attribute('class'), 'parked: the pill is marked')
    check('tp-review-chip' not in page.content() and '10 of the' not in page.inner_text('main'), 'tests: no Review chip and no "10 of N tests" line')
    page.locator('.tp-pill').last.click()
    check(page.locator('#review-bucket').is_visible() and 'parked for a later visit' in page.inner_text('#review-bucket').lower() and page.locator('#review-bucket button').count() == 0, 'parked: the last page summarises parked tests in text, with no buttons')
    page.locator('.tp-pill').nth(1).click()
    page.locator('label[for="done-1-skip"]').click()
    check('skip' in page.locator('.tp-pill').nth(1).get_attribute('class'), 'tests: Not for me marks the pill as set aside')
    page.locator('.tp-pill').nth(1).click()
    check(page.locator('#skip-reason-1').is_visible(), 'review: a reason can be given for a test set aside')
    page.select_option('#skip-reason-1', 'Too much hassle')
    check(page.evaluate("() => document.getElementById('result-note-0').placeholder.toLowerCase()").find('vitamin') == -1, 'results: the example is no longer Vitamin D')
    page.locator('label[for="done-0-yes"]').click()
    check(page.locator('#result-note-0').is_visible() and 'vitamin' not in page.locator('#result-note-0').get_attribute('placeholder').lower(), 'results: optional result box with a generic prompt once a test is marked done')
    got = page.evaluate("() => readAnswers()")
    sk = [v for v in got.values() if v.get('decision') == 'skip']
    check(len(sk) == 1 and sk[0]['skipReason'] == 'Too much hassle' and sk[0]['done'] is False, 'review: a set-aside test is saved with its reason', sk)
    page.goto(page.url.split('diagnostics.html')[0] + 'summary.html')
    page.wait_for_function("() => window.KYHDoctorBrief")
    blk = page.evaluate("(a) => { const st = {diagnostics: {topTests: [{test:'Lipid Profile'},{test:'Pap Smear'},{test:'HbA1c'}], answers: a}}; const b = window.KYHDoctorBrief.diagnosticsBlock(st); return {asks: b.asks.map(r=>r.name), also: b.alsoOnList.map(r=>r.name), aside: b.setAside.map(r=>r.name)}; }",
        {'Pap Smear': {'decision': 'skip', 'done': False, 'skipReason': 'Too much hassle'}})
    check('Pap Smear' not in blk['asks'] + blk['also'] and blk['aside'] == ['Pap Smear'], 'brief: a set-aside test is not offered as a test to ask about', blk)
    page.go_back(); page.wait_for_selector('.test-card')
    page.locator('label[for="done-0-no"]').click()
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
    page.wait_for_selector('#movement-plan .test-card')
    check('routine.html' in page.url, 'routine: the exercise plan opens on the same page, no new screen')
    routine = state_of(page)['routine']
    check(routine.get('estimatedCalories', 0) > 1000, 'routine: daily burn saved', routine.get('estimatedCalories'))
    check(any(a.get('freq') == 'weekly' for a in routine['activities']), 'routine: weekly activity saved')

    # --- exercises (same page, under the day)
    check(page.inner_text('#movement-plan h2').strip() == 'Your matched exercises', 'exercises: heading says "matched"', page.inner_text('#movement-plan h2'))
    n = page.locator('#movement-plan .test-card').count()
    check(n == 10, 'exercises: ten cards', n)
    page.locator('#mp-continue-btn').click()          # answers are optional: continue with none given
    page.wait_for_url(re.compile(r'diet\.html'))

    # --- diet: every answer is optional; targets open in place
    page.wait_for_selector('#nutrient-list .test-card')
    check('Continue anyway' not in page.inner_text('body'), 'diet: no "continue anyway" gate')
    page.locator('#continue-btn').click()
    page.wait_for_selector('#diet-targets .test-card')
    check('diet.html' in page.url and page.locator('#diet-targets').is_visible(), 'diet: targets open on the same page, no new screen')
    diet = state_of(page)['diet']
    check(diet.get('target', {}).get('cal', 0) >= 1200, 'diet: calorie target at or above the intake floor', diet.get('target'))
    # changing an answer clears the targets so the screen never disagrees with what is saved
    page.locator('.fq-desktop-only input[type=radio][data-food]').first.check()
    page.wait_for_timeout(200)
    check(not page.locator('#diet-targets').is_visible(), 'diet: changing an answer clears the targets')
    page.locator('#continue-btn').click()
    page.wait_for_selector('#dt-finish')

    # --- diet synthesis -> summary
    page.locator('#dt-finish').click()
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
        confirmed = {'activitiesConfirmed': True, 'activities': [{'id': 'act_011', 'freq': 'daily', 'hours': 7, 'mins': 0}], 'estimatedCalories': 2000}
        inject(page, base, {'profile': dict(prof, age=age), 'vitals': {}, 'diagnostics': {}, 'routine': confirmed}, 'routine-plan.html')
        page.wait_for_selector('#movement-plan .test-card')
        names = card_names(page, '#movement-plan')
        shown[age] = [x for x in seniors if x in names]
        check(len(names) == 10, f'age {age}: exercise list still fills 10', len(names))
        check('routine.html' in page.url, f'age {age}: the old Exercises address forwards to the Routine page')
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
    page.goto(base + 'profile.html#refine')
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
        page.wait_for_url(re.compile(r'diagnostics\.html'), timeout=5000); ok = True
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

    # profile: sex and age are all that is asked at first
    page.goto(base + 'profile.html')
    check(not page.locator('#body-section').is_visible() and not page.locator('#refine-extra').is_visible(), 'profile: height, weight and diet are not asked up front')
    page.select_option('#f-sex', 'Male'); page.fill('#f-age', '45')
    page.locator('#profile-form button[type=submit]').click()
    try:
        page.wait_for_url(re.compile(r'diagnostics\.html'), timeout=5000); ok = True
    except Exception:
        ok = False
    check(ok, 'profile: sex and age are enough to see the first tests', page.inner_text('#validation-msg') if not ok else '')
    page.wait_for_selector('.test-card', timeout=8000)
    check('starter list' in page.inner_text('main').lower(), 'tests: the first list is framed as a usable starter result')
    pr = (state_of(page) or {}).get('profile', {})
    check(not pr.get('heightCm') and pr.get('bmi') is None, 'profile: no height, weight or BMI is invented', pr)

    # a woman is still asked the pregnancy question first
    page.goto(base + 'profile.html')
    page.select_option('#f-sex', 'Female'); page.fill('#f-age', '33')
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_timeout(400)
    check('profile.html' in page.url and 'menstrual' in page.inner_text('#validation-msg').lower(), 'profile: women are still asked the pregnancy question first')

    # refine mode rules
    page.goto(base + 'profile.html#refine')
    page.wait_for_timeout(300)
    page.select_option('#f-sex', 'Male'); page.fill('#f-age', '45')
    page.fill('#f-height-cm', '172')
    page.locator('#profile-form button[type=submit]').click(); page.wait_for_timeout(300)
    check('both height and weight' in page.inner_text('#validation-msg').lower(), 'refine: height without weight is explained')
    page.fill('#f-weight-kg', '82')
    page.evaluate("() => { document.getElementById('f-waist-cm').value = '3'; }")
    page.locator('#profile-form button[type=submit]').click(); page.wait_for_timeout(300)
    check(page.locator('#more-detail').evaluate('e => e.open') and 'waist' in page.inner_text('#validation-msg').lower(), 'refine: a bad waist opens the detail section and explains')
    page.evaluate("() => { document.getElementById('f-waist-cm').value = ''; }")
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_url(re.compile(r'diagnostics\.html'), timeout=5000)
    pr = (state_of(page) or {}).get('profile', {})
    check(abs(pr.get('bmi', 0) - 27.7) < 0.2 and pr.get('waistCm') is None and pr.get('whtr') is None, 'refine: BMI saved, blank waist stays empty', pr.get('bmi'))

    # quick mode never wipes details entered earlier
    inject(page, base, {'profile': {'sex': 'Male', 'age': 45, 'dietType': 'Vegan', 'symptoms': ['Fatigue'], 'medicalStatus': 'stable'}, 'vitals': {}, 'diagnostics': {}}, 'profile.html')
    page.select_option('#f-sex', 'Male'); page.fill('#f-age', '46')
    page.locator('#profile-form button[type=submit]').click()
    page.wait_for_url(re.compile(r'diagnostics\.html'), timeout=5000)
    pr = (state_of(page) or {}).get('profile', {})
    check(pr.get('age') == 46 and pr.get('dietType') == 'Vegan' and pr.get('symptoms') == ['Fatigue'], 'profile: changing age keeps diet and symptoms already saved', pr)

    # a refine started from Routine returns to Routine
    inject(page, base, {'profile': {'sex': 'Male', 'age': 45, 'symptoms': [], 'medicalStatus': 'stable'}, 'vitals': {}, 'diagnostics': {}}, 'routine.html')
    page.wait_for_selector('#continue-btn')
    check('typical body size' in page.inner_text('main').lower(), 'routine: says a typical body size is used when height and weight are missing')
    page.locator('main a:has-text("Add them")').first.click()
    page.wait_for_url(re.compile(r'profile\.html#refine'))
    page.fill('#f-height-cm', '172'); page.fill('#f-weight-kg', '82')
    page.locator('#profile-form button[type=submit]').click()
    try:
        page.wait_for_url(re.compile(r'routine\.html'), timeout=5000); ok = True
    except Exception:
        ok = False
    check(ok, 'refine from Routine: returns to Routine afterwards')
    page.wait_for_selector('#continue-btn')
    check('typical body size' not in page.inner_text('main').lower(), 'routine: the notice is gone once height and weight are added')

    # the diet page and its targets are honest about it too
    inject(page, base, {'profile': {'sex': 'Male', 'age': 45, 'dietType': 'Vegetarian', 'symptoms': [], 'medicalStatus': 'stable'}, 'vitals': {}, 'diagnostics': {}}, 'diet.html')
    page.wait_for_selector('#continue-btn')
    check('typical body size' in page.inner_text('main').lower(), 'diet: says a typical body size is used when height and weight are missing')
    page.locator('#continue-btn').click()
    page.wait_for_selector('#diet-targets .stat-card')
    check('typical body size' in page.inner_text('#diet-targets').lower(), 'diet targets: explain that a typical body size was used')

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


def merged_steps(browser, base):
    print('\nMerged steps and skipping')
    page = browser.new_page(viewport={'width': 1000, 'height': 900})
    prof = {'age': 45, 'sex': 'Male', 'heightCm': 172, 'weightKg': 80, 'bmi': 27, 'whtr': None, 'waistCm': None, 'symptoms': []}
    # skip routine and exercises -> diet
    inject(page, base, {'profile': prof, 'vitals': {}, 'diagnostics': {}}, 'routine.html')
    page.wait_for_selector('#skip-btn')
    page.locator('#skip-btn').click()
    page.wait_for_url(re.compile(r'diet\.html'))
    check(True, 'routine: the whole section can be skipped')
    # diet without a dietary preference: asked in place, not sent back
    page.wait_for_selector('#d-type')
    page.locator('#continue-btn').click()
    check('dietary preference' in page.inner_text('#answer-counter').lower() and not page.locator('#diet-targets').is_visible(), 'diet: targets wait for a dietary preference')
    page.select_option('#d-type', 'Non-Vegetarian')
    page.locator('#continue-btn').click()
    page.wait_for_selector('#diet-targets .test-card')
    check(page.locator('#diet-targets .test-card').count() > 3, 'diet: targets work with no routine and no answers (assumed burn)')
    # skip diet -> findings, with nothing from routine or diet
    inject(page, base, {'profile': dict(prof, dietType='Vegetarian'), 'vitals': {}, 'diagnostics': {}}, 'diet.html')
    page.wait_for_selector('#skip-btn')
    page.locator('#skip-btn').click()
    page.wait_for_url(re.compile(r'summary\.html'))
    page.wait_for_timeout(900)
    body = page.inner_text('body')
    check(len(body) > 400 and 'undefined' not in body and 'NaN' not in body, 'summary: opens cleanly with routine, exercises and diet all skipped')
    # old diet address forwards
    inject(page, base, {'profile': dict(prof, dietType='Vegetarian'), 'vitals': {}, 'diagnostics': {}}, 'diet-synthesis.html')
    page.wait_for_selector('#d-type')
    check('diet.html' in page.url, 'old Diet synthesis address forwards to the Diet page')
    page.close()


def status_bar(browser, base):
    print('\nFixed bottom bar: version, Refresh, Feedback')
    prof = {'age': 45, 'sex': 'Male', 'heightCm': 172, 'weightKg': 80, 'bmi': 27, 'whtr': None, 'waistCm': None,
            'symptoms': ['Back Pain'], 'dietType': 'Vegetarian', 'cuisine': 'Indian', 'medicalStatus': 'stable'}
    ctx = browser.new_context(viewport={'width': 390, 'height': 800})      # a phone is the tightest case
    page = ctx.new_page()
    page.goto(base + 'about.html')
    page.evaluate("([k, s]) => sessionStorage.setItem(k, JSON.stringify(s))", [STATE_KEY, {'profile': prof, 'vitals': {}, 'diagnostics': {}, 'routine': {}}])
    bad = []
    for pg in ('index', 'about', 'profile', 'symptoms', 'diagnostics', 'routine', 'diet', 'summary', 'nextsteps', 'not-ready'):
        page.goto(base + pg + '.html'); page.wait_for_timeout(500)
        info = page.evaluate("""() => { const b = document.getElementById('kyh-statusbar'); if (!b) return null;
            const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
            return { pos: cs.position, h: Math.round(r.height), bottom: Math.round(innerHeight - r.bottom), wrap: b.scrollWidth <= b.clientWidth + 1,
                     txt: b.innerText.replace(/\\s+/g, ' '), n: document.querySelectorAll('#kyh-statusbar').length,
                     src: (document.querySelector('script[src*="statusbar.js"]') || {}).getAttribute && document.querySelector('script[src*="statusbar.js"]').getAttribute('src') }; }""")
        ver = open('VERSION').read().strip()
        if not info or info['pos'] != 'fixed' or info['h'] > 36 or info['bottom'] != 0 or not info['wrap'] or info['n'] != 1 or ('v' + ver) not in info['txt'] \
           or 'refresh' not in info['txt'].lower() or 'feedback' not in info['txt'].lower():
            bad.append((pg, info))
    check(not bad, 'bar on all 10 pages: fixed, one line, at the bottom, shows the release number (VERSION file), Refresh and Feedback', bad[:2])

    # Feedback: opens an email to info@vividnova.com carrying only version and page, never answers
    page.goto(base + 'profile.html'); page.wait_for_timeout(400)
    href = page.get_attribute('#kyh-sb-feedback', 'href')
    from urllib.parse import urlparse, parse_qs, unquote
    u = urlparse(href); q = parse_qs(u.query)
    check(u.scheme == 'mailto' and unquote(u.path) == 'info@vividnova.com', 'feedback: goes to info@vividnova.com', href[:60])
    msg = (q.get('subject', [''])[0] + ' ' + q.get('body', [''])[0])
    check('Version: ' + open('VERSION').read().strip() in msg and 'build ' in msg and 'Page: profile' in msg, 'feedback: email carries the version and page', msg[-80:])
    check(not any(w in msg for w in ('Back Pain', '172', 'Vegetarian', 'Male')), 'feedback: no health answers are put in the email')

    # Refresh reloads and keeps the answers
    page.evaluate("() => { window.__marker = 1; }")
    page.locator('#kyh-sb-refresh').click()
    page.wait_for_load_state('load'); page.wait_for_timeout(500)
    check(page.evaluate("() => window.__marker") is None, 'refresh: the page reloads')
    check((state_of(page) or {}).get('profile', {}).get('age') == 45, 'refresh: answers are still there afterwards')

    # the bar never hides the Continue button, and does not print
    page.goto(base + 'profile.html'); page.wait_for_timeout(400)
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)"); page.wait_for_timeout(200)
    gap = page.evaluate("() => { const c = document.querySelector('#profile-form button[type=submit]').getBoundingClientRect(), b = document.getElementById('kyh-statusbar').getBoundingClientRect(); return b.top - c.bottom; }")
    check(gap >= 0, 'bar does not cover the Continue button at the end of the page', gap)
    page.emulate_media(media='print')
    check(page.evaluate("() => getComputedStyle(document.getElementById('kyh-statusbar')).display") == 'none', 'bar is hidden when printing')
    ctx.close()


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
            status_bar(browser, base)
        except Exception as e:
            check(False, 'status bar checks stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        try:
            merged_steps(browser, base)
        except Exception as e:
            check(False, 'merged steps checks stopped', f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
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
