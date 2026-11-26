/* Lab analytes: how Indian reports usually name them, and a plain-language note for each.
   Matching is by normalised name (lower case, punctuation removed). `test` links to the test name used in data.diagnostics.js.
   The notes are general information, never a diagnosis: they say what a value is often linked with and always leave the cause to a doctor. */
window.LAB_ANALYTES = [
  /* ---- blood count ---- */
  { key: 'hb', name: 'Haemoglobin', group: 'Blood count', test: 'CBC', unit: 'g/dL', alias: ['haemoglobin', 'hemoglobin', 'hb', 'hgb', 'haemoglobin hb', 'hemoglobin hb'],
    what: 'The protein in red blood cells that carries oxygen.',
    low: 'Often linked with anaemia, commonly from low iron, B12 or folate, or blood loss. A doctor decides the cause.',
    high: 'Can be seen with dehydration, smoking, living at altitude or some blood conditions.' },
  { key: 'rbc', name: 'Red blood cell count', group: 'Blood count', test: 'CBC', unit: 'million/cumm', alias: ['rbc count', 'total rbc count', 'red blood cell count', 'rbc', 'erythrocyte count', 'red cell count'],
    what: 'How many red blood cells you have.', low: 'Seen with anaemia of several kinds.', high: 'Can go with dehydration, smoking or high-altitude living.' },
  { key: 'pcv', name: 'Haematocrit (PCV)', group: 'Blood count', test: 'CBC', unit: '%', alias: ['haematocrit', 'hematocrit', 'pcv', 'packed cell volume', 'hct', 'haematocrit pcv', 'hematocrit pcv'],
    what: 'The share of your blood made up of red cells.', low: 'Goes with anaemia.', high: 'Goes with dehydration or too many red cells.' },
  { key: 'mcv', name: 'MCV', group: 'Blood count', test: 'CBC', unit: 'fL', alias: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
    what: 'The average size of your red blood cells.', low: 'Small cells are often linked with low iron or thalassaemia trait.', high: 'Large cells are often linked with low B12 or folate, thyroid or liver issues.' },
  { key: 'mch', name: 'MCH', group: 'Blood count', test: 'CBC', unit: 'pg', alias: ['mch', 'mean corpuscular hemoglobin', 'mean corpuscular haemoglobin', 'mean cell haemoglobin'],
    what: 'The average haemoglobin in each red cell.', low: 'Usually moves with low iron.', high: 'Usually moves with large red cells.' },
  { key: 'mchc', name: 'MCHC', group: 'Blood count', test: 'CBC', unit: 'g/dL', alias: ['mchc', 'mean corpuscular hemoglobin concentration', 'mean corpuscular haemoglobin concentration'],
    what: 'How concentrated the haemoglobin is in your red cells.', low: 'Usually moves with low iron.', high: 'Uncommon; a doctor can say what it means in context.' },
  { key: 'rdw', name: 'RDW', group: 'Blood count', test: 'CBC', unit: '%', alias: ['rdw', 'rdw cv', 'rdw sd', 'red cell distribution width'],
    what: 'How much your red cells vary in size.', low: 'Rarely meaningful by itself.', high: 'A wide spread can accompany iron, B12 or folate shortage.' },
  { key: 'wbc', name: 'White blood cells (TLC)', group: 'Blood count', test: 'CBC', unit: 'thou/cumm', alias: ['total leucocyte count', 'total leukocyte count', 'tlc', 'wbc', 'wbc count', 'total wbc count', 'white blood cell count', 'leucocyte count', 'leukocyte count'],
    what: 'Your infection-fighting cells.', low: 'Can follow some infections, medicines or conditions of the bone marrow.', high: 'Often rises with infection or inflammation, and can with smoking or stress.' },
  { key: 'neut', name: 'Neutrophils', group: 'Blood count', test: 'CBC', unit: '%', alias: ['neutrophils', 'neutrophil', 'neutrophils percentage', 'polymorphs', 'segmented neutrophils', 'absolute neutrophil count', 'neutrophils absolute', 'anc'],
    what: 'The white cells that react first to bacterial infection.', low: 'Can follow viral infections or some medicines.', high: 'Often goes with bacterial infection or stress.' },
  { key: 'lymph', name: 'Lymphocytes', group: 'Blood count', test: 'CBC', unit: '%', alias: ['lymphocytes', 'lymphocyte', 'lymphocytes percentage'],
    what: 'White cells involved in fighting viruses.', low: 'Can follow stress or some illnesses.', high: 'Often seen after viral infections.' },
  { key: 'plt', name: 'Platelets', group: 'Blood count', test: 'CBC', unit: 'thou/cumm', alias: ['platelet count', 'platelets', 'plt', 'platelet'],
    what: 'The cells that help blood clot.', low: 'Can follow infections such as dengue, some medicines and other causes. A doctor decides the cause.', high: 'Can accompany iron deficiency, inflammation or infection.' },
  { key: 'esr', name: 'ESR', group: 'Inflammation', test: 'ESR', unit: 'mm/hr', alias: ['esr', 'erythrocyte sedimentation rate', 'esr westergren', 'erythrocyte sedimentation rate esr', 'esr erythrocyte sedimentation rate'],
    what: 'A general marker that rises with inflammation.', low: 'Usually not a concern.', high: 'Non-specific: it can rise with infection, inflammation, anaemia and more.' },
  { key: 'crp', name: 'C-reactive protein (CRP)', group: 'Inflammation', test: 'CRP', unit: 'mg/L', alias: ['crp', 'c reactive protein', 'c reactive protein crp', 'c reactive protein hs'],
    what: 'A marker that rises quickly with inflammation or infection.', low: 'Usually not a concern.', high: 'Non-specific: infection, injury and inflammation can all raise it.' },
  /* ---- sugar ---- */
  { key: 'fbs', name: 'Fasting glucose', group: 'Blood sugar', test: 'Fasting Glucose', unit: 'mg/dL', alias: ['glucose fasting', 'fasting glucose', 'fasting blood sugar', 'fbs', 'blood sugar fasting', 'glucose f', 'fasting plasma glucose', 'fbg'],
    what: 'Blood sugar after at least 8 hours without food.', low: 'Low sugar can cause shakiness or sweating; discuss with a doctor if it happens.', high: 'Above the normal range can mean pre-diabetes or diabetes; one value is not a diagnosis.' },
  { key: 'ppbs', name: 'Post-meal glucose', group: 'Blood sugar', test: 'Fasting Glucose', unit: 'mg/dL', alias: ['glucose pp', 'post prandial glucose', 'ppbs', 'postprandial blood sugar', 'glucose post prandial', 'blood sugar pp', 'glucose 2 hrs post meal'],
    what: 'Blood sugar a couple of hours after eating, or at a random time.', low: 'Less common; discuss with a doctor if you have symptoms.', high: 'Above range can point to poor sugar handling; a doctor will look at it with other results.' },
  { key: 'hba1c', name: 'HbA1c', group: 'Blood sugar', test: 'HbA1c', unit: '%', alias: ['hba1c', 'glycosylated hemoglobin', 'glycated haemoglobin', 'glycosylated haemoglobin', 'hemoglobin a1c', 'haemoglobin a1c', 'glycohemoglobin', 'hb a1c', 'a1c'],
    what: 'Your average blood sugar over about the last three months.', low: 'Rarely a concern on its own.', high: 'Above the normal band suggests higher average sugar; a doctor confirms what it means.' },
  { key: 'insulin', name: 'Insulin (fasting)', group: 'Blood sugar', test: 'Insulin', unit: 'uIU/mL', alias: ['insulin fasting', 'fasting insulin', 'insulin'],
    what: 'The hormone that moves sugar from blood into cells.', low: 'Can accompany low insulin production.', high: 'Can accompany insulin resistance; interpretation depends on glucose too.' },
  /* ---- lipids ---- */
  { key: 'tc', name: 'Total cholesterol', group: 'Lipids', test: 'Lipid Profile', unit: 'mg/dL', alias: ['total cholesterol', 'cholesterol total', 'cholesterol', 'serum cholesterol'],
    what: 'All the cholesterol carried in your blood.', low: 'Rarely a concern on its own.', high: 'Higher values raise heart-disease risk over time; the split between LDL and HDL matters.' },
  { key: 'ldl', name: 'LDL cholesterol', group: 'Lipids', test: 'Lipid Profile', unit: 'mg/dL', alias: ['ldl cholesterol', 'ldl', 'ldl cholesterol direct', 'ldl cholesterol calculated', 'low density lipoprotein', 'ldl c', 'cholesterol ldl'],
    what: 'The "bad" cholesterol that can build up in artery walls.', low: 'Low is generally fine.', high: 'Higher values raise heart-disease risk; a doctor sets your target from your overall risk.' },
  { key: 'hdl', name: 'HDL cholesterol', group: 'Lipids', test: 'Lipid Profile', unit: 'mg/dL', alias: ['hdl cholesterol', 'hdl', 'high density lipoprotein', 'hdl c', 'cholesterol hdl'],
    what: 'The "good" cholesterol that helps clear fat from blood.', low: 'Low HDL goes with a higher heart risk. Activity, not smoking and weight help.', high: 'Higher is generally favourable.' },
  { key: 'tg', name: 'Triglycerides', group: 'Lipids', test: 'Lipid Profile', unit: 'mg/dL', alias: ['triglycerides', 'triglyceride', 'tg', 'serum triglycerides'],
    what: 'A type of fat in your blood, strongly affected by recent food, sugar and alcohol.', low: 'Rarely a concern.', high: 'Often goes with sugar, refined carbohydrate and alcohol intake, and with weight; a doctor looks at it with other results.' },
  { key: 'vldl', name: 'VLDL cholesterol', group: 'Lipids', test: 'Lipid Profile', unit: 'mg/dL', alias: ['vldl cholesterol', 'vldl', 'very low density lipoprotein', 'vldl c'],
    what: 'Fat-carrying particles made by the liver; usually estimated from triglycerides.', low: 'Rarely a concern.', high: 'Usually moves with triglycerides.' },
  { key: 'nonhdl', name: 'Non-HDL cholesterol', group: 'Lipids', test: 'Lipid Profile', unit: 'mg/dL', alias: ['non hdl cholesterol', 'non hdl', 'non hdl c'],
    what: 'All the cholesterol except the good HDL.', low: 'Generally fine.', high: 'Higher values go with higher heart risk.' },
  { key: 'lpa', name: 'Lipoprotein(a)', group: 'Lipids', test: 'Lp(a)', unit: 'mg/dL', alias: ['lipoprotein a', 'lp a', 'lpa', 'lipoprotein a lp a'],
    what: 'A largely inherited cholesterol particle; usually measured once.', low: 'Generally fine.', high: 'A higher level raises heart-disease risk and does not respond much to lifestyle; discuss with a doctor.' },
  /* ---- liver ---- */
  { key: 'alt', name: 'ALT (SGPT)', group: 'Liver', test: 'Liver Function Tests', unit: 'U/L', alias: ['alt', 'sgpt', 'alt sgpt', 'sgpt alt', 'alanine aminotransferase', 'alanine transaminase', 'sgpt alanine aminotransferase'],
    what: 'An enzyme released when liver cells are irritated.', low: 'Not a concern.', high: 'Can accompany fatty liver, alcohol, some medicines and infections; a doctor decides the cause.' },
  { key: 'ast', name: 'AST (SGOT)', group: 'Liver', test: 'Liver Function Tests', unit: 'U/L', alias: ['ast', 'sgot', 'ast sgot', 'sgot ast', 'aspartate aminotransferase', 'aspartate transaminase', 'sgot aspartate aminotransferase'],
    what: 'An enzyme found in liver and muscle.', low: 'Not a concern.', high: 'Can rise with liver irritation and also after hard exercise or muscle injury.' },
  { key: 'alp', name: 'Alkaline phosphatase', group: 'Liver', test: 'Liver Function Tests', unit: 'U/L', alias: ['alkaline phosphatase', 'alp', 'alk phos', 'alkaline phosphatase alp'],
    what: 'An enzyme from liver and bone.', low: 'Uncommon.', high: 'Can go with liver or bile-duct issues, or bone conditions.' },
  { key: 'ggt', name: 'GGT', group: 'Liver', test: 'Liver Function Tests', unit: 'U/L', alias: ['ggt', 'gamma gt', 'gamma glutamyl transferase', 'gamma glutamyl transpeptidase', 'ggtp'],
    what: 'A liver enzyme sensitive to alcohol and bile flow.', low: 'Not a concern.', high: 'Can go with alcohol, fatty liver or some medicines.' },
  { key: 'bili', name: 'Bilirubin (total)', group: 'Liver', test: 'Liver Function Tests', unit: 'mg/dL', alias: ['bilirubin total', 'total bilirubin', 'serum bilirubin total', 'bilirubin'],
    what: 'A yellow pigment from the breakdown of red blood cells, cleared by the liver.', low: 'Not a concern.', high: 'Can show as yellowing of the eyes or skin; causes range from harmless to liver or bile problems.' },
  { key: 'alb', name: 'Albumin', group: 'Liver', test: 'Liver Function Tests', unit: 'g/dL', alias: ['albumin', 'serum albumin', 'albumin serum'],
    what: 'The main protein in blood, made by the liver.', low: 'Can accompany poor nutrition, liver or kidney conditions.', high: 'Usually from dehydration.' },
  { key: 'tp', name: 'Total protein', group: 'Liver', test: 'Liver Function Tests', unit: 'g/dL', alias: ['total protein', 'protein total', 'serum protein'],
    what: 'Albumin plus the globulin proteins in blood.', low: 'Can accompany poor nutrition or liver or kidney conditions.', high: 'Can accompany dehydration or some immune conditions.' },
  /* ---- kidney ---- */
  { key: 'creat', name: 'Creatinine', group: 'Kidney', test: 'Kidney Function Tests', unit: 'mg/dL', alias: ['creatinine', 'serum creatinine', 'creatinine serum'],
    what: 'A waste product your kidneys clear; it helps estimate kidney function.', low: 'Usually reflects low muscle mass.', high: 'Can mean the kidneys are clearing less, or dehydration or heavy muscle; a doctor looks at the trend.' },
  { key: 'urea', name: 'Urea', group: 'Kidney', test: 'Kidney Function Tests', unit: 'mg/dL', alias: ['urea', 'blood urea', 'serum urea', 'urea serum'],
    what: 'A waste product from protein breakdown.', low: 'Can follow low protein intake or liver issues.', high: 'Can accompany dehydration, a high-protein diet or reduced kidney function.' },
  { key: 'bun', name: 'Blood urea nitrogen', group: 'Kidney', test: 'Kidney Function Tests', unit: 'mg/dL', alias: ['blood urea nitrogen', 'bun', 'urea nitrogen'],
    what: 'The nitrogen part of urea, a kidney waste marker.', low: 'Can follow low protein intake.', high: 'Can accompany dehydration or reduced kidney function.' },
  { key: 'uric', name: 'Uric acid', group: 'Kidney', test: 'Uric Acid', unit: 'mg/dL', alias: ['uric acid', 'serum uric acid', 'uric acid serum'],
    what: 'A by-product of purine breakdown.', low: 'Rarely a concern.', high: 'Can go with gout, kidney stones, certain foods and alcohol; a doctor decides if it needs action.' },
  { key: 'egfr', name: 'eGFR', group: 'Kidney', test: 'Kidney Function Tests', unit: 'mL/min/1.73m2', alias: ['egfr', 'estimated gfr', 'glomerular filtration rate', 'gfr', 'egfr estimated'],
    what: 'An estimate of how well your kidneys filter blood.', low: 'Lower values mean the kidneys are filtering less; follow-up testing is usual.', high: 'Higher is generally fine.' },
  /* ---- salts ---- */
  { key: 'na', name: 'Sodium', group: 'Salts', test: 'Electrolyte Panel', unit: 'mmol/L', alias: ['sodium', 'serum sodium', 'sodium na', 'na'],
    what: 'A salt that balances body water.', low: 'Can follow fluid loss, some medicines or conditions; a doctor decides the cause.', high: 'Usually from dehydration.' },
  { key: 'k', name: 'Potassium', group: 'Salts', test: 'Electrolyte Panel', unit: 'mmol/L', alias: ['potassium', 'serum potassium', 'potassium k', 'k'],
    what: 'A salt that matters for heart and muscle rhythm.', low: 'Can follow vomiting, diarrhoea or some water pills.', high: 'Can accompany kidney issues or some medicines; important to discuss promptly.' },
  { key: 'ca', name: 'Calcium', group: 'Salts', test: 'Calcium Test', unit: 'mg/dL', alias: ['calcium', 'serum calcium', 'calcium total', 'total calcium'],
    what: 'Needed for bones, nerves and muscles.', low: 'Can go with low vitamin D or parathyroid issues.', high: 'Can go with parathyroid issues or too many supplements.' },
  /* ---- thyroid ---- */
  { key: 'tsh', name: 'TSH', group: 'Thyroid', test: 'Thyroid Function Test', unit: 'uIU/mL', alias: ['tsh', 'thyroid stimulating hormone', 'tsh ultrasensitive', 'tsh 3rd generation', 'ultrasensitive tsh', 'tsh third generation'],
    what: 'The pituitary signal that tells your thyroid how hard to work.', low: 'Low can go with an overactive thyroid.', high: 'High often goes with an underactive thyroid; a doctor confirms with T4.' },
  { key: 'ft4', name: 'Free T4', group: 'Thyroid', test: 'Thyroid Function Test', unit: 'ng/dL', alias: ['free t4', 'ft4', 'free thyroxine', 'free thyroxine ft4', 't4 free'],
    what: 'The active thyroid hormone in blood.', low: 'Goes with an underactive thyroid.', high: 'Goes with an overactive thyroid.' },
  { key: 't3', name: 'Total T3', group: 'Thyroid', test: 'Thyroid Function Test', unit: 'ng/dL', alias: ['t3', 'total t3', 'triiodothyronine', 'total triiodothyronine', 't3 total', 'total triiodothyronine t3'],
    what: 'A thyroid hormone that acts on tissues.', low: 'Can go with an underactive thyroid or illness.', high: 'Can go with an overactive thyroid.' },
  { key: 't4', name: 'Total T4', group: 'Thyroid', test: 'Thyroid Function Test', unit: 'ug/dL', alias: ['t4', 'total t4', 'thyroxine', 'total thyroxine', 't4 total', 'total thyroxine t4'],
    what: 'The main hormone the thyroid releases.', low: 'Goes with an underactive thyroid.', high: 'Goes with an overactive thyroid.' },
  /* ---- vitamins and iron ---- */
  { key: 'vitd', name: 'Vitamin D (25-OH)', group: 'Vitamins and iron', test: 'Vitamin D', unit: 'ng/mL', alias: ['vitamin d', '25 oh vitamin d', '25 hydroxy vitamin d', 'vitamin d 25 hydroxy', 'vitamin d total', '25 oh vitamin d total', 'vitamin d3', 'vit d', 'vitamin d 25 oh', '25 hydroxy vitamin d total'],
    what: 'Your vitamin D store, which supports bones and muscles.', low: 'Common in India despite sunshine. A doctor advises on supplement dose and re-testing.', high: 'Usually from too many supplements; ask a doctor before continuing them.' },
  { key: 'b12', name: 'Vitamin B12', group: 'Vitamins and iron', test: 'Vitamin B12', unit: 'pg/mL', alias: ['vitamin b12', 'b12', 'cyanocobalamin', 'vitamin b 12', 'vitamin b12 cyanocobalamin'],
    what: 'Needed for nerves and red blood cells; found in animal foods.', low: 'Common in vegetarians and some medicine users. Can cause tiredness or tingling; a doctor advises the treatment.', high: 'Usually from supplements.' },
  { key: 'folate', name: 'Folate', group: 'Vitamins and iron', test: 'Folic Acid', unit: 'ng/mL', alias: ['folate', 'folic acid', 'vitamin b9', 'serum folate'],
    what: 'Needed to make red blood cells and DNA.', low: 'Can accompany poor diet or increased need such as pregnancy.', high: 'Usually from supplements.' },
  { key: 'ferritin', name: 'Ferritin', group: 'Vitamins and iron', test: 'Iron Studies', unit: 'ng/mL', alias: ['ferritin', 'serum ferritin'],
    what: 'Your body’s iron store.', low: 'Means low iron stores, even before anaemia shows.', high: 'Can rise with inflammation, liver issues or iron overload.' },
  { key: 'iron', name: 'Serum iron', group: 'Vitamins and iron', test: 'Iron Studies', unit: 'ug/dL', alias: ['iron', 'serum iron', 'iron serum'],
    what: 'The iron circulating in blood right now; varies through the day.', low: 'Goes with iron deficiency, read together with TIBC and ferritin.', high: 'Can follow iron tablets taken recently.' },
  { key: 'tibc', name: 'TIBC', group: 'Vitamins and iron', test: 'Iron Studies', unit: 'ug/dL', alias: ['tibc', 'total iron binding capacity', 'iron binding capacity'],
    what: 'How much iron your blood proteins could carry.', low: 'Can go with inflammation or poor nutrition.', high: 'Tends to rise when iron is low.' },
  { key: 'tsat', name: 'Transferrin saturation', group: 'Vitamins and iron', test: 'Iron Studies', unit: '%', alias: ['transferrin saturation', 'iron saturation', 'tsat', '% saturation', 'saturation'],
    what: 'How full your iron carriers are.', low: 'Goes with iron deficiency.', high: 'Can go with iron overload; a doctor decides.' }
];

