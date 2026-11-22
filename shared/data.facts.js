/* Shareable facts and myth-busters. NOT loaded by any page yet.
   Rules: one claim per fact, one source; `quote` is verbatim from the source page and is what the weekly checker looks for;
   the card wording never goes beyond the quote. The source organisation is the authority; we only quote faithfully.
   status 'ready' = quote checked against the live page on `checked`; 'verify' = needs a look before use.
   `area`: tests | routine | diet | avoid.  `when`: optional audience filter (sex, minAge, smoker).
   Approved sources: ACS, AHA, ADA, NIH ODS, NIH NCCIH, Arthritis Foundation, ICMR-NIN. */
window.FACTS_SHARE_BASE = 'https://vividnova.com/kyh/';

(function () {
  var ACS_SCREEN = { org: 'American Cancer Society', title: 'Screening Guidelines by Age', url: 'https://www.cancer.org/cancer/screening/screening-recommendations-by-age.html', pageDate: 'Last revised Nov 12, 2026' };
  var AHA_SCREEN = { org: 'American Heart Association', title: 'Heart-Health Screenings', url: 'https://www.heart.org/en/health-topics/consumer-healthcare/what-is-cardiovascular-disease/heart-health-screenings', pageDate: 'Last reviewed Jan 16, 2024' };
  var AHA_YOGA = { org: 'American Heart Association', title: 'Exercise Mind and Body with Yoga and Mindful Movement', url: 'https://www.heart.org/en/healthy-living/healthy-lifestyle/mental-health-and-wellbeing/exercise-mind-and-body-with-yoga-and-mindful-movement', pageDate: 'Last reviewed Nov 8, 2023' };
  var ACS_DIET = { org: 'American Cancer Society', title: 'Guideline for Diet and Physical Activity for Cancer Prevention', url: 'https://www.cancer.org/cancer/risk-prevention/diet-physical-activity/acs-guidelines-nutrition-physical-activity-cancer-prevention.html', pageDate: 'No date on the page; record our own review date' };
  var ICMR = 'https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf';
  function hook(text, cta) { return { text: text, cta: cta, target: 'profile.html' }; }
  var T = '2026-11-22';

  window.FACTS = [
    /* ---- tests ---- */
    { id: 'acs-crc-45', area: 'tests', kind: 'fact', headline: 'Bowel cancer screening starts at 45',
      claim: 'The American Cancer Society says people at average risk should start colorectal cancer testing at age 45.',
      quote: 'All people at average risk should start testing at age 45.', source: ACS_SCREEN,
      caveat: 'Average risk only. Family history or symptoms change the advice.', when: { minAge: 40 },
      hook: hook('See which screening tests fit your age and sex.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'acs-breast-45', area: 'tests', kind: 'fact', headline: 'Mammograms: yearly from 45',
      claim: 'The American Cancer Society says women should get a mammogram every year starting at 45, and may choose to start at 40.',
      quote: 'Starting at age 45, women should get mammograms every year.', source: ACS_SCREEN,
      caveat: 'Average risk. The page also says women 40 to 44 should have the choice to start yearly screening.', when: { sex: 'F', minAge: 40 },
      hook: hook('See which screening tests fit your age and sex.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'acs-cervical-25', area: 'tests', kind: 'fact', headline: 'Cervical screening starts at 25',
      claim: 'The American Cancer Society says people at average risk for cervical cancer should be screened regularly starting at age 25, with an HPV test every 5 years.',
      quote: 'should be screened regularly starting at age 25.', source: ACS_SCREEN,
      caveat: 'Average risk. The 5-year HPV test is the primary test the page lists.', when: { sex: 'F', minAge: 21 },
      hook: hook('See which screening tests fit your age and sex.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'acs-lung-50', area: 'tests', kind: 'fact', headline: 'Lung screening for current and former smokers',
      claim: 'The American Cancer Society says people aged 50 to 80 who smoke or used to smoke, with at least a 20 pack-year history, should get yearly lung cancer screening.',
      quote: 'People ages 50 to 80 should get yearly lung cancer screening', source: ACS_SCREEN,
      caveat: 'Applies to people with a 20 pack-year or more smoking history.', when: { smoker: true, minAge: 50 },
      hook: hook('Tell us if you smoke and we add the right checks.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'aha-cholesterol-20', area: 'tests', kind: 'fact', headline: 'Cholesterol: first check at 20',
      claim: 'The American Heart Association says cholesterol screening begins at age 20 and is repeated every 4 to 6 years for normal-risk adults.',
      quote: 'cholesterol screening begins at age 20', source: AHA_SCREEN,
      caveat: 'Normal-risk adults. More often if risk for heart disease and stroke is higher.',
      hook: hook('See whether a lipid profile is on your list.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'aha-bp-yearly', area: 'tests', kind: 'fact', headline: 'Blood pressure: at least once a year',
      claim: 'The American Heart Association says to check blood pressure at each regular healthcare visit, or at least once a year if it is below 120/80 mm Hg.',
      quote: 'Each regular healthcare visit or at least once per year if blood pressure is less than 120/80 mm Hg', source: AHA_SCREEN,
      caveat: 'The page does not give a starting age for blood pressure checks.',
      hook: hook('See which checks fit your age and sex.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'aha-glucose-45', area: 'tests', kind: 'fact', headline: 'Blood sugar check from 45',
      claim: 'The AHA page, citing the American Diabetes Association, says blood glucose testing is recommended for all people beginning at age 45, at least every 3 years.',
      quote: 'for all people beginning at age 45 years', source: AHA_SCREEN,
      caveat: 'The page also mentions earlier testing for overweight adults with another cardiovascular risk factor.', when: { minAge: 40 },
      hook: hook('See whether a blood sugar check (HbA1c) is on your list.', 'Get my starter list'), status: 'ready', checked: T },

    /* ---- routine ---- */
    { id: 'aha-yoga-heart', area: 'routine', kind: 'fact', headline: 'Yoga may help your heart',
      claim: 'The American Heart Association says research suggests yoga may help blood pressure, cholesterol, heart rate and BMI, help manage stress, depression and insomnia, improve balance and stability, and motivate you to exercise more and eat healthier.',
      quote: 'improve heart health including body mass index (BMI), blood pressure, cholesterol and heart rate', source: AHA_YOGA,
      caveat: 'Research suggests, more research is needed. Not all yoga is gentle; people with high blood pressure should modify some poses and check with a provider.',
      hook: hook('Get movements matched to your age and profile.', 'Get my plan'), status: 'ready', checked: T },
    { id: 'acs-activity-150', area: 'routine', kind: 'fact', headline: 'How much activity is enough?',
      claim: 'The American Cancer Society says adults should get 150 to 300 minutes of moderate-intensity or 75 to 150 minutes of vigorous activity each week.',
      quote: 'Adults should get 150-300 minutes of moderate intensity or 75-150 minutes of vigorous intensity activity each week', source: ACS_DIET,
      caveat: 'The page says getting to or above 300 minutes is ideal.',
      hook: hook('Find your daily energy use in two taps.', 'Start my routine'), status: 'ready', checked: T },
    { id: 'af-knee-weight', area: 'routine', kind: 'fact', headline: 'Every pound counts for arthritic knees',
      claim: 'The Arthritis Foundation says every pound of extra weight puts four times the pressure on arthritic knees.',
      quote: 'every pound puts four times the pressure on your arthritic knees',
      source: { org: 'Arthritis Foundation', title: 'Why Weight Loss Matters for Arthritis', url: 'https://www.arthritis.org/health-wellness/healthy-living/nutrition/weight-loss/oa-diagnosis-why-weight-loss-matters', pageDate: 'Published 2025-02-04' },
      caveat: 'Pounds only. About arthritic knees, not every knee.',
      hook: hook('Add height and weight to see your BMI and which checks it adds.', 'Find my BMI'), status: 'ready', checked: T },

    /* ---- diet ---- */
    { id: 'aha-added-sugar', area: 'diet', kind: 'fact', headline: 'How much added sugar is too much?',
      claim: 'The American Heart Association says most American women should have no more than about 6 teaspoons of added sugar a day, and men about 9.',
      quote: 'For most American women, that’s no more than 100 calories per day, or about 6 teaspoons of sugar.',
      source: { org: 'American Heart Association', title: 'Added Sugars', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sugar/added-sugars', pageDate: 'Last reviewed Aug 2, 2024' },
      caveat: 'Stated for American adults.',
      hook: hook('Check your own food pattern in two taps.', 'Start my check'), status: 'ready', checked: T },
    { id: 'acs-plate', area: 'diet', kind: 'fact', headline: 'What a cancer-smart plate looks like',
      claim: 'The American Cancer Society says a healthy eating pattern includes a variety of vegetables, whole fruits in a variety of colors and whole grains, and limits red and processed meats and sugar-sweetened beverages.',
      quote: 'Fruits, especially whole fruits in a variety of colors', source: ACS_DIET,
      caveat: 'Dietary pattern for cancer prevention. The page lists red and processed meats together.',
      hook: hook('Check your own food pattern in two taps.', 'Start my check'), status: 'ready', checked: T },
    { id: 'ods-b12-plant-based', area: 'diet', kind: 'fact', headline: 'Plant-based eaters: check your B12',
      claim: 'NIH says natural food sources of vitamin B12 are limited to animal foods, so vegans and some vegetarians are at higher risk of deficiency.',
      quote: 'natural food sources of vitamin B12 are limited to animal foods',
      source: { org: 'NIH Office of Dietary Supplements', title: 'Vitamin B12: Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/', pageDate: 'Updated March 26, 2024' },
      caveat: 'Not advice to start a supplement without a doctor.', when: { diet: 'veg' },
      hook: hook('Tell us how you eat and we add the right checks.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'ada-sugary-drinks', area: 'diet', kind: 'myth', headline: 'Sugary drinks and diabetes: what is the link?',
      claim: 'The American Diabetes Association says research has shown that drinking sugary drinks is linked to type 2 diabetes. Linked, not proven to cause.',
      quote: 'Research has also shown that drinking sugary drinks is linked to type 2 diabetes.',
      source: { org: 'American Diabetes Association', title: 'Know Your Facts About Diabetes', url: 'https://diabetes.org/about-diabetes/diabetes-myths', pageDate: 'No review date on the page' },
      caveat: 'Sugary drinks specifically, not all sugar.',
      hook: hook('See whether a blood sugar check is on your list.', 'Get my starter list'), status: 'ready', checked: T },

    /* ---- avoid ---- */
    { id: 'acs-alcohol', area: 'avoid', kind: 'fact', headline: 'Alcohol and cancer',
      claim: 'The American Cancer Society says drinking even small amounts of alcohol increases the risk of some cancers, such as breast cancer, and that it is best not to drink alcohol. If you do, keep to no more than 1 drink a day for women or 2 for men.',
      quote: 'drinking even small amounts of alcohol increases your risk',
      quote2: 'it is best not to drink alcohol.',
      source: { org: 'American Cancer Society', title: 'Alcohol Use and Cancer', url: 'https://www.cancer.org/cancer/risk-prevention/diet-physical-activity/alcohol-use-and-cancer.html', pageDate: 'No revision date found in the part read' },
      caveat: 'The page links alcohol to mouth, throat, voice box, esophagus, liver, colon and rectum, breast and stomach cancers. It does not use the words "known carcinogen" or "no safe level", so the card must not either. WebMD is not an approved source; add one (e.g. the US Surgeon General advisory) if "no safe level" wording is wanted.',
      hook: hook('See how your habits shape your checks.', 'Get my starter list'), status: 'ready', checked: T },
    { id: 'acs-tobacco', area: 'avoid', kind: 'fact', headline: 'Smoking and cancer',
      claim: 'The American Cancer Society says smoking causes about 20% of all cancers and about 30% of all cancer deaths in the United States, and that quitting, especially at a younger age, can reduce tobacco-related disability.',
      quote: 'Smoking causes about 20% of all cancers and about 30% of all cancer deaths in the United States.',
      source: { org: 'American Cancer Society', title: 'Health Risks of Smoking Tobacco', url: 'https://www.cancer.org/cancer/risk-prevention/tobacco/health-risks-of-smoking-tobacco.html', pageDate: 'No revision date found in the part read' },
      caveat: 'United States figures. The page does not say "quitting helps at any age" in those words.',
      hook: hook('Tell us if you smoke and we add the right checks.', 'Get my starter list'), status: 'ready', checked: T },

    /* ---- held back until verified ---- */
    { id: 'ods-iron-vegetarian', area: 'diet', kind: 'fact', headline: 'Vegetarians need more iron',
      claim: 'NIH says the recommended iron intake for vegetarians is 1.8 times higher than for people who eat meat.',
      quote: 'The RDAs for vegetarians are 1.8 times higher than for people who eat meat.',
      source: { org: 'NIH Office of Dietary Supplements', title: 'Iron: Health Professional Fact Sheet', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/', pageDate: 'Fetched copy showed April 2014' },
      caveat: 'Confirm the current version of the page.', when: { diet: 'veg' },
      hook: hook('See whether an iron check belongs on your list.', 'Get my starter list'), status: 'verify', checked: T },
    { id: 'icmr-sugar-5pct', area: 'diet', kind: 'fact', headline: 'Sugar: the Indian guideline',
      claim: 'ICMR-NIN says sugar should be less than 5% of an adult’s daily energy.',
      quote: 'Sugar should be less than 5% of the total energy per day for adults.',
      source: { org: 'ICMR-NIN', title: 'Dietary Guidelines for Indians (2024)', url: ICMR, pageDate: 'June 2024' },
      caveat: 'Confirm the 20-25 g wording against the printed Guideline 1.',
      hook: hook('Check your own food pattern in two taps.', 'Start my check'), status: 'verify', checked: T }
  ];
})();
