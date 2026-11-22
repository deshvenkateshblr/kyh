/* Draft pilot facts and myth-busters for sharing. NOT loaded by any page yet.
   Rules (see the sharing model): one claim, one source; the quote must appear on the source page;
   wording never goes beyond the quote; every share carries a hook back to the app.
   status: 'draft' = quote checked against the page on `checked`, waiting for clinician sign-off
           'verify' = something about the page needs a human look before it can be approved
   Source list agreed with the owner: ACS, AHA, ADA, NIH (ODS, NCCIH), Arthritis Foundation, ICMR-NIN. */
window.FACTS_SHARE_BASE = 'https://vividnova.com/3DHealth/';   // TODO owner: confirm the public address (vividnova.com/kyh?)

window.FACTS = [
  {
    id: 'acs-crc-45', kind: 'fact',
    headline: 'Bowel cancer screening starts at 45',
    claim: 'The American Cancer Society says people at average risk should start regular colorectal cancer screening at age 45 and continue through age 75.',
    quote: 'start regular screening at age 45',
    source: { org: 'American Cancer Society', title: 'Colorectal Cancer Guideline', url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html', pageDate: 'Last revised May 27, 2026' },
    caveat: 'For people at average risk. Family history or symptoms change the advice.',
    hook: { where: 'Tests step', text: 'See which screening tests fit your age and sex.', cta: 'Get my starter list', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'aha-added-sugar', kind: 'fact',
    headline: 'How much added sugar is too much?',
    claim: 'The American Heart Association says most American women should have no more than about 6 teaspoons of added sugar a day, and men about 9.',
    quote: 'For most American women, that’s no more than 100 calories per day, or about 6 teaspoons of sugar.',
    source: { org: 'American Heart Association', title: 'Added Sugars', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sugar/added-sugars', pageDate: 'Last reviewed Aug 2, 2024' },
    caveat: 'Stated for American adults. The page does not say sugary drinks are the largest source; it lists regular soft drinks first among common sources.',
    hook: { where: 'Diet step', text: 'Check your own food pattern in two taps.', cta: 'Start my check', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'ada-sugary-drinks', kind: 'myth',
    headline: 'Myth check: do sugary drinks cause diabetes?',
    claim: 'The American Diabetes Association says research has shown that drinking sugary drinks is linked to type 2 diabetes. It says linked, not that sugar alone causes it.',
    quote: 'Research has also shown that drinking sugary drinks is linked to type 2 diabetes.',
    source: { org: 'American Diabetes Association', title: 'Know Your Facts About Diabetes', url: 'https://diabetes.org/about-diabetes/diabetes-myths', pageDate: 'No review date on the page (copyright 1995-2026)' },
    caveat: 'The page addresses sugary drinks specifically, not sugar in general. Record our own review date.',
    hook: { where: 'Tests step (HbA1c)', text: 'See whether a blood sugar check is on your list.', cta: 'Get my starter list', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'ods-b12-plant-based', kind: 'fact',
    headline: 'Plant-based eaters: check your B12',
    claim: 'NIH says vegans, and vegetarians who eat no meat, have a higher risk of vitamin B12 deficiency because natural sources are limited to animal foods. Fortified foods and supplements can substantially reduce the risk.',
    quote: 'natural food sources of vitamin B12 are limited to animal foods',
    source: { org: 'NIH Office of Dietary Supplements', title: 'Vitamin B12: Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/', pageDate: 'Updated March 26, 2024' },
    caveat: 'Adult RDA on the page: 2.4 mcg a day. Not advice to start a supplement without a doctor.',
    hook: { where: 'Tests step (Vitamin B12)', text: 'Tell us how you eat and we add the right checks to your list.', cta: 'Get my starter list', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'ods-iron-vegetarian', kind: 'fact',
    headline: 'Vegetarians need more iron',
    claim: 'NIH says the recommended iron intake for vegetarians is 1.8 times higher than for people who eat meat, because iron from plants is absorbed less well.',
    quote: 'The RDAs for vegetarians are 1.8 times higher than for people who eat meat.',
    source: { org: 'NIH Office of Dietary Supplements', title: 'Iron: Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/', pageDate: 'Fetched copy showed "Reviewed: April 08, 2014"' },
    caveat: 'Quote matched. The date on the fetched copy looks old: confirm the current version before approving.',
    hook: { where: 'Tests step (Iron Studies)', text: 'See whether an iron check belongs on your list.', cta: 'Get my starter list', target: 'profile.html' },
    status: 'verify', checked: '2026-11-22'
  },
  {
    id: 'nccih-yoga-back', kind: 'myth',
    headline: 'Does yoga fix back pain? What the evidence says',
    claim: 'NIH’s NCCIH says yoga is generally considered safe for healthy people and serious injuries are rare. For chronic low-back pain, a 2022 Cochrane review found small, clinically unimportant improvements.',
    quote: 'small and clinically unimportant improvements in back-related function and pain',
    source: { org: 'NIH NCCIH', title: 'Yoga for Pain: What the Science Says', url: 'https://www.nccih.nih.gov/health/providers/digest/yoga-for-pain-science', pageDate: 'September 2024' },
    caveat: 'The page also reports a 2022 meta-analysis with short-term improvements in pain, and that yoga did not differ from physical therapy at 6 weeks. Quote both sides if shown in full.',
    hook: { where: 'Exercise step', text: 'Get movements matched to your age, profile and symptoms.', cta: 'Get my plan', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'af-knee-weight', kind: 'fact',
    headline: 'Every pound counts for arthritic knees',
    claim: 'The Arthritis Foundation says every pound of extra weight puts four times the pressure on arthritic knees, so losing 5 pounds takes about 20 pounds of stress off the joints.',
    quote: 'every pound puts four times the pressure on your arthritic knees',
    source: { org: 'Arthritis Foundation', title: 'Why Weight Loss Matters for Arthritis', url: 'https://www.arthritis.org/health-wellness/healthy-living/nutrition/weight-loss/oa-diagnosis-why-weight-loss-matters', pageDate: 'Published 2025-02-04 (page metadata)' },
    caveat: 'Page gives pounds only. About arthritic knees, not every knee.',
    hook: { where: 'Body size (BMI) step', text: 'Add height and weight to see your BMI and which checks it adds.', cta: 'Find my BMI', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'icmr-protein-powder', kind: 'myth',
    headline: 'Myth check: do you need protein powder to build muscle?',
    claim: 'ICMR-NIN’s 2024 Dietary Guidelines for Indians advise avoiding protein supplements to build muscle mass, and getting good-quality protein from a sensible mix of foods.',
    quote: 'avoid protein supplements to build muscle mass',
    source: { org: 'ICMR-NIN', title: 'Dietary Guidelines for Indians (2024), Guideline 8', url: 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf', pageDate: 'June 2024 edition' },
    caveat: 'Only the guideline heading was confirmed; the body of Guideline 8 was cut off in the copy read. Read the full text before approving.',
    hook: { where: 'Diet step', text: 'See your daily protein in food portions for your diet.', cta: 'See my targets', target: 'profile.html' },
    status: 'verify', checked: '2026-11-22'
  },
  {
    id: 'icmr-sugar-5pct', kind: 'fact',
    headline: 'Sugar: the Indian guideline',
    claim: 'ICMR-NIN’s 2024 guidelines say sugar should be less than 5% of an adult’s daily energy, which they put at about 20 to 25 g a day.',
    quote: 'Sugar should be less than 5% of the total energy per day for adults.',
    source: { org: 'ICMR-NIN', title: 'Dietary Guidelines for Indians (2024), Guideline 1 and Table 1.6', url: 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf', pageDate: 'June 2024 edition' },
    caveat: 'Confirm the 20-25 g wording against the printed Guideline 1 before approving.',
    hook: { where: 'Diet step', text: 'Check your own food pattern in two taps.', cta: 'Start my check', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  },
  {
    id: 'acs-activity-150', kind: 'fact',
    headline: 'How much activity is enough?',
    claim: 'The American Cancer Society says adults should get 150 to 300 minutes of moderate-intensity or 75 to 150 minutes of vigorous activity each week.',
    quote: 'Adults should get 150-300 minutes of moderate intensity or 75-150 minutes of vigorous intensity activity each week',
    source: { org: 'American Cancer Society', title: 'ACS Guideline for Diet and Physical Activity for Cancer Prevention', url: 'https://www.cancer.org/cancer/risk-prevention/diet-physical-activity/acs-guidelines-nutrition-physical-activity-cancer-prevention.html', pageDate: 'No date visible in the part read' },
    caveat: 'Record our own review date. The page says getting to or above 300 minutes is ideal.',
    hook: { where: 'Routine step', text: 'Find your daily energy use in two taps.', cta: 'Start my routine', target: 'profile.html' },
    status: 'draft', checked: '2026-11-22'
  }
];
