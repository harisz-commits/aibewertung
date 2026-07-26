// Per-language coding aggregation. Takes standardized rows
// [{ model, language, benchmark, score(0-100) }] from any results source and
// produces one composite score per (model, language), then a leaderboard per
// language. Because benchmarks differ hugely in difficulty (SWE-bench ≪
// MultiPL-E), scores are either z-score normalized per (language, benchmark)
// before averaging, or combined with an explicit weighted average.

import { canonicalLanguage } from './languages.ts';

export interface RawCodingRow {
  model: string;
  language: string;
  benchmark: string;
  score: number | null | undefined; // expected 0-100
}

export interface CodingScoreRow {
  model: string;
  language: string; // canonical
  benchmark: string; // canonical key
  score: number; // 0-100
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
      score: clamp(score <= 1 ? score * 100 : score)
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
  const mode = opts.mode ?? 'zscore';
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
    if (mode === 'weighted') return r.score;
    const st = stats[statKey(r.language, r.benchmark)];
    if (!st || st.std === 0) return 50; // single data point / no spread → neutral
    return clamp(50 + 15 * ((r.score - st.mean) / st.std));
  };

  // Group: language → model → benchmark → { raw, quality }
  type Cell = { raw: number; quality: number };
  const grouped: Record<string, Record<string, Record<string, Cell>>> = {};
  for (const r of rows) {
    ((grouped[r.language] ??= {})[r.model] ??= {})[r.benchmark] = { raw: r.score, quality: qualityOf(r) };
  }

  const leaderboard: LanguageLeaderboard = {};
  for (const [language, byModel] of Object.entries(grouped)) {
    const entries: LanguageEntry[] = [];
    for (const [model, byBench] of Object.entries(byModel)) {
      let wSum = 0;
      let acc = 0;
      const benchmarks: Record<string, number> = {};
      for (const [bench, cell] of Object.entries(byBench)) {
        const w = weights[bench] ?? 0.2; // unknown benchmark → modest weight
        acc += w * cell.quality;
        wSum += w;
        benchmarks[bench] = Math.round(cell.raw * 10) / 10;
      }
      if (wSum === 0) continue;
      entries.push({ model, score: Math.round((acc / wSum) * 10) / 10, benchmarks });
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
