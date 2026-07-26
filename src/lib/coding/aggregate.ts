// Per-language coding aggregation. Takes standardized rows
// [{ model, language, benchmark, score(0-100) }] from any results source and
// produces one composite score per (model, language), then a leaderboard per
// language.
//
// Default aggregation is a raw "competence" scale: our benchmarks are already
// 0-100 pass-rate-like signals, so the composite is a weighted average of the
// raw scores and a single-benchmark model shows its measured value 1:1
// (MultiPL-E pass@1 87% stays 87, an SWE-bench resolve rate stays as-is, an
// estimate stays as-is). The benchmark label travels with every row, so a
// reader always sees which test produced a number.
//
// A z-score mode exists but is OFF by default. Our benchmarks cover DISJOINT
// model populations (mostly open models on MultiPL-E, frontier agents on
// SWE-bench, estimates for current models) with almost no per-(model,language)
// overlap, so per-benchmark z-scores measure "rank within your own field"
// rather than absolute skill — which inverts real orderings (a small model
// topping a weak field outscoring a frontier model topping a strong one).
// Without shared anchor models the two scales cannot be equated statistically,
// so we do not pretend to and show the honest raw numbers instead.

import { canonicalLanguage } from './languages.ts';

export interface RawCodingRow {
  model: string;
  language: string;
  benchmark: string;
  score: number | null | undefined; // expected 0-100
  isEstimated?: boolean;
}

export interface CodingScoreRow {
  model: string;
  language: string; // canonical
  benchmark: string; // canonical key
  score: number; // 0-100
  isEstimated: boolean;
}

export type BenchmarkWeights = Record<string, number>;

// Default weighting (spec): SWE-bench 50%, McEval 30%, MultiPL-E 20%.
export const DEFAULT_WEIGHTS: BenchmarkWeights = {
  'swe-bench-multilingual': 0.5,
  mceval: 0.3,
  'multipl-e': 0.2
};

export type AggregationMode = 'weighted' | 'zscore';

export interface LanguageEntry {
  model: string;
  score: number; // composite 0-100
  benchmarks: Record<string, number>; // raw per-benchmark scores
  isEstimated: boolean; // true when the entry rests only on estimated inputs
}

export type LanguageLeaderboard = Record<string, LanguageEntry[]>;

export interface AggregateResult {
  meta: {
    generatedAt: string;
    mode: AggregationMode;
    weights: BenchmarkWeights;
    rowCount: number;
    skipped: number;
    languages: string[];
    models: string[];
    benchmarks: string[];
  };
  leaderboard: LanguageLeaderboard;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Normalize a benchmark label to a stable key used for weighting. */
export function canonicalBenchmark(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (/swe.?bench/.test(k)) return 'swe-bench-multilingual';
  if (/mceval/.test(k)) return 'mceval';
  if (/multipl|multiple|humaneval|mbpp/.test(k)) return 'multipl-e';
  return k;
}

/** Clean + canonicalize raw rows; drop rows with unknown language or invalid
 * score (counted, never thrown). */
export function standardizeRows(raw: RawCodingRow[]): { rows: CodingScoreRow[]; skipped: number } {
  const rows: CodingScoreRow[] = [];
  let skipped = 0;
  for (const r of raw) {
    const language = canonicalLanguage(r.language ?? '');
    const score = typeof r.score === 'number' && Number.isFinite(r.score) ? r.score : null;
    if (!language || !r.model || score == null) {
      skipped++;
      continue;
    }
    rows.push({
      model: r.model.trim(),
      language,
      benchmark: canonicalBenchmark(r.benchmark ?? 'unknown'),
      // Accept 0-1 fractions or 0-100 percentages transparently.
      score: clamp(score <= 1 ? score * 100 : score),
      isEstimated: Boolean(r.isEstimated)
    });
  }
  return { rows, skipped };
}

function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}
function std(a: number[], mu: number): number {
  return a.length ? Math.sqrt(mean(a.map((v) => (v - mu) ** 2))) : 0;
}

