#!/usr/bin/env python3
"""Check that every 'ready' fact's verbatim quote is still on its source page.
Usage: python3 tools/check_facts.py [--fix]
  --fix  rewrites status 'ready' -> 'verify' in shared/data.facts.js for facts that fail, so they lose the Share card.
Exit code 1 if any fact fails. PDFs are skipped (marked 'skip')."""
import json, re, subprocess, sys, urllib.request, html

SRC = 'shared/data.facts.js'
def load():
    js = "global.window=global;require('./%s');console.log(JSON.stringify(FACTS))" % SRC
    return json.loads(subprocess.check_output(['node', '-e', js]))
def norm(s):
    s = html.unescape(re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', s))
    s = re.sub(r'<[^>]+>', ' ', s)
    s = s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace(' ', ' ')
    return re.sub(r'\s+', ' ', s).lower()
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (KYH fact checker)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')
def main():
    fix = '--fix' in sys.argv
    bad = []; unreachable = []
    for f in load():
        if f['status'] != 'ready': continue
        url = f['source']['url']
        if url.lower().endswith('.pdf'): print('skip ', f['id'], '(pdf)'); continue
        quotes = [f['quote']] + ([f['quote2']] if f.get('quote2') else [])
        try:
            page = norm(fetch(url))
        except Exception as e:
            print('WARN ', f['id'], 'cannot fetch (not demoted)', url, str(e)[:60]); unreachable.append(f['id']); continue
        missing = [q for q in quotes if norm(q) not in page]
        if missing: print('FAIL ', f['id'], 'quote not found:', missing[0][:70]); bad.append(f['id'])
        else: print('ok   ', f['id'])
    if bad and fix:
        s = open(SRC).read()
        for i in bad:
            s = re.sub(r"(id: '%s'[\s\S]*?status: )'ready'" % re.escape(i), r"\1'verify'", s, count=1)
        open(SRC, 'w').write(s); print('demoted to verify:', ', '.join(bad))
    sys.exit(1 if (bad or unreachable) else 0)
main()
