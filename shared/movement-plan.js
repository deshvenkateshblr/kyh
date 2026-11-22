/* Movement plan: the ranked exercise shortlist, mounted inside the Routine page.
   mountMovementPlan(root, state, onNext) draws into `root`; onNext(exercises) is called with the
   answers when the person continues. Needs shared/data.exercises.js and shared/utils.js. */
(function () {
window.mountMovementPlan = function (root, state, onNext) {
const profile = state.profile;
const main = root;

const FREQ_OPTIONS = [
  'Daily',
  '3–5× / week',
  '1–2× / week',
  'Occasionally',
  'Not yet'
];

/* ---- symptom → exercises index (single source of truth) ---- */
const SYMPTOM_TO_EXERCISES = {};
(window.EXERCISES || []).forEach(ex => {
  (ex.symptoms || []).forEach(s => {
    (SYMPTOM_TO_EXERCISES[s] = SYMPTOM_TO_EXERCISES[s] || []).push(ex.exercise);
  });
});

function isContraindicated(ex, userSymptoms) {
  if (!ex.contraindications || !ex.contraindications.length) return false;
  const flags = userSymptoms.concat(window.derivedFlags(profile));   // derived flags such as Senior Citizen
  return ex.contraindications.some(c => flags.includes(c));
}

function assignGroup(ex) {
  const p = (ex.profile || '').trim();
  const order = profile.sex !== 'Female'
    ? GROUP_ORDER.filter(g => g !== 'Female Specific')
    : GROUP_ORDER;
  return order.find(g => p === g || p.includes(g.split(' ')[0])) || 'Low Risk';
}

/* ---- baseline (category-driven) selection ---- */
function selectBaseline(matches, limit, exclude) {
  const groups = {};
  matches.forEach(ex => {
    if (exclude.has(ex.exercise)) return;
    const g = assignGroup(ex);
    (groups[g] = groups[g] || []).push(ex);
  });
  Object.keys(groups).forEach(g =>
    groups[g].sort((a, b) => a.exercise.localeCompare(b.exercise))
  );

  const present = [
    ...GROUP_ORDER.filter(g => groups[g] && groups[g].length),
    ...Object.keys(groups).filter(g => !GROUP_ORDER.includes(g))
  ];

  const out = [];
  let idx = 0;
  while (out.length < limit && present.some(g => groups[g] && groups[g].length)) {
    const g = present[idx % present.length];
    if (groups[g] && groups[g].length) {
      const item = groups[g].shift();
      out.push(Object.assign({
        group: g,
        viaSymptoms: [],
        bySymptom: false
      }, item));
    }
    idx++;
  }
  return out;
}

/* ---- symptom-driven selection (highest priority) ---- */
function selectFromSymptoms(matches, selectedSymptomsArr) {
  const byName = {};
  matches.forEach(ex => { byName[ex.exercise] = ex; });

  const out = [];
  const seen = new Set();

  selectedSymptomsArr.forEach(sym => {
    (SYMPTOM_TO_EXERCISES[sym] || []).forEach(name => {
      const ex = byName[name];
      if (!ex) return;                       // filtered out already
      if (seen.has(name)) {
        const existing = out.find(t => t.exercise === name);
        if (existing && !existing.viaSymptoms.includes(sym)) {
          existing.viaSymptoms.push(sym);
        }
        return;
      }
      seen.add(name);
      out.push(Object.assign({
        group: assignGroup(ex),
        viaSymptoms: [sym],
        bySymptom: true
      }, ex));
    });
  });
  return out;
}

function buildRecommendations(matches, selectedSymptomsArr) {
  const symptomEx = selectFromSymptoms(matches, selectedSymptomsArr)
    .sort((a, b) =>
      b.viaSymptoms.length - a.viaSymptoms.length ||
      a.exercise.localeCompare(b.exercise)
    )
    .slice(0, 10);

  const excluded = new Set(symptomEx.map(e => e.exercise));
  const combined = symptomEx.slice();

  if (combined.length < 10) {
    selectBaseline(matches, 10 - combined.length, excluded)
      .forEach(e => combined.push(e));
  }
  return ensureBalance(combined, matches, selectedSymptomsArr);
}

/* Balance guard (NEEDS PHYSICIAN / TRAINER REVIEW): adults should see at least
   2 strength and 1 aerobic option when any are eligible (not contraindicated),
   so the list is not all breathwork and stretches. Swaps out the lowest-ranked
   items that are neither. */
const isStrengthEx = e => /strength|squat|bridge|plank|carry/i.test(e.movement_type || '') || /push-up|squat|row|step-up|lunge|calf raise/i.test(e.exercise);
const isAerobicEx  = e => /cardio/i.test(e.movement_type || '') || /walk|stroll|swimming|pedaling|marching/i.test(e.exercise);
function ensureBalance(list, matches, symptoms) {
  const out = list.slice();
  const have = new Set(out.map(e => e.exercise));
  const rank = (a, b) => (b.symptoms || []).filter(x => symptoms.includes(x)).length -
                         (a.symptoms || []).filter(x => symptoms.includes(x)).length ||
                         a.exercise.localeCompare(b.exercise);
  function top(pred, n) {
    const protectedNames = new Set(out.filter(e => isStrengthEx(e) || isAerobicEx(e)).map(e => e.exercise));
    const cands = matches.filter(e => pred(e) && !have.has(e.exercise)).sort(rank);
    let added = 0;
    for (const c of cands) {
      if (added >= n) break;
      const idx = out.map(e => e.exercise).reverse().findIndex(nm => !protectedNames.has(nm));
      if (idx < 0) break;
      const at = out.length - 1 - idx;
      have.delete(out[at].exercise);
      out.splice(at, 1);
      out.push(Object.assign({group: assignGroup(c), viaSymptoms: [], bySymptom: false}, c));
      have.add(c.exercise);
      added++;
    }
  }
  top(isStrengthEx, Math.max(0, 2 - out.filter(isStrengthEx).length));
  top(isAerobicEx,  Math.max(0, 1 - out.filter(isAerobicEx).length));
  return out;
}

function renderResultsStage() {
  const symptoms = profile.symptoms || [];
  const userSymptoms = symptoms;

  // 1. Gender + age filter
  // 2. Hard exclude any exercise whose contraindications intersect user symptoms
  const matches = (window.EXERCISES || []).filter(ex =>
    genderMatch(ex.gender, profile.sex) &&
    ageRelevancyMatch(ex.age, profile.age) &&
    !isContraindicated(ex, userSymptoms)
  );

  const top10 = buildRecommendations(matches, symptoms);
  const prevAnswers = (state.exercises && state.exercises.answers) || {};

  let cardsHtml = '';
  top10.forEach((ex, i) => {
    const watchFor = (ex.symptoms && ex.symptoms.length)
      ? ex.symptoms.slice(0, 4).join(', ')
      : (NO_SYMPTOM_FALLBACK[ex.group] || 'general movement baseline');

    const prev = prevAnswers[ex.exercise] || {};
    const doingYes = prev.practicing === true;
    const doingNo  = prev.practicing === false;

    // one tap: a frequency means "I already do it"; "Not yet" means "no"
    const picked = doingNo ? 'Not yet' : (doingYes ? (prev.frequency || '') : '');
    const freqRadios = FREQ_OPTIONS.map((f, k) => {
      const id = f === 'Not yet' ? `prac-${i}-no` : `prac-${i}-f${k}`;
      return `<input type="radio" name="prac-${i}" id="${id}" value="${esc(f)}" ${picked === f ? 'checked' : ''}><label for="${id}">${esc(f)}</label>`;
    }).join('');

    const originTag = ex.bySymptom
      ? `<span class="tag ok">For: ${esc(ex.viaSymptoms.join(', '))}</span>`
      : '';

    const shownContra = (ex.contraindications || []).filter(c => !window.DERIVED_FLAGS.has(c));   // derived flags are not conditions to print
    const contraNote = shownContra.length
      ? `<div class="contra">Avoid if you have: ${esc(shownContra.join(', '))}</div>`
      : '';

const intensityChip = `<span class="meta-chip">${esc(ex.intensity || '—')} intensity</span>`;
    const equip = (ex.equipment || '').trim();
    const equipmentChip = (equip && equip.toLowerCase() !== 'none')
      ? `<span class="meta-chip">${esc(equip)}</span>`
      : '';   // hide when None
    const profileLabel = profile.sex !== 'Female'
      ? (ex.profile || '').split(';').map(s => s.trim()).filter(s => s !== 'Female Specific').join('; ')
      : (ex.profile || '');
    const profileChip = profileLabel
      ? `<span class="meta-chip">${esc(profileLabel)}</span>`
      : '';
  const moveChip = ex.movement_type 
      ? `<span class="meta-chip" style="color: var(--teal); border-color: var(--teal); font-weight: 600;">${esc(ex.movement_type)}</span>` 
      : '';

    // Create the button only if a URL exists
    const videoBtn = ex.video_url 
      ? `<button class="demo-toggle-btn" data-index="${i}" data-url="${esc(ex.video_url)}" data-target="video-wrap-${i}" aria-expanded="false">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
           View Details
         </button>`
      : '';
      
    // Video container target
    const videoContainer = ex.video_url
      ? `<div id="video-wrap-${i}" class="demo-video-container" style="display: none;"></div>`
      : '';


    const extendedText = ex.extended_info || ex.note;
    
        // Build the 'Also known as' line if an alternate name exists
    const akaLine = (ex.aka && ex.aka.trim())
      ? `<div style="font-size: 12.5px; color: var(--muted); margin-bottom: 6px;">
           <span style="font-style: italic;">Also known as:</span> <strong style="color: var(--ink); font-weight: 600;">${esc(ex.aka)}</strong>
         </div>`
      : '';
    
    

    cardsHtml += `
    <div class="test-card" data-exercise="${esc(ex.exercise)}">
      <div class="head">
        <div style="flex:1; min-width:0;">
          <!-- Title Row -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div class="name">${i + 1}. ${esc(ex.exercise)}</div>
            ${videoBtn}
          </div>

          <!-- Standard Info Block (Hidden during Demo mode) -->
          <div id="standard-info-${i}">
            <div class="test-desc">${esc(ex.note)}</div>
            <div class="meta-row">
                ${originTag}
                ${intensityChip}
                ${equipmentChip}
            </div>
            ${contraNote}
          </div>

          <!-- Extended Info Block (Visible only during Demo mode) -->
          <div id="extended-info-${i}" style="display: none; margin-top: 10px; margin-bottom: 12px; font-size: 13.5px; line-height: 1.6; color: var(--ink-soft);">
            ${akaLine}
            <div>${esc(extendedText)}</div>
          </div>
          
          <!-- Lazy-Loaded Video Embed -->
          ${videoContainer}
        </div>
      </div>
      <div class="answers">
        <span class="intake-label" style="margin:0;">How often do you do this?</span>
        <div class="radio-pair decide-row">${freqRadios}</div>
      </div>
    </div>`;
   
    });

    main.innerHTML = `
  <div class="section-head">
    <h2>Your matched exercises</h2>
  </div>
  <p class="lede">Chosen for your age, sex and profile${symptoms.length ? ', and the symptoms you added' : ''}. Say how often you already do each one, or skip any you like.</p>
  <div class="tp-bar">
    <div id="mp-pills" class="tp-pills" aria-label="Jump to an exercise"></div>
    <div class="tp-meta"><span id="mp-range"></span><span id="mp-answer-counter"></span></div>
  </div>
  <div id="mp-cards">${cardsHtml}</div>
  <div class="page-footer-nav">
    <button type="button" class="btn secondary" id="mp-prev" style="display:none;">&larr; Previous 2</button>
    <button type="button" class="btn" id="mp-next">Next 2 &rarr;</button>
    <button class="btn" id="mp-continue-btn" style="display:none;">Continue to Diet &rarr;</button>
  </div>
  <p class="tp-skip"><a href="#" id="mp-skip">Skip the rest and go to Diet &rarr;</a></p>`;
      // Wire up Video Demo Accordions with Content Swap
      document.querySelectorAll('.demo-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function() {
      const idx = this.getAttribute('data-index');
      const targetId = this.getAttribute('data-target');
      const rawUrl = this.getAttribute('data-url');
      const container = document.getElementById(targetId);
      const standardBlock = document.getElementById('standard-info-' + idx);
      const extendedBlock = document.getElementById('extended-info-' + idx);
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
      // Return to standard view
      this.setAttribute('aria-expanded', 'false');
      this.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg> View Details`;

      container.style.display = 'none';
      container.innerHTML = '';

      extendedBlock.style.display = 'none';
      standardBlock.style.display = 'block';
      } else {
      // Switch to Demo view: swap content and inject player
      this.setAttribute('aria-expanded', 'true');
      this.innerHTML = `✕ Close Details`;

      standardBlock.style.display = 'none';
      extendedBlock.style.display = 'block';
      container.style.display = 'block';

      let embedUrl = rawUrl;
      if (rawUrl.includes('watch?v=')) {
      const videoId = rawUrl.split('watch?v=')[1].split('&')[0];
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      }

      container.innerHTML = `
      <div class="demo-video-wrapper">
        <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>
      </div>`;
      }
      });
      });

      // Answers are optional. Two exercises are shown at a time; every card stays in the page so counts and saving are unchanged.
      const cardEls = [...root.querySelectorAll('.test-card')];
      const PER = 2, pages = Math.max(1, Math.ceil(cardEls.length / PER));
      let page = 0;
      const picked = c => { const r = c.querySelector('input[type=radio]:checked'); return r ? r.value : ''; };
      function updateCounter() {
        const n = cardEls.filter(c => picked(c)).length;
        const el = document.getElementById('mp-answer-counter');
        if (el) el.textContent = n === cardEls.length ? '' : `${n} of ${cardEls.length} answered (optional)`;
      }
      function paintPills() {
        document.getElementById('mp-pills').innerHTML = cardEls.map((c, i) => {
          const v = picked(c);
          const cls = v ? (v === 'Not yet' ? ' skip' : ' done') : '';
          const cur = Math.floor(i / PER) === page;
          return `<button type="button" class="tp-pill${cls}${cur ? ' cur' : ''}" data-i="${i}" aria-label="Exercise ${i + 1}: ${esc(c.dataset.exercise)}">${i + 1}</button>`;
        }).join('');
      }
      function showPage(n, jump) {
        page = Math.max(0, Math.min(pages - 1, n));
        cardEls.forEach((c, i) => { c.style.display = Math.floor(i / PER) === page ? '' : 'none'; });
        const from = page * PER + 1, to = Math.min(cardEls.length, from + PER - 1);
        document.getElementById('mp-range').textContent = `Exercises ${from}${to > from ? '\u2013' + to : ''} of ${cardEls.length}`;
        const last = page === pages - 1;
        document.getElementById('mp-prev').style.display = page === 0 ? 'none' : '';
        document.getElementById('mp-next').style.display = last ? 'none' : '';
        document.getElementById('mp-continue-btn').style.display = last ? '' : 'none';
        document.getElementById('mp-skip').parentElement.style.display = last ? 'none' : '';
        paintPills();
        if (jump) document.getElementById('mp-range').scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      document.getElementById('mp-pills').addEventListener('click', e => { const b = e.target.closest('.tp-pill'); if (b) showPage(Math.floor(Number(b.dataset.i) / PER), true); });
      document.getElementById('mp-next').addEventListener('click', () => showPage(page + 1, true));
      document.getElementById('mp-prev').addEventListener('click', () => showPage(page - 1, true));
      document.getElementById('mp-skip').addEventListener('click', e => { e.preventDefault(); proceedToNext(); });
      root.querySelector('#mp-cards').addEventListener('change', e => { if (e.target.type === 'radio') { updateCounter(); paintPills(); } });
      updateCounter();
      showPage(0, false);

      function proceedToNext() {
      const answers = {};
      root.querySelectorAll('.test-card').forEach((card, i) => {
      const name = card.dataset.exercise;
      const v = picked(card);
      if (v) {
        const yes = v !== 'Not yet';
        answers[name] = { practicing: yes, frequency: yes ? v : null };
      }
      });
      const exercises = {
      topExercises: top10.map(e => ({
      exercise: e.exercise,
      group: e.group,
      bySymptom: e.bySymptom,
      viaSymptoms: e.viaSymptoms,
      intensity: e.intensity,
      equipment: e.equipment,
      videoTag: e.videoTag || null
      })),
      answers
      };
      onNext(exercises);
      }

      document.getElementById('mp-continue-btn').addEventListener('click', proceedToNext);
}


if (!profile) {
  main.innerHTML = `<div class="empty-state">We need your profile first. <a href="profile.html">Go back and fill it in &rarr;</a></div>`;
} else {
  renderResultsStage();
}
};
})();
