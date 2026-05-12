import type { DrugInteraction, DrugInfo } from '../types';

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  { drug1: 'warfarin', drug2: 'aspirin', severity: 'severe', description: 'Increased bleeding risk. Avoid combination or monitor INR closely.' },
  { drug1: 'warfarin', drug2: 'ibuprofen', severity: 'severe', description: 'NSAIDs increase bleeding risk with anticoagulants.' },
  { drug1: 'warfarin', drug2: 'naproxen', severity: 'severe', description: 'NSAIDs increase bleeding risk with anticoagulants.' },
  { drug1: 'metformin', drug2: 'contrast dye', severity: 'moderate', description: 'Hold metformin before iodinated contrast procedures.' },
  { drug1: 'simvastatin', drug2: 'amiodarone', severity: 'severe', description: 'Risk of myopathy and rhabdomyolysis. Limit simvastatin to 20mg.' },
  { drug1: 'ssri', drug2: 'maoi', severity: 'severe', description: 'Risk of serotonin syndrome. Contraindicated combination.' },
  { drug1: 'fluoxetine', drug2: 'tramadol', severity: 'moderate', description: 'Increased risk of serotonin syndrome and seizures.' },
  { drug1: 'ciprofloxacin', drug2: 'antacid', severity: 'moderate', description: 'Antacids reduce ciprofloxacin absorption. Take 2h apart.' },
  { drug1: 'levothyroxine', drug2: 'calcium', severity: 'moderate', description: 'Calcium supplements reduce levothyroxine absorption. Take 4h apart.' },
  { drug1: 'metoprolol', drug2: 'verapamil', severity: 'severe', description: 'Combined effect can cause serious heart rate and blood pressure issues.' },
  { drug1: 'sildenafil', drug2: 'nitrate', severity: 'severe', description: 'Dangerous blood pressure drop. Contraindicated.' },
  { drug1: 'lithium', drug2: 'ibuprofen', severity: 'moderate', description: 'NSAIDs can increase lithium levels to toxic range.' },
  { drug1: 'digoxin', drug2: 'amiodarone', severity: 'severe', description: 'Amiodarone increases digoxin levels significantly. Reduce digoxin dose.' },
  { drug1: 'clopidogrel', drug2: 'omeprazole', severity: 'moderate', description: 'Omeprazole may reduce antiplatelet effect of clopidogrel.' },
  { drug1: 'methotrexate', drug2: 'nsaid', severity: 'severe', description: 'NSAIDs can increase methotrexate toxicity.' },
  { drug1: 'atorvastatin', drug2: 'clarithromycin', severity: 'moderate', description: 'Increased statin levels, risk of myopathy.' },
  { drug1: 'amlodipine', drug2: 'simvastatin', severity: 'moderate', description: 'Amlodipine increases simvastatin exposure. Limit simvastatin dose.' },
  { drug1: 'potassium', drug2: 'lisinopril', severity: 'moderate', description: 'ACE inhibitors can increase potassium levels. Monitor serum potassium.' },
  { drug1: 'alcohol', drug2: 'metronidazole', severity: 'severe', description: 'Disulfiram-like reaction: flushing, vomiting, rapid heart rate.' },
  { drug1: 'alcohol', drug2: 'acetaminophen', severity: 'moderate', description: 'Chronic alcohol use increases risk of liver damage with acetaminophen.' },
];