export function computeLanguageLeaderboards(
  raw: RawCodingRow[],
  opts: { mode?: AggregationMode; weights?: BenchmarkWeights } = {}
): AggregateResult {
  const mode = opts.mode ?? 'weighted';
  const weights = opts.weights ?? DEFAULT_WEIGHTS;
  const { rows, skipped } = standardizeRows(raw);

  // Per (language, benchmark) population stats for z-score normalization.
  const statKey = (lang: string, bench: string) => `${lang}::${bench}`;
  const buckets: Record<string, number[]> = {};
  for (const r of rows) (buckets[statKey(r.language, r.benchmark)] ??= []).push(r.score);
  const stats: Record<string, { mean: number; std: number }> = {};
  for (const [k, arr] of Object.entries(buckets)) {
    const mu = mean(arr);
    stats[k] = { mean: mu, std: std(arr, mu) };
  }

  const qualityOf = (r: CodingScoreRow): number => {
    // Default: raw competence — the measured percentage IS the score.
    if (mode === 'weighted') return r.score;
    // Opt-in z-score (see file header for why it is not the default).
    const st = stats[statKey(r.language, r.benchmark)];
    if (!st || st.std === 0) return 50; // single data point / no spread → neutral
    return clamp(50 + 15 * ((r.score - st.mean) / st.std));
  };

  // Group: language → model → benchmark → { raw, quality, estimated }
  type Cell = { raw: number; quality: number; estimated: boolean };
  const grouped: Record<string, Record<string, Record<string, Cell>>> = {};
  for (const r of rows) {
    ((grouped[r.language] ??= {})[r.model] ??= {})[r.benchmark] = {
      raw: r.score,
      quality: qualityOf(r),
      estimated: r.isEstimated
    };
  }

  const leaderboard: LanguageLeaderboard = {};
  for (const [language, byModel] of Object.entries(grouped)) {
    const entries: LanguageEntry[] = [];
    for (const [model, byBench] of Object.entries(byModel)) {
      let wSum = 0;
      let acc = 0;
      const benchmarks: Record<string, number> = {};
      const cells = Object.entries(byBench);
      for (const [bench, cell] of cells) {
        const w = weights[bench] ?? 0.2; // unknown benchmark → modest weight
        acc += w * cell.quality;
        wSum += w;
        benchmarks[bench] = Math.round(cell.raw * 10) / 10;
      }
      if (wSum === 0) continue;
      // Estimated only when every contributing benchmark is an estimate.
      const isEstimated = cells.every(([, c]) => c.estimated);
      entries.push({ model, score: Math.round((acc / wSum) * 10) / 10, benchmarks, isEstimated });
    }
    entries.sort((a, b) => b.score - a.score);
    leaderboard[language] = entries;
  }

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      mode,
      weights,
      rowCount: rows.length,
      skipped,
      languages: Object.keys(leaderboard).sort(),
      models: [...new Set(rows.map((r) => r.model))].sort(),
      benchmarks: [...new Set(rows.map((r) => r.benchmark))].sort()
    },
    leaderboard
  };
}

export interface CurrentModel {
  name: string;
  coding: number; // overall coding ability baseline, 0-100 (e.g. AA coding index)
}

/** Estimate per-language scores for CURRENT models that lack real per-language
 * data. Method: take the model's overall coding ability and add a per-language
 * "difficulty offset" derived from the real data (how far each language sits
 * from a model's own average). Every produced row is flagged isEstimated. */
export function estimateRows(realRaw: RawCodingRow[], models: CurrentModel[]): RawCodingRow[] {
  const { rows } = standardizeRows(realRaw);

  const byModel: Record<string, Record<string, number[]>> = {};
  for (const r of rows) ((byModel[r.model] ??= {})[r.language] ??= []).push(r.score);

  const offAcc: Record<string, number> = {};
  const offN: Record<string, number> = {};
  for (const langs of Object.values(byModel)) {
    const perLang = Object.entries(langs).map(([l, arr]) => [l, mean(arr)] as [string, number]);
    if (perLang.length < 2) continue;
    const mu = mean(perLang.map(([, v]) => v));
    for (const [l, v] of perLang) {
      offAcc[l] = (offAcc[l] ?? 0) + (v - mu);
      offN[l] = (offN[l] ?? 0) + 1;
    }
  }
  const offset: Record<string, number> = {};
  for (const l of Object.keys(offAcc)) offset[l] = offAcc[l] / offN[l];

  const realPairs = new Set(rows.map((r) => `${r.model}::${r.language}`));

  const out: RawCodingRow[] = [];
  for (const m of models) {
    if (!Number.isFinite(m.coding)) continue;
    for (const [lang, off] of Object.entries(offset)) {
      if (realPairs.has(`${m.name}::${lang}`)) continue;
      out.push({ model: m.name, language: lang, benchmark: 'estimated', score: clamp(m.coding + off), isEstimated: true });
    }
  }
  return out;
}