/* ---- more tests (short notes only; the printed range on the report decides the status) ---- */
(function () {
  function A(key, name, group, test, unit, alias, what) { window.LAB_ANALYTES.push({ key: key, name: name, group: group, test: test, unit: unit, alias: alias, what: what }); }
  A('eos', 'Eosinophils', 'Blood count', 'CBC', '%', ['eosinophils', 'eosinophil', 'absolute eosinophil count', 'aec', 'eosinophils absolute'], 'A type of white blood cell linked with allergies and some infections.');
  A('mono', 'Monocytes', 'Blood count', 'CBC', '%', ['monocytes', 'monocyte', 'absolute monocyte count', 'monocytes absolute'], 'A type of white blood cell that helps clear infection.');
  A('baso', 'Basophils', 'Blood count', 'CBC', '%', ['basophils', 'basophil', 'absolute basophil count', 'basophils absolute'], 'A small share of white cells involved in allergic reactions.');
  A('mpv', 'Mean platelet volume', 'Blood count', 'CBC', 'fL', ['mpv', 'mean platelet volume'], 'The average size of your platelets.');
  A('retic', 'Reticulocyte count', 'Blood count', 'CBC', '%', ['reticulocyte count', 'retic count', 'reticulocytes'], 'Young red blood cells; shows how fast the bone marrow is making new red cells.');
  A('eag', 'Estimated average glucose', 'Sugar', 'HbA1c', 'mg/dL', ['estimated average glucose', 'eag', 'average blood glucose'], 'The average blood sugar worked out from your HbA1c.');
  A('rbs', 'Random blood glucose', 'Sugar', 'Fasting Glucose', 'mg/dL', ['random blood sugar', 'random blood glucose', 'rbs', 'glucose random'], 'Blood sugar measured at any time of day, not fasting.');
  A('tchdl', 'Cholesterol / HDL ratio', 'Lipids', 'Lipid Profile', '', ['tc hdl ratio', 'cholesterol hdl ratio', 'total cholesterol hdl ratio', 'chol hdl ratio', 'tc/hdl ratio'], 'Total cholesterol divided by HDL; a lower ratio is generally preferred.');
  A('ldlhdl', 'LDL / HDL ratio', 'Lipids', 'Lipid Profile', '', ['ldl hdl ratio', 'ldl/hdl ratio'], 'LDL divided by HDL.');
  A('apob', 'Apolipoprotein B', 'Lipids', 'Apolipoprotein B', 'mg/dL', ['apolipoprotein b', 'apo b', 'apob'], 'A count of the cholesterol-carrying particles that can build up in arteries.');
  A('apoa1', 'Apolipoprotein A1', 'Lipids', 'Lipid Subfractions', 'mg/dL', ['apolipoprotein a1', 'apo a1', 'apoa1', 'apolipoprotein a'], 'The main protein in HDL, the "good" cholesterol.');
  A('dbili', 'Direct bilirubin', 'Liver', 'Liver Function Tests', 'mg/dL', ['direct bilirubin', 'bilirubin direct', 'conjugated bilirubin', 'bilirubin conjugated'], 'Bilirubin that the liver has already processed.');
  A('ibili', 'Indirect bilirubin', 'Liver', 'Liver Function Tests', 'mg/dL', ['indirect bilirubin', 'bilirubin indirect', 'unconjugated bilirubin', 'bilirubin unconjugated'], 'Bilirubin that has not yet reached the liver.');
  A('glob', 'Globulin', 'Liver', 'Liver Function Tests', 'g/dL', ['globulin', 'serum globulin'], 'A group of blood proteins that includes antibodies.');
  A('ag', 'Albumin / globulin ratio', 'Liver', 'Liver Function Tests', '', ['a g ratio', 'albumin globulin ratio', 'a/g ratio', 'albumin/globulin ratio'], 'Albumin divided by globulin.');
  A('bunc', 'BUN / creatinine ratio', 'Kidney', 'Kidney Function Tests', '', ['bun creatinine ratio', 'urea creatinine ratio', 'bun/creatinine ratio'], 'Compares two waste products; used by doctors to look at hydration and kidney handling.');
  A('cystc', 'Cystatin C', 'Kidney', 'Kidney Function Tests', 'mg/L', ['cystatin c', 'cystatin-c'], 'Another marker of how well the kidneys filter.');
  A('cl', 'Chloride', 'Salts', 'Electrolyte Panel', 'mmol/L', ['chloride', 'serum chloride', 'cl'], 'A salt that helps balance body fluids.');
  A('hco3', 'Bicarbonate', 'Salts', 'Electrolyte Panel', 'mmol/L', ['bicarbonate', 'hco3', 'total co2', 'serum bicarbonate'], 'Helps keep the blood acid balance steady.');
  A('phos', 'Phosphorus', 'Salts', 'Calcium Test', 'mg/dL', ['phosphorus', 'phosphate', 'inorganic phosphorus', 'serum phosphorus'], 'A mineral that works with calcium for bones.');
  A('mg', 'Magnesium', 'Salts', 'Magnesium', 'mg/dL', ['magnesium', 'serum magnesium', 'mg'], 'A mineral needed by muscles, nerves and the heart.');
  A('ft3', 'Free T3', 'Thyroid', 'Thyroid Function Test', 'pg/mL', ['free t3', 'ft3', 'free triiodothyronine', 'triiodothyronine free'], 'The active thyroid hormone circulating freely in blood.');
  A('tpo', 'Anti-TPO antibodies', 'Thyroid', 'Thyroid Function Test', 'IU/mL', ['anti tpo', 'tpo antibodies', 'anti thyroid peroxidase', 'thyroid peroxidase antibody', 'anti tpo antibody', 'tpo ab'], 'Antibodies sometimes found when the immune system affects the thyroid.');
  A('trop', 'Troponin', 'Heart', 'Troponin', 'ng/L', ['troponin', 'troponin i', 'troponin t', 'hs troponin', 'high sensitivity troponin', 'hs troponin i', 'hs troponin t'], 'A protein released when heart muscle is strained or injured.');
  A('bnp', 'BNP / NT-proBNP', 'Heart', 'BNP', 'pg/mL', ['bnp', 'nt probnp', 'nt pro bnp', 'pro bnp', 'b type natriuretic peptide'], 'A hormone released when the heart is under strain.');
  A('ck', 'Creatine kinase (CK)', 'Heart', 'CK (Creatine Kinase)', 'U/L', ['ck', 'cpk', 'creatine kinase', 'ck total', 'creatine phosphokinase'], 'An enzyme found in muscle and heart.');
  A('ckmb', 'CK-MB', 'Heart', 'CK (Creatine Kinase)', 'U/L', ['ck mb', 'ckmb', 'cpk mb'], 'The heart-muscle form of creatine kinase.');
  A('hcy', 'Homocysteine', 'Heart', 'Homocysteine', 'umol/L', ['homocysteine', 'serum homocysteine'], 'An amino acid; higher levels are linked with low B12 or folate and with heart risk.');
  A('hscrp', 'hs-CRP', 'Inflammation', 'CRP', 'mg/L', ['hs crp', 'hscrp', 'high sensitivity crp', 'high sensitivity c reactive protein', 'c reactive protein high sensitivity', 'crp high sensitivity'], 'A sensitive version of CRP, used to look at low-grade inflammation.');
  A('testo', 'Testosterone', 'Hormones', 'Testosterone', 'ng/dL', ['testosterone', 'total testosterone', 'testosterone total', 'free testosterone'], 'A sex hormone present in everyone, higher in men.');
  A('cort', 'Cortisol', 'Hormones', 'Cortisol', 'ug/dL', ['cortisol', 'serum cortisol', 'cortisol morning', 'cortisol am'], 'A stress hormone that follows a daily rhythm, highest in the morning.');
  A('prl', 'Prolactin', 'Hormones', 'FSH/LH', 'ng/mL', ['prolactin', 'serum prolactin'], 'A hormone from the pituitary gland.');
  A('lh', 'LH', 'Hormones', 'FSH/LH', 'mIU/mL', ['lh', 'luteinizing hormone', 'luteinising hormone'], 'A pituitary hormone that controls ovulation and testosterone.');
  A('fsh', 'FSH', 'Hormones', 'FSH/LH', 'mIU/mL', ['fsh', 'follicle stimulating hormone'], 'A pituitary hormone that supports eggs and sperm.');
  A('e2', 'Estradiol', 'Hormones', 'Estradiol', 'pg/mL', ['estradiol', 'e2', 'oestradiol', 'estradiol e2'], 'The main form of oestrogen.');
  A('prog', 'Progesterone', 'Hormones', 'Progesterone', 'ng/mL', ['progesterone', 'serum progesterone'], 'A hormone involved in the menstrual cycle and pregnancy.');
  A('dhea', 'DHEA-S', 'Hormones', 'DHEA-S', 'ug/dL', ['dhea s', 'dheas', 'dhea sulfate', 'dehydroepiandrosterone sulfate'], 'A hormone made by the adrenal glands.');
  A('psa', 'PSA (total)', 'Cancer markers', 'PSA', 'ng/mL', ['psa', 'psa total', 'total psa', 'prostate specific antigen', 'prostate specific antigen psa'], 'A prostate protein; a rise can have many causes and needs a doctor to interpret.');
  A('fpsa', 'Free PSA', 'Cancer markers', 'PSA', 'ng/mL', ['free psa', 'psa free'], 'The unbound share of PSA.');
  A('ca125', 'CA-125', 'Cancer markers', 'CA-125', 'U/mL', ['ca 125', 'ca125', 'cancer antigen 125'], 'A protein used to follow some ovarian conditions; it can be raised for harmless reasons.');
  A('cea', 'CEA', 'Cancer markers', 'FIT Test', 'ng/mL', ['cea', 'carcinoembryonic antigen'], 'A marker doctors sometimes follow after treatment of certain cancers.');
  A('afp', 'Alpha-fetoprotein (AFP)', 'Cancer markers', 'Liver Function Tests', 'ng/mL', ['afp', 'alpha fetoprotein', 'alpha feto protein'], 'A protein followed in liver conditions and pregnancy screening.');
  A('ca199', 'CA 19-9', 'Cancer markers', 'Abdominal Ultrasound', 'U/mL', ['ca 19 9', 'ca19 9', 'ca 199', 'cancer antigen 19 9'], 'A marker doctors sometimes follow for pancreas and bile-duct conditions.');
  A('amy', 'Amylase', 'Digestive', 'Abdominal Ultrasound', 'U/L', ['amylase', 'serum amylase'], 'A digestive enzyme from the pancreas.');
  A('lip', 'Lipase', 'Digestive', 'Abdominal Ultrasound', 'U/L', ['lipase', 'serum lipase'], 'A digestive enzyme from the pancreas.');
  A('ldh', 'LDH', 'General', 'CK (Creatine Kinase)', 'U/L', ['ldh', 'lactate dehydrogenase', 'ldh total', 'lactic dehydrogenase'], 'An enzyme found in many tissues, raised when tissue is damaged.');
  A('pt', 'Prothrombin time (PT)', 'Clotting', 'CBC', 'sec', ['prothrombin time', 'pt', 'pt patient', 'pt test'], 'How long your blood takes to clot.');
  A('inr', 'INR', 'Clotting', 'CBC', '', ['inr', 'pt inr', 'international normalized ratio', 'international normalised ratio'], 'A standard way to report clotting time, used for people on blood thinners.');
  A('aptt', 'APTT', 'Clotting', 'CBC', 'sec', ['aptt', 'ptt', 'activated partial thromboplastin time', 'aptt patient'], 'Another clotting-time test.');
  A('uph', 'Urine pH', 'Urine', 'Urinalysis', '', ['ph', 'urine ph', 'reaction ph', 'urine reaction'], 'How acidic the urine is.');
  A('usg', 'Urine specific gravity', 'Urine', 'Urinalysis', '', ['specific gravity', 'urine specific gravity', 'sp gravity', 'sp. gravity'], 'How concentrated the urine is.');
  A('uprot', 'Urine protein', 'Urine', 'Microalbuminuria', '', ['urine protein', 'protein urine', 'protein', 'albumin urine', 'urine albumin'], 'Protein in the urine; a small trace can be normal.');
  A('uglu', 'Urine glucose', 'Urine', 'Urinalysis', '', ['urine glucose', 'glucose urine', 'sugar urine', 'urine sugar'], 'Sugar in the urine.');
  A('uket', 'Urine ketones', 'Urine', 'Urinalysis', '', ['ketones', 'urine ketones', 'ketone bodies', 'ketone'], 'Seen when the body burns fat for energy, for example during fasting.');
  A('upus', 'Pus cells', 'Urine', 'Urinalysis', '/hpf', ['pus cells', 'pus cells wbc', 'urine wbc', 'leucocytes urine', 'wbc pus cells'], 'White cells in the urine; more of them can go with an infection or irritation.');
  A('urbc', 'Urine red cells', 'Urine', 'Urinalysis', '/hpf', ['urine rbc', 'rbcs urine', 'red blood cells urine', 'rbc urine'], 'Red cells seen under the microscope in a urine sample.');
  A('uepi', 'Epithelial cells', 'Urine', 'Urinalysis', '/hpf', ['epithelial cells', 'urine epithelial cells', 'squamous epithelial cells'], 'Cells from the lining of the urinary tract or from the skin; a few are common.');
  A('acr', 'Urine albumin / creatinine ratio', 'Urine', 'Microalbuminuria', 'mg/g', ['urine albumin creatinine ratio', 'acr', 'albumin creatinine ratio', 'microalbumin creatinine ratio', 'urine microalbumin creatinine ratio'], 'An early kidney marker, often checked in people with diabetes or high blood pressure.');
  A('umalb', 'Urine microalbumin', 'Urine', 'Microalbuminuria', 'mg/L', ['microalbumin', 'urine microalbumin', 'microalbumin urine', 'microalbuminuria'], 'Tiny amounts of albumin in urine, an early kidney marker.');
  A('hbsag', 'Hepatitis B surface antigen', 'Infection', 'Hepatitis B Surface Antigen', '', ['hbsag', 'hepatitis b surface antigen', 'hbs ag', 'hepatitis b surface antigen hbsag'], 'A marker of current hepatitis B infection.');
  A('hcv', 'Hepatitis C antibody', 'Infection', 'Hepatitis C Antibody', '', ['anti hcv', 'hepatitis c antibody', 'hcv antibody', 'hcv ab', 'anti hcv antibodies'], 'Shows whether you have been exposed to hepatitis C.');
  A('hiv', 'HIV antibody', 'Infection', 'HIV Test', '', ['hiv', 'hiv 1 2', 'hiv i ii', 'hiv antibody', 'hiv 1 and 2 antibodies', 'hiv 1 2 antibody'], 'A screening test for HIV.');
  A('vitb6', 'Vitamin B6', 'Vitamins', 'Vitamin B12', 'ng/mL', ['vitamin b6', 'pyridoxine', 'b6'], 'A B vitamin needed for energy use and nerves.');
  A('zn', 'Zinc', 'Vitamins', 'Zinc', 'ug/dL', ['zinc', 'serum zinc'], 'A trace mineral for immunity and healing.');
  A('vita', 'Vitamin A', 'Vitamins', 'Vitamin A', 'ug/dL', ['vitamin a', 'retinol'], 'A vitamin for eyes, skin and immunity.');
  A('vite', 'Vitamin E', 'Vitamins', 'Vitamin E', 'mg/L', ['vitamin e', 'alpha tocopherol', 'tocopherol'], 'An antioxidant vitamin.');
  A('vitc', 'Vitamin C', 'Vitamins', 'Vitamin A', 'mg/dL', ['vitamin c', 'ascorbic acid'], 'A vitamin for healing and iron absorption.');
  A('pth', 'Parathyroid hormone (PTH)', 'Hormones', 'Calcium Test', 'pg/mL', ['pth', 'parathyroid hormone', 'intact pth', 'pth intact'], 'The hormone that controls calcium and bone.');
})();