export const DRUG_DATABASE: Record<string, DrugInfo> = {
  metformin: {
    name: 'Metformin',
    genericName: 'metformin hydrochloride',
    category: 'Antidiabetic',
    description: 'First-line medication for type 2 diabetes. Lowers blood sugar by improving insulin sensitivity.',
    commonSideEffects: ['Nausea', 'Diarrhea', 'Stomach upset', 'Metallic taste'],
    seriousSideEffects: ['Lactic acidosis (rare)', 'Vitamin B12 deficiency with long-term use'],
    interactions: ['Alcohol', 'Iodinated contrast', 'Cimetidine'],
    storageInfo: 'Store at room temperature (15–30°C), away from heat and moisture.',
    pregnancy: 'Generally considered safe in pregnancy; consult your doctor.',
  },
  lisinopril: {
    name: 'Lisinopril',
    genericName: 'lisinopril',
    category: 'ACE Inhibitor / Antihypertensive',
    description: 'Treats high blood pressure, heart failure, and protects kidneys in diabetes.',
    commonSideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
    seriousSideEffects: ['Angioedema (swelling of face/throat)', 'High potassium', 'Kidney problems'],
    interactions: ['NSAIDs', 'Potassium supplements', 'Lithium', 'Diuretics'],
    storageInfo: 'Store below 25°C. Keep away from moisture.',
    pregnancy: 'Contraindicated in 2nd and 3rd trimester.',
  },
  atorvastatin: {
    name: 'Atorvastatin',
    genericName: 'atorvastatin calcium',
    category: 'Statin / Cholesterol-lowering',
    description: 'Reduces LDL cholesterol and triglycerides. Lowers risk of heart attack and stroke.',
    commonSideEffects: ['Muscle aches', 'Headache', 'Nausea', 'Joint pain'],
    seriousSideEffects: ['Rhabdomyolysis (severe muscle breakdown)', 'Liver damage', 'Elevated blood sugar'],
    interactions: ['Clarithromycin', 'Antifungals', 'Grapefruit juice', 'Cyclosporine'],
    storageInfo: 'Store at room temperature, away from heat and light.',
    pregnancy: 'Contraindicated during pregnancy.',
  },
  omeprazole: {
    name: 'Omeprazole',
    genericName: 'omeprazole',
    category: 'Proton Pump Inhibitor',
    description: 'Reduces stomach acid production. Treats GERD, ulcers, and acid reflux.',
    commonSideEffects: ['Headache', 'Diarrhea', 'Nausea', 'Abdominal pain'],
    seriousSideEffects: ['Low magnesium with long-term use', 'C. difficile infection', 'Bone fractures with long-term use'],
    interactions: ['Clopidogrel', 'Methotrexate', 'Digoxin', 'Iron supplements'],
    storageInfo: 'Store at 15–30°C, protect from moisture.',
    pregnancy: 'Use with caution; consult your doctor.',
  },
  levothyroxine: {
    name: 'Levothyroxine',
    genericName: 'levothyroxine sodium',
    category: 'Thyroid Hormone',
    description: 'Replaces thyroid hormone in hypothyroidism. Take on empty stomach 30–60 min before breakfast.',
    commonSideEffects: ['Hair loss initially', 'Insomnia', 'Nervousness', 'Increased appetite'],
    seriousSideEffects: ['Chest pain', 'Irregular heartbeat', 'Bone loss with overtreatment'],
    interactions: ['Calcium supplements', 'Antacids', 'Iron', 'Cholestyramine'],
    storageInfo: 'Store at room temperature, away from light and moisture.',
    pregnancy: 'Essential during pregnancy; dose may need adjustment.',
  },
  amlodipine: {
    name: 'Amlodipine',
    genericName: 'amlodipine besylate',
    category: 'Calcium Channel Blocker / Antihypertensive',
    description: 'Treats high blood pressure and angina by relaxing blood vessels.',
    commonSideEffects: ['Swelling of ankles/feet', 'Flushing', 'Dizziness', 'Headache'],
    seriousSideEffects: ['Rapid/irregular heartbeat', 'Worsening chest pain'],
    interactions: ['Simvastatin', 'Cyclosporine', 'CYP3A4 inhibitors'],
    storageInfo: 'Store at room temperature.',
    pregnancy: 'Use with caution; consult your doctor.',
  },
  metoprolol: {
    name: 'Metoprolol',
    genericName: 'metoprolol tartrate / succinate',
    category: 'Beta Blocker',
    description: 'Treats high blood pressure, angina, and heart failure. Slows heart rate.',
    commonSideEffects: ['Fatigue', 'Dizziness', 'Cold hands/feet', 'Slow heartbeat'],
    seriousSideEffects: ['Severe bradycardia', 'Heart block', 'Worsening heart failure if stopped abruptly'],
    interactions: ['Verapamil', 'Diltiazem', 'Clonidine', 'MAOIs'],
    storageInfo: 'Store at room temperature.',
    pregnancy: 'Generally considered safe; monitor fetus closely.',
  },
  aspirin: {
    name: 'Aspirin',
    genericName: 'acetylsalicylic acid',
    category: 'NSAID / Antiplatelet',
    description: 'Reduces pain, fever, inflammation, and prevents blood clots at low doses.',
    commonSideEffects: ['Stomach upset', 'Heartburn', 'Nausea'],
    seriousSideEffects: ['Gastrointestinal bleeding', 'Reye syndrome in children', 'Allergic reactions'],
    interactions: ['Warfarin', 'Ibuprofen', 'Methotrexate', 'NSAIDs'],
    storageInfo: 'Store in a cool, dry place.',
    pregnancy: 'Avoid in late pregnancy; low-dose use under medical supervision in early pregnancy.',
  },
  ibuprofen: {
    name: 'Ibuprofen',
    genericName: 'ibuprofen',
    category: 'NSAID',
    description: 'Relieves pain, reduces fever, and decreases inflammation.',
    commonSideEffects: ['Stomach upset', 'Nausea', 'Diarrhea', 'Dizziness'],
    seriousSideEffects: ['GI bleeding', 'Kidney damage', 'Cardiovascular events', 'Liver problems'],
    interactions: ['Warfarin', 'Aspirin', 'Lithium', 'ACE inhibitors', 'Methotrexate'],
    storageInfo: 'Store at room temperature.',
    pregnancy: 'Avoid after 20 weeks of pregnancy.',
  },
  amoxicillin: {
    name: 'Amoxicillin',
    genericName: 'amoxicillin',
    category: 'Antibiotic (Penicillin)',
    description: 'Treats bacterial infections of the ear, nose, throat, skin, and urinary tract.',
    commonSideEffects: ['Diarrhea', 'Stomach upset', 'Rash', 'Nausea'],
    seriousSideEffects: ['Severe allergic reaction (anaphylaxis)', 'C. difficile colitis', 'Liver problems'],
    interactions: ['Methotrexate', 'Oral contraceptives', 'Warfarin'],
    storageInfo: 'Store tablets at room temperature. Reconstituted liquid in refrigerator.',
    pregnancy: 'Generally safe during pregnancy.',
  },
};

export function checkInteractions(medications: string[]): DrugInteraction[] {
  const found: DrugInteraction[] = [];
  const normalized = medications.map(m => m.toLowerCase().trim());

  for (const interaction of DRUG_INTERACTIONS) {
    const d1 = interaction.drug1.toLowerCase();
    const d2 = interaction.drug2.toLowerCase();
    const hasD1 = normalized.some(m => m.includes(d1) || d1.includes(m));
    const hasD2 = normalized.some(m => m.includes(d2) || d2.includes(m));
    if (hasD1 && hasD2) {
      found.push(interaction);
    }
  }
  return found;
}

export function lookupDrug(name: string): DrugInfo | undefined {
  const key = name.toLowerCase().trim();
  return DRUG_DATABASE[key] || Object.values(DRUG_DATABASE).find(
    d => d.name.toLowerCase() === key || d.genericName?.toLowerCase() === key
  );
}
