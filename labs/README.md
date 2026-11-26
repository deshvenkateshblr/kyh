# Lab binder (stand-alone)

Keeps lab reports in one place, reads the values from the PDFs in the browser (nothing is uploaded), and lets the person check every value beside the page. Values and the original files stay in the browser (IndexedDB) and travel in a `.kylt` bundle (a zip: `labs.json`, `manifest.json`, `values.csv`, `reports/`).

This folder does not depend on the rest of the repository. To use it elsewhere, copy `labs/` and serve it as a static site.

```
labs/
  index.html          page shell
  labs.css            all styles
  js/data.labs.js     118 known tests (names as Indian labs print them, plain-language notes) and 30 page topics
  js/labs-parse.js    text rows, page classification, column guess, status from the printed range
  js/labs-binder.js   file + value storage, .kylt zip save/open
  js/labs.js          screens
  vendor/             pdf.js 3.11.174, fflate 0.8.2 (licenses included)
  tests/              fake sample reports, generator, browser test
```

Run the test: `python3 labs/tests/test_labs.py` (needs `playwright`; it serves `labs/` on its own).
Regenerate sample PDFs: `python3 labs/tests/make_sample_labs.py` (needs `reportlab`).

Limits: text PDFs only (no OCR); scans and photos show the page and the values are typed in. General information, not a diagnosis.
