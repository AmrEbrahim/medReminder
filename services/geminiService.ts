import { File } from 'expo-file-system';
import { copyAsync, cacheDirectory } from 'expo-file-system/legacy';
import type { ScannedPrescription } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  // Use the new File API — works in both Expo Go and bare workflow for
  // file:// URIs (which is what both expo-camera and the copied cache file give us).
  const file = new File(uri);
  return await file.base64();
}

export async function scanPrescription(imageUri: string): Promise<ScannedPrescription> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Please add your key to the .env file.');
  }

  const base64 = await toBase64(imageUri);
  const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let detail = errorBody;
    try {
      const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
      detail = parsed?.error?.message ?? errorBody;
    } catch { /* keep raw text */ }
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded: ${detail}\n\nTry again in a moment. If this persists, check your quota at aistudio.google.com.`);
    }
    throw new Error(`Gemini API error (${response.status}): ${detail}`);
  }

  const result = await response.json() as {
    candidates?: { content?: { parts?: { thought?: boolean; text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  const candidate = result?.candidates?.[0];
  if (!candidate) {
    const blockReason = result?.promptFeedback?.blockReason;
    throw new Error(blockReason
      ? `Request blocked by Gemini: ${blockReason}`
      : 'Gemini returned no candidates. The image may be unreadable.');
  }

  const parts = candidate?.content?.parts ?? [];
  const textPart = parts.find((p: { thought?: boolean; text?: string }) => !p.thought && p.text);
  const text: string = textPart?.text ?? '';
  if (!text) {
    throw new Error('Gemini returned an empty response. Try a clearer photo.');
  }

  try {
    const parsed = JSON.parse(text) as ScannedPrescription;
    parsed.rawText = text;
    return parsed;
  } catch (parseErr) {
    throw new Error(
      `Could not parse Gemini response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}\n\nRaw: ${text.slice(0, 300)}`
    );
  }
}
