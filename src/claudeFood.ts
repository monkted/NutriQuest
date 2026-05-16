import { ANTHROPIC_API_KEY } from './config';

export interface FoodAnalysis {
  name:     string;
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
  fiber:    number;
  vitamins: number;
  minerals: number;
}

// ─── AI Photo Analysis ────────────────────────────────────────────────────────

export async function analyzeImageWithClaude(base64: string): Promise<FoodAnalysis> {
  if (!ANTHROPIC_API_KEY) throw new Error('API_KEY_NOT_SET');

  // Strip data URL prefix if present (e.g. "data:image/png;base64,...")
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  let cleanBase64 = base64;
  const dataUrlMatch = base64.match(/^data:(image\/[a-z+]+);base64,(.+)$/s);
  if (dataUrlMatch) {
    mediaType = dataUrlMatch[1] as typeof mediaType;
    cleanBase64 = dataUrlMatch[2];
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':            'application/json',
      'x-api-key':               ANTHROPIC_API_KEY,
      'anthropic-version':       '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mediaType, data: cleanBase64 },
          },
          {
            type: 'text',
            text: `Analyze this food image. Identify what food is shown and estimate its nutritional content for one typical serving.
Return ONLY a JSON object — no explanation, no markdown:
{"name":"food name","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"vitamins":number,"minerals":number}
vitamins and minerals are estimated % Daily Value as whole numbers (0–100).`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = (data.content?.[0]?.text ?? '').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Bad response format');
  return JSON.parse(match[0]) as FoodAnalysis;
}

// ─── Barcode Lookup (Open Food Facts) ────────────────────────────────────────

export async function lookupBarcode(barcode: string): Promise<FoodAnalysis | null> {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};

    // Prefer per-serving values when available
    const hasServing = n['energy-kcal_serving'] != null;
    const label      = hasServing
      ? (p.serving_size ? ` (${p.serving_size})` : '')
      : ' (per 100g)';

    const get = (key: string) =>
      Math.round(Number(hasServing ? n[`${key}_serving`] : n[`${key}_100g`]) || 0);

    return {
      name:     (p.product_name || p.product_name_en || 'Unknown Product') + label,
      calories: Math.round(Number(hasServing ? n['energy-kcal_serving'] : n['energy-kcal_100g']) || 0),
      protein:  get('proteins'),
      carbs:    get('carbohydrates'),
      fat:      get('fat'),
      fiber:    get('fiber'),
      vitamins: 0,
      minerals: 0,
    };
  } catch {
    return null;
  }
}
