// Artificial Analysis importer (Phase 4). Maps the AA models endpoint to
// botbrix benchmark results. Requires ARTIFICIAL_ANALYSIS_API_KEY.
//
// AA reports blended indices (intelligence/coding/math) on a 0-100 scale and
// individual evals on a 0-1 scale — this importer normalizes both to a
// percentage. Model names carry reasoning-effort suffixes like "(high)", so
// matching strips those and the lab prefix and keeps the best-scoring variant.

import type { BenchmarkResultView } from '../types.ts';
import { toResult, type BenchmarkMap } from './benchmarks.ts';

const AA_BASE = 'https://artificialanalysis.ai/api/v2';

export interface RawAAModel {
  id?: string;
  name?: string;
  slug?: string;
  model_creator?: { name?: string } | string;
  median_output_tokens_per_second?: number | null;
  median_time_to_first_token_seconds?: number | null;
  evaluations?: Record<string, number | null>;
}

// AA eval field -> botbrix benchmark slug. Order matters for aime fallback.
const FIELD_TO_SLUG: [string, string][] = [
  ['artificial_analysis_intelligence_index', 'aa_intelligence'],
  ['artificial_analysis_coding_index', 'aa_coding'],
  ['artificial_analysis_math_index', 'aa_math'],
  ['mmlu_pro', 'mmlu_pro'],
  ['gpqa', 'gpqa'],
  ['hle', 'hle'],
  ['livecodebench', 'livecodebench'],
  ['scicode', 'scicode'],
  ['math_500', 'math'],
  ['aime_25', 'aime'],
  ['aime', 'aime'],
  ['ifbench', 'ifbench'],
  ['terminalbench_v2_1', 'terminalbench'],
  ['terminalbench_hard', 'terminalbench'],
  ['tau2', 'tau2']
];

// Indices are already 0-100; per-eval fractions (0-1) scale up to a percentage.
function toPercent(field: string, value: number): number {
  const isIndex = field.startsWith('artificial_analysis_');
  const v = isIndex ? value : value <= 1 ? value * 100 : value;
  return Math.round(v * 10) / 10;
}

export function mapAAModel(raw: RawAAModel, now = new Date()): BenchmarkResultView[] {
  const evals = raw.evaluations ?? {};
  const seen = new Set<string>();
  const out: BenchmarkResultView[] = [];
  for (const [field, slug] of FIELD_TO_SLUG) {
    if (seen.has(slug)) continue; // first match wins (e.g. aime_25 before aime)
    const value = evals[field];
    if (typeof value === 'number' && Number.isFinite(value)) {
      seen.add(slug);
      out.push(
        toResult(
          {
            benchmarkSlug: slug,
            rawValue: toPercent(field, value),
            sourceName: 'Artificial Analysis',
            sourceUrl: 'https://artificialanalysis.ai/'
          },
          now
        )
      );
    }
  }
  return out;
}

/** Strip lab prefix ("OpenAI: ") and parentheticals ("(high)") for matching. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^[^:]+:\s*/, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export async function fetchAARaw(apiKey: string | undefined): Promise<RawAAModel[]> {
  if (!apiKey) {
    console.warn('[artificialAnalysis] no ARTIFICIAL_ANALYSIS_API_KEY — skipping.');
    return [];
  }
  const res = await fetch(`${AA_BASE}/data/llms/models`, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`Artificial Analysis HTTP ${res.status}`);
  const body = await res.json();
  return (body?.data ?? body?.models ?? []) as RawAAModel[];
}

/** Build a benchmark map keyed by our model slug. For each of our models, find
 * AA entries with the same normalized base name and keep the best variant
 * (highest intelligence index → most capable configuration). */
export function buildAAMap(
  rawList: RawAAModel[],
  ourModels: { slug: string; name: string }[],
  now = new Date()
): BenchmarkMap {
  const bestByBase = new Map<string, RawAAModel>();
  for (const m of rawList) {
    if (!m.name) continue;
    const base = normalizeName(m.name);
    const idx = m.evaluations?.artificial_analysis_intelligence_index ?? -1;
    const cur = bestByBase.get(base);
    const curIdx = cur?.evaluations?.artificial_analysis_intelligence_index ?? -1;
    if (!cur || idx > curIdx) bestByBase.set(base, m);
  }

  const map: BenchmarkMap = {};
  for (const model of ourModels) {
    const entry = bestByBase.get(normalizeName(model.name));
    if (!entry) continue;
    const results = mapAAModel(entry, now);
    if (results.length) map[model.slug] = results;
  }
  return map;
}