/* ---- what is on a page: names people see on report headings, and the words that go with them.
   kind 'values' = a table of numbers (words come from the tests above); kind 'findings' = a written report. ---- */
window.LAB_TOPICS = [
  { name: 'Complete blood count', test: 'CBC', kind: 'values', head: ['complete blood count', 'cbc', 'haemogram', 'hemogram', 'complete haemogram', 'complete hemogram', 'blood count', 'cbc with esr', 'hematology', 'haematology'] },
  { name: 'Lipid profile', test: 'Lipid Profile', tests: ['Lipid Profile', 'Apolipoprotein B', 'Lipid Subfractions', 'Lp(a)'], kind: 'values', head: ['lipid profile', 'lipid panel', 'cholesterol profile', 'lipid test', 'lipid studies'] },
  { name: 'Liver function', test: 'Liver Function Tests', kind: 'values', head: ['liver function test', 'liver function tests', 'lft', 'liver profile', 'hepatic function', 'liver panel'] },
  { name: 'Kidney function', test: 'Kidney Function Tests', tests: ['Kidney Function Tests', 'Uric Acid'], kind: 'values', head: ['kidney function test', 'kidney function tests', 'kft', 'renal function test', 'renal function tests', 'rft', 'renal profile', 'kidney profile'] },
  { name: 'Thyroid', test: 'Thyroid Function Test', kind: 'values', head: ['thyroid profile', 'thyroid function test', 'thyroid function tests', 'tft', 'thyroid panel', 'thyroid'] },
  { name: 'Blood sugar', test: 'HbA1c', tests: ['Fasting Glucose', 'HbA1c', 'Insulin', 'OGTT'], kind: 'values', head: ['diabetes', 'glycosylated haemoglobin', 'glycated hemoglobin', 'hba1c', 'blood sugar', 'glucose fasting', 'glucose tolerance', 'diabetic profile'] },
  { name: 'Vitamins', test: 'Vitamin D', tests: ['Vitamin D', 'Vitamin B12', 'Folic Acid', 'Vitamin A', 'Vitamin E', 'Zinc'], kind: 'values', head: ['vitamin profile', 'vitamins', 'vitamin d', 'vitamin b12'] },
  { name: 'Iron studies', test: 'Iron Studies', kind: 'values', head: ['iron studies', 'iron profile', 'anaemia profile', 'anemia profile', 'iron deficiency profile'] },
  { name: 'Salts and minerals', test: 'Electrolyte Panel', tests: ['Electrolyte Panel', 'Calcium Test', 'Magnesium'], kind: 'values', head: ['electrolytes', 'electrolyte panel', 'serum electrolytes', 'minerals'] },
  { name: 'Urine tests', test: 'Urinalysis', tests: ['Urinalysis', 'Microalbuminuria'], kind: 'values', head: ['urine routine', 'urinalysis', 'urine examination', 'urine analysis', 'routine urine examination', 'physical examination', 'chemical examination', 'microscopic examination'] },
  { name: 'Inflammation', test: 'CRP', tests: ['CRP', 'ESR'], kind: 'values', head: ['inflammation', 'c reactive protein', 'esr', 'erythrocyte sedimentation rate'] },
  { name: 'Heart markers', test: 'Troponin', tests: ['Troponin', 'BNP', 'CK (Creatine Kinase)', 'Homocysteine'], kind: 'values', head: ['cardiac markers', 'cardiac profile', 'cardiac risk', 'heart profile', 'troponin'] },
  { name: 'Hormones', test: 'FSH/LH', tests: ['FSH/LH', 'Testosterone', 'Estradiol', 'Progesterone', 'DHEA-S', 'Cortisol'], kind: 'values', head: ['hormone', 'hormones', 'hormone profile', 'fertility profile', 'endocrine'] },
  { name: 'Cancer markers', test: 'PSA', tests: ['PSA', 'CA-125', 'FIT Test'], kind: 'values', head: ['tumor markers', 'tumour markers', 'cancer markers', 'psa'] },
  { name: 'Infection tests', test: 'HIV Test', tests: ['HIV Test', 'Hepatitis B Surface Antigen', 'Hepatitis C Antibody'], kind: 'values', head: ['serology', 'infectious disease', 'hepatitis', 'viral markers'] },
  { name: 'Clotting', test: 'CBC', tests: [], keys: ['pt', 'inr', 'aptt'], kind: 'values', head: ['coagulation', 'coagulation profile', 'clotting profile', 'prothrombin time'] },
  { name: 'ECG', test: 'ECG', kind: 'findings', head: ['electrocardiogram', 'ecg', 'ekg', '12 lead ecg'], words: ['sinus rhythm', 'heart rate', 'pr interval', 'qrs', 'qt', 'qtc', 'axis', 'st segment', 't wave', 'p wave', 'bpm', 'rhythm', 'tachycardia', 'bradycardia'] },
  { name: 'Echocardiogram', test: 'Echocardiogram', kind: 'findings', head: ['echocardiogram', 'echocardiography', '2d echo', 'echo', 'colour doppler', 'color doppler'], words: ['ejection fraction', 'lvef', 'left ventricle', 'right ventricle', 'mitral valve', 'aortic valve', 'tricuspid', 'left atrium', 'pericardial', 'wall motion', 'doppler', 'lvedd', 'lvesd', 'regurgitation'] },
  { name: 'Treadmill / stress test', test: 'Stress Test', kind: 'findings', head: ['treadmill test', 'tmt', 'stress test', 'exercise ecg', 'stress echo'], words: ['bruce protocol', 'mets', 'target heart rate', 'exercise duration', 'stage'] },
  { name: 'Holter monitor', test: 'Holter Monitor', kind: 'findings', head: ['holter', '24 hour ecg', '24 hr holter'], words: ['ventricular ectopic', 'supraventricular', 'average heart rate', 'minimum heart rate', 'maximum heart rate', 'pauses'] },
  { name: 'X-ray', test: 'Chest X-ray', kind: 'findings', head: ['x ray', 'xray', 'chest x ray', 'radiograph', 'radiology'], words: ['impression', 'lung fields', 'costophrenic', 'cardiac silhouette', 'bony cage', 'hila', 'mediastinum', 'opacity', 'consolidation'] },
  { name: 'Ultrasound', test: 'Abdominal Ultrasound', kind: 'findings', head: ['ultrasound', 'ultrasonography', 'usg', 'sonography', 'sonogram'], words: ['liver', 'gall bladder', 'gallbladder', 'spleen', 'pancreas', 'kidneys', 'urinary bladder', 'prostate', 'uterus', 'ovaries', 'echotexture', 'impression', 'normal in size', 'free fluid'] },
  { name: 'CT scan', test: 'CT Scan Abdomen', kind: 'findings', head: ['ct scan', 'computed tomography', 'ct abdomen', 'ct chest', 'ct angiography', 'hrct'], words: ['contrast', 'hounsfield', 'impression', 'findings', 'enhancement', 'lesion', 'axial', 'coronal'] },
  { name: 'MRI', test: 'MRI Brain', kind: 'findings', head: ['mri', 'magnetic resonance'], words: ['t1', 't2', 'flair', 'gadolinium', 'impression', 'findings', 'signal intensity', 'sequences', 'lesion'] },
  { name: 'Mammography', test: 'Mammography', kind: 'findings', head: ['mammography', 'mammogram', 'breast imaging'], words: ['bi rads', 'birads', 'breast density', 'calcification', 'axillary', 'impression'] },
  { name: 'Bone density (DEXA)', test: 'Bone Density (DEXA)', kind: 'findings', head: ['dexa', 'dxa', 'bone density', 'bone mineral density'], words: ['t score', 'z score', 'bmd', 'osteopenia', 'osteoporosis', 'lumbar spine', 'femoral neck'] },
  { name: 'Lung function', test: 'Spirometry', kind: 'findings', head: ['spirometry', 'pulmonary function', 'pft', 'lung function'], words: ['fev1', 'fvc', 'fev1 fvc', 'pef', 'predicted', 'bronchodilator', 'post bronchodilator'] },
  { name: 'Pap smear / cytology', test: 'Pap Smear', kind: 'findings', head: ['pap smear', 'cytology', 'cervical cytology', 'pap test', 'liquid based cytology'], words: ['bethesda', 'nilm', 'intraepithelial', 'squamous', 'adequacy', 'endocervical'] },
  { name: 'Histopathology / biopsy', test: 'Bone Marrow Biopsy', kind: 'findings', head: ['histopathology', 'biopsy', 'histology', 'pathology report'], words: ['gross description', 'microscopy', 'specimen', 'sections show', 'diagnosis', 'immunohistochemistry'] },
  { name: 'Endoscopy / colonoscopy', test: 'Colonoscopy', kind: 'findings', head: ['colonoscopy', 'endoscopy', 'gastroscopy', 'sigmoidoscopy', 'upper gi endoscopy'], words: ['mucosa', 'polyp', 'caecum', 'cecum', 'duodenum', 'antrum', 'oesophagus', 'esophagus', 'biopsy taken'] }
];
