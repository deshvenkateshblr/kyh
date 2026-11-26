# KYH — Site Map & Functionality

KYH is a browser-only, privacy-first self-assessment app. Users move through a guided path (**Fine → Diagnostics → Routine → Diet → Great**) and finish with a plan to take to their doctor. State lives in the browser (`loadState` / `persistState` / `goTo` in `shared/utils.js`); nothing is sent to a server. The page-to-page backup payload travels in the URL `#fragment` (`#d=…`, `#reason=…`), which browsers never send to servers or in Referer headers, and it is removed from the address bar once stored. Legacy `?d=` links still load.

## User flow

```
index → profile (sex + age) → diagnostics (starter list) → routine (+ exercise plan) → diet (+ diet targets) → summary → nextsteps
         └─ diagnostics offers "Refine my list" (profile.html#refine: height + weight for BMI, dietary preference, optional detail)
         └─ diagnostics also offers "add symptoms" (symptoms.html, which returns to diagnostics)
         └─ routine and diet can each be skipped as a whole
                   └──(pregnancy / special-care)──→ not-ready
```

## Pages

| # | Page | Step | What it does |
|---|------|------|--------------|
| 1 | `index.html` | Landing | Pitch, privacy badge, "Start Assessment" CTA, collapsible walkthrough video, three outcome cards (Decode / Optimize / Take Action). |
| 2 | `about.html` | Intro | Short optional read: what KYH is, what it is not, privacy and sources. No acknowledgement checkbox. The home page and profile page link past it. |
| 3 | `profile.html` | Fine | Two modes. **Quick** (first visit): sex and age only (plus menstrual / menopause status for women, the pregnancy check), then straight to the tests. **Refine** (`#refine`, optional `&next=<page>` to return to Routine or Diet): height and weight (BMI, entered as a pair), dietary preference, and under "Add more detail" waist, waist-to-height gauge, India cutoffs toggle, smoking, alcohol, PCOS, cuisine, family history. Blank optional fields are stored as null; quick mode never overwrites details saved earlier. |
| 4 | `not-ready.html` | Safety exit | Shown for pregnancy or other special-care status. Pauses the flow and points to a clinician. Link back to profile. |
| 5 | `symptoms.html` | Fine | Searchable, categorised symptom and known-condition picker, plus optional vitals (fasting glucose, resting heart rate). Shapes every later recommendation. |
| 6 | `diagnostics.html` | Diagnostics | Ranked **top 10 lab tests**. First shown from age and sex alone; BMI (via the Metabolic risk group) and dietary preference (B12 and iron checks) sharpen it through the "Refine this list" card; symptoms sharpen it further. Per-test last-done recency and optional self-reported result (within range / flagged / not sure). |
| 7 | `routine.html` | Routine | One-page guided questions about a typical day, in the app's own chips and cards: sleep, work and daytime (choose all that apply: desk, on feet, physical, looking after children or family), home and free time (cooking, chores, relaxing), getting around, walking, then mind-body, gym and sport as days a week × minutes. Activities are grouped by similar effort. Unasked time counts as light activity (1.5 METs). Also steps, daylight, dinner-to-sleep gap, post-meal walk. Estimates daily energy use (TDEE). Nothing is pre-filled. |
| – | `routine-config.html` | (redirect) | Old second step; forwards to `routine.html` so existing links still work. |
| – | `routine-plan.html` | (redirect) | Old exercises step; forwards to `routine.html#plan`. The ranked **top 10 exercises** (logic in `shared/movement-plan.js`) now open under the day builder on the Routine page. Answers are optional. |
| 10 | `diet.html` | Diet | Dietary and cuisine preference (asked here if skipped on the profile), food-quality frequency matrix and nutrient-by-nutrient questions, all optional. "Show my diet targets" opens the calorie, protein, fibre, water and nutrient-priority targets (logic in `shared/diet-targets.js`) under the questions; changing an answer clears them. The whole step can be skipped. |
| – | `diet-synthesis.html` | (redirect) | Old diet targets step; forwards to `diet.html`. |
| 12 | `summary.html` | Great | Insight cards grouped by About you / Diagnostics / Routine / Diet. Expandable details, **save findings (.txt)**, **print**. |
| 13 | `nextsteps.html` | Great | Tabbed hub: **Summary**, **Doctor Brief** (printable one-page A4 list of questions to ask), **AI Prompt** (four copy-ready prompts with the user's context), **Videos** (curated, symptom-matched expert videos). |
| 14 | `kyf_teaser.html` | Marketing | Standalone teaser ("Know Your Health — personalized path to your wellness"). Not linked from the main flow. |

## Shared modules (`shared/`)

| File | Purpose |
|------|---------|
| `styles.css` | Design system (paper/teal/amber palette, serif + mono type, masthead, cards, buttons). |
| `utils.js` | State, `goTo`, unit conversion, BMI/WHtR, risk categories, 5-step progress header, TDEE / water / protein / fibre estimators. |
| `insights.js` | Turns saved state into insight cards and the AI prompt context. |
| `doctorbrief.js` | Builds the printable Doctor Brief. |
| `summary-page.js` | Page logic for `summary.html`. |
| `statusbar.js` | One-line fixed bar on every flow page: release number from the `VERSION` file (1.0, 1.1, ...; edit that file to bump it, `tools/stamp.py` writes it in; the build id stays in the tooltip and the feedback email), Refresh (reloads; answers are kept), Feedback (mailto info@vividnova.com carrying only version and page). Hidden when printing. |
| `movement-plan.js` | `mountMovementPlan(root, state, onNext)`: the exercise shortlist, mounted inside `routine.html`. |
| `diet-targets.js` | `mountDietTargets(root, state, onFinish)`: calorie, macro, water and nutrient targets, mounted inside `diet.html`. |
| `icons.js` | Shared SVG icon set. |
| `data.symptoms.js`, `data.diagnostics.js`, `data.activities.js`, `data.exercises.js`, `data.diet.js`, `data.cuisine.js`, `data.routine.js` | Content databases. `data.routine.js` is currently empty. |
| `data.videos.sb.js`, `data.videos.nbs.js`, `drsk_video_data.js`, `ayushyp_video_data.js`, `curated_routine_video_data.js` | Curated video libraries. |
| `assets/` | Logos and hero image. |

## Observations

- `index.html` links to `profile.html`; there is no direct entry to later steps (by design). The footer disclaimer repeats only on results pages (`renderFooter({ disclaimer: true })`).
- `kyf_teaser.html` is an orphan page, and `data.routine.js` is empty.
- Every step page falls back to an "We need your profile first" state if the profile is missing.
- Height and weight are optional. When missing, energy, calorie and water figures use a typical body size (70 kg, 168 cm) and every place that shows such a figure says so (`bodySizeAssumed` / `bodySizeNoticeHtml` in `shared/utils.js`: Routine, Diet targets, insights, Doctor Brief).


**Diagnostics refine panel (v1.1):** the "Refine this list" card expands in place with three steps in order: 1 Body size (BMI, live badge), 2 Symptoms (search plus common chips), 3 Dietary preference. Every change saves, redraws the list below and says what was added or dropped; answers already given are kept. The full profile form (feet/pounds, waist, lifestyle) stays one link away.

**Tests page decisions (v1.6-1.7):** each test offers Keep it / Already done / Decide later / Not for me. Decide later means parked for another visit (kept in the saved file, one line of text on the last page, still counted as a test to ask about); Not for me sets it aside with an optional reason and keeps it out of the Doctor Brief's asks. The refine panel's body step also takes an optional waist, giving waist-to-height (0.5 or more, or waist over 90/94 cm men or 80 cm women, adds Metabolic and Cardiovascular tests). profile.html shows the detailed form only for an explicit `#refine`; its button wording follows `next=`.

**Routine quick view (v1.8):** the Routine page opens on two questions (usual day type, exercise on purpose) and shows one figure with a range: resting energy x an activity factor (`DAY_TYPES`, `EXERCISE_LEVELS`, `estimateTdeeFromDayType` in shared/utils.js; factors sit inside the FAO/WHO/UNU bands and need physician review). It saves `routine.mode='simple'`, `dayType`, `exerciseDays`, `estimatedCalories`, `estimatedRange` and an empty `activities` list (no invented hours). The old 24-hour builder is one link away (`mode='detailed'`) and reopens by itself for anyone who used it before. Steps, daylight and dinner gap sit in a collapsed Fine-tune section.

**Exercises and Diet decluttered (v2.0):** exercises show two at a time with the shared pager (pills, Next/Previous, skip link; CSS now in shared/styles.css), one tap for how often (a frequency means practising, `Not yet` means no; saved shape unchanged) and only intensity and equipment chips. Diet shows a known diet type as one line (Change reveals the dropdowns), the top 5 nutrients first (`Show the other 5`), no symptom lines on nutrient cards, and the targets page leads with calories, burn, protein and water with two folded sections (`How these were worked out`, `Portion guide and food ideas`).

**Food pattern (v2.1):** the six-food frequency matrix and per-food dropdowns are replaced by two tap questions ("Which of these do you have most days?" for Foods that help, and for Foods to go easy on), one tap per food that applies plus `None of these`. Stored values: `Most days` (ticked), `Sometimes` (not ticked once the group is touched), `Rarely` (None). Older values (Daily, 3-5x/Wk, 1-2x/Wk, Rarely) still score and display correctly in scoring, targets, insights and the Doctor Brief.

## v2.2 - Did you know cards
- shared/data.facts.js: 16 quote-checked facts (ACS, AHA, ADA, NIH ODS, Arthritis Foundation) plus 2 held back as verify.
- shared/facts.js: one card per page (tests, routine, diet, summary) with Share/Copy; share text = fact + source + link vividnova.com/kyh/?ref=fact-<id>; never personal answers.
- tools/check_facts.py + .github/workflows/check-facts.yml: weekly check that each quote is still on its source page (--fix demotes failures to verify).

## v2.3 - waist accepts inches
- Refine panel waist box takes "88", "88 cm", "34 in" (a bare number under 50 is read as inches) and shows the conversion; no trip to the full form.

## v2.4 - routine message clears
- The "please choose..." message on the Routine page clears as soon as the person answers.

## v2.5 - traditional exercise names
- The Sanskrit/Indian name (data aka) now shows under each exercise title instead of only inside the demo view.

## v2.6 - fact card restyle
- Did-you-know card now uses the test-card look (square panel, teal edge, mono labels) and the standard buttons, aligned to the page column.

## v2.7 - polish
- "Make this list better" prompt is compact; numbered circles replaced by a clickable progress bar (tests and exercises).
- Did-you-know card: no review date, no Copy; WhatsApp and X buttons on desktop, native Share on phones.

## v2.8 - body facts (verify)
- 8 more facts added as status verify (NIH kidney/heart/eye/bone/strength, ADA movement breaks, AHA walk after meals, ICMR tea gap). Approved source list is now data (FACT_APPROVED_SOURCES) and the checker enforces it.

## v2.9 - layout audit
- Tooltips fixed to the window on phones (they made the Tests page wider than the screen with large text); nextsteps sub-nav wraps; status bar and radio pairs shrink/wrap; unstyled Change button on Diet; summary grammar ("looks has").

## v3.0 - honest flow
- Home promises match the product (a minute for a starter list, about ten for the full picture; routine is a two-tap estimate with optional hour-by-hour). Steps named Profile / Tests / Routine / Diet / Summary.
- Tests: no "continue anyway" confirm step. Summary opens the Doctor Brief by default; finish = Save, Share KYH, Print doctor brief (no Done to home). Next steps ends at the Doctor Brief. AI prompt copy says three prompts plus all together.
- routine-plan, routine-config and diet-synthesis were already merged into routine.html and diet.html (redirect shells); each section already has a skip.

## v3.1 — My lab reports (labs.html)
Keep lab results in one place. Add a PDF (read in the browser with a vendored pdf.js, never uploaded), check each extracted value beside the page preview, and keep only confirmed values in the .kyh file. Status uses the range printed on the report; generic plain-language notes per test. Text PDFs only; scans and photos show the page for manual entry. Not a diagnosis.
v3.1 addition: lab binder. Original report files are kept in this browser (IndexedDB) only; filter reports by date range and test or lab name, then save the selection as a .kylt bundle (zip with labs.json, manifest.json, values.csv and the original files) or just the files as a .zip. Opening a .kylt merges its reports and files. The .kyh file still carries values only. Uses vendored fflate.
v3.1 addition: page chooser for lab reports. Pages are ticked by how many lines hold a number plus a unit or printed range (works on any layout; summary pages skip); tap a page number to include or skip; the preview fits the pane width; "Copy page layout" copies the page text with positions (name/ID lines removed) for troubleshooting.
v3.1 addition: "Is this what your report looks like?" step. Before reading values, the lab page guesses the lab, sample date, result pages and column layout (from headings, or from where numbers, units and ranges sit), draws the columns on the page, shows the first rows read that way, and lets the person tap a column on the page to correct it. Only then does the review screen open.
v3.1 addition: the lab page now works out what each page is. 118 known tests (loose name matching for Indian spellings, e.g. "SGPT (ALT)", "Cholesterol - Total", "Gamma GT") and 30 page topics in shared/data.labs.js (CBC, lipid, liver, kidney, thyroid, sugar, vitamins, urine, hormones, ... plus written reports: ECG, echo, X-ray, ultrasound, CT, MRI, mammography, DEXA, lung function, pap, biopsy, endoscopy). Pages are classified as a table of results, a written report or text only; written reports can be kept without values.
