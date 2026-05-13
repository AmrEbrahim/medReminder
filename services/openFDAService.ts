import type { DrugInteraction } from '../types';

const OPENFDA_LABEL_URL = 'https://api.fda.gov/drug/label.json';

// Persist cache across calls within the app session
const labelCache = new Map<string, string | null>();

async function fetchInteractionText(drugName: string): Promise<string | null> {
  const key = drugName.toLowerCase().trim();
  if (labelCache.has(key)) return labelCache.get(key) ?? null;

  const trySearch = async (field: string): Promise<string | null> => {
    try {
      const url = `${OPENFDA_LABEL_URL}?search=${field}:"${encodeURIComponent(key)}"&limit=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as { results?: Array<{ drug_interactions?: string[] }> };
      return data.results?.[0]?.drug_interactions?.join(' ') || null;
    } catch {
      return null;
    }
  };

  const text =
    (await trySearch('openfda.generic_name')) ??
    (await trySearch('openfda.brand_name'));

  labelCache.set(key, text);
  return text;
}

function inferSeverity(text: string): 'mild' | 'moderate' | 'severe' {
  const t = text.toLowerCase();
  if (/contraindicated|avoid combination|do not (use|administer)|fatal|life.threatening/.test(t))
    return 'severe';
  if (/caution|monitor|reduce|adjust dose|risk of|may (increase|decrease|affect)|should not/.test(t))
    return 'moderate';
  return 'mild';
}

function extractRelevantSentence(interactionText: string, otherDrug: string): string {
  const sentences = interactionText.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s => s.toLowerCase().includes(otherDrug.toLowerCase()));
  return (match ?? sentences[0] ?? interactionText).trim().slice(0, 300);
}

export async function checkInteractionsOpenFDA(medications: string[]): Promise<DrugInteraction[]> {
  if (medications.length < 2) return [];

  const results: DrugInteraction[] = [];
  const seen = new Set<string>();

  for (const drug1 of medications) {
    const text = await fetchInteractionText(drug1);
    if (!text) continue;

    for (const drug2 of medications) {
      if (drug1 === drug2) continue;
      const pairKey = [drug1.toLowerCase(), drug2.toLowerCase()].sort().join('||');
      if (seen.has(pairKey)) continue;

      if (text.toLowerCase().includes(drug2.toLowerCase())) {
        seen.add(pairKey);
        const description = extractRelevantSentence(text, drug2);
        results.push({
          drug1,
          drug2,
          severity: inferSeverity(description),
          description,
        });
      }
    }
  }

  return results;
}

export function mergeInteractions(
  local: DrugInteraction[],
  fda: DrugInteraction[],
): DrugInteraction[] {
  const merged = [...local];
  for (const fdaItem of fda) {
    const isDuplicate = merged.some(
      l =>
        (l.drug1.toLowerCase() === fdaItem.drug1.toLowerCase() &&
          l.drug2.toLowerCase() === fdaItem.drug2.toLowerCase()) ||
        (l.drug1.toLowerCase() === fdaItem.drug2.toLowerCase() &&
          l.drug2.toLowerCase() === fdaItem.drug1.toLowerCase()),
    );
    if (!isDuplicate) merged.push(fdaItem);
  }
  return merged;
}
