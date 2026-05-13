import { File } from 'expo-file-system';
import { copyAsync, cacheDirectory } from 'expo-file-system/legacy';
import type { ScannedPrescription } from '../types';

const LM_STUDIO_URL = process.env.EXPO_PUBLIC_LOCAL_LLM_URL ?? 'http://localhost:1234';
const LM_STUDIO_MODEL = process.env.EXPO_PUBLIC_LOCAL_LLM_MODEL ?? 'qwen2.5-vl-7b-instruct';

const EXTRACTION_PROMPT = `You are a medical prescription parser. Extract the following information from this prescription image and return it as valid JSON only (no markdown, no explanation):

{
  "medicationName": "brand name of medication or null",
  "genericName": "generic/scientific name or null",
  "dosage": "numeric dosage value or null (e.g., 500)",
  "unit": "unit like mg, ml, mcg or null",
  "instructions": "how to take the medication or null",
  "prescribedBy": "doctor name or null",
  "pharmacy": "pharmacy name or null",
  "rxNumber": "Rx number or null",
  "refills": "number of refills or null",
  "quantity": "quantity dispensed or null",
  "confidence": 0.0 to 1.0 confidence score
}

If you cannot read the prescription clearly, set confidence below 0.5. Return ONLY the JSON object.`;

async function toBase64(imageUri: string): Promise<string> {
  let uri = imageUri;

  // Android photo picker returns content:// URIs which the new File API cannot
  // read directly. Copy to the app cache first using the legacy API which
  // handles content resolver under the hood.
  if (uri.startsWith('content://')) {
    const ext = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const dest = `${cacheDirectory}scan_temp_${Date.now()}.${ext}`;
    await copyAsync({ from: uri, to: dest });
    uri = dest;
  }

  const file = new File(uri);
  return await file.base64();
}

function stripCodeFence(text: string): string {
  // Local models often wrap JSON in ```json ... ``` — strip it before parsing.
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

export async function scanPrescription(imageUri: string): Promise<ScannedPrescription> {
  const base64 = await toBase64(imageUri);
  const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

  const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LM_STUDIO_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let detail = errorBody;
    try {
      const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
      detail = parsed?.error?.message ?? errorBody;
    } catch { /* keep raw text */ }
    throw new Error(
      `LM Studio error (${response.status}): ${detail}\n\nMake sure LM Studio is running with a vision model loaded at ${LM_STUDIO_URL}`
    );
  }

  const result = await response.json() as {
    choices?: { message?: { content?: string } }[];
  };

  const text = result?.choices?.[0]?.message?.content ?? '';
  if (!text) {
    throw new Error(
      'LM Studio returned an empty response. Make sure a vision-capable model (e.g. Qwen2.5-VL-7B) is loaded.'
    );
  }

  const cleaned = stripCodeFence(text);

  try {
    const parsed = JSON.parse(cleaned) as ScannedPrescription;
    parsed.rawText = cleaned;
    if (parsed.medicationName) parsed.medicationName = parsed.medicationName.replace(/[®™]/g, '').trim();
    if (parsed.genericName) parsed.genericName = parsed.genericName.replace(/[®™]/g, '').trim();
    return parsed;
  } catch (parseErr) {
    throw new Error(
      `Could not parse model response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}\n\nRaw: ${text.slice(0, 300)}`
    );
  }
}
