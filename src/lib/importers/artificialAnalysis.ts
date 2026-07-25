// Artificial Analysis importer (Phase 4). Maps the AA model endpoint payload to
// botbrix benchmark results. Requires ARTIFICIAL_ANALYSIS_API_KEY.
//
// AA exposes a blended "Intelligence Index" plus component evals. Field names
// below reflect the documented shape; adjust to the exact API version in use.
// Pure mapper + a key-gated fetch that returns {} when no key is present, so
// the pipeline degrades gracefully instead of inventing data.

import type { BenchmarkResultView } from '../types.ts';
import { toResult, type BenchmarkMap } from './benchmarks.ts';

const AA_BASE = 'https://artificialanalysis.ai/api/v2';

export interface RawAAModel {
  slug?: string;
  name?: string;
  evaluations?: {
    artificial_analysis_intelligence_index?: number;
    mmlu_pro?: number;
    gpqa?: number;
    humaneval?: number;
    livecodebench?: number;
    swe_bench_verified?: number;
    math_500?: number;
    aime?: number;
    mmmu?: number;
  };
}

const FIELD_TO_SLUG: [keyof NonNullable<RawAAModel['evaluations']>, string][] = [
  ['artificial_analysis_intelligence_index', 'aa_intelligence'],
  ['mmlu_pro', 'mmlu_pro'],
  ['gpqa', 'gpqa'],
  ['humaneval', 'humaneval'],
  ['livecodebench', 'livecodebench'],
  ['swe_bench_verified', 'swebench_verified'],
  ['math_500', 'math'],
  ['aime', 'aime'],
  ['mmmu', 'mmmu']
];

export function mapAAModel(raw: RawAAModel, now = new Date()): BenchmarkResultView[] {
  const evals = raw.evaluations ?? {};
  const out: BenchmarkResultView[] = [];
  for (const [field, slug] of FIELD_TO_SLUG) {
    const value = evals[field];
    if (typeof value === 'number') {
      out.push(
        toResult(
          {
            benchmarkSlug: slug,
            // AA reports 0-1 for many evals; scale to percentage where needed.
            rawValue: value <= 1 ? Math.round(value * 1000) / 10 : value,
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

/** Fetch AA data and return a benchmark map keyed by our model slug.
 * Returns {} (and logs) when the API key is missing. Matching AA slugs to
 * botbrix slugs is the caller's responsibility (see scripts/import-benchmarks). */
export async function fetchArtificialAnalysis(
  apiKey: string | undefined,
  matchSlug: (aa: RawAAModel) => string | null,
  now = new Date()
): Promise<BenchmarkMap> {
  if (!apiKey) {
    console.warn('[artificialAnalysis] no ARTIFICIAL_ANALYSIS_API_KEY — skipping.');
    return {};
  }
  const res = await fetch(`${AA_BASE}/data/llms/models`, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`Artificial Analysis HTTP ${res.status}`);
  const body = await res.json();
  const rows: RawAAModel[] = body?.data ?? body?.models ?? [];

  const map: BenchmarkMap = {};
  for (const row of rows) {
    const slug = matchSlug(row);
    if (!slug) continue;
    const results = mapAAModel(row, now);
    if (results.length) map[slug] = results;
  }
  return map;
}
