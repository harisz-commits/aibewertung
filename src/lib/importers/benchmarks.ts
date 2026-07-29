// Generic benchmark utilities (pure; safe in both Next and Node scripts).
// Normalization maps each benchmark's native scale onto a 0-100 axis so that
// heterogeneous tests (percent, Elo, dollars) can be compared and blended.

import type { BenchmarkResultView } from '../types.ts';
import { BENCHMARKS_BY_SLUG } from '../benchmarks.ts';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Map a raw benchmark value to 0-100. Returns null when we cannot normalize. */
export function normalizeBenchmarkValue(slug: string, raw: number | null): number | null {
  if (raw == null) return null;
  const def = BENCHMARKS_BY_SLUG[slug];
  if (!def) return null;

  switch (def.unit) {
    case '%':
    case 'pass@1':
    case 'index':
      return clamp(raw);
    case 'Elo':
      // Chatbot Arena Elo roughly spans ~1000 (weak) to ~1500 (frontier).
      return clamp(((raw - 1000) / 500) * 100);
    default:
      // Open-ended units (e.g. "$ net worth") are shown raw, not normalized.
      return null;
  }
}

export interface BenchmarkInput {
  benchmarkSlug: string;
  rawValue: number | null;
  isEstimated?: boolean;
  isDisputed?: boolean;
  notes?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  lastCheckedAt?: string | null;
}

export function toResult(input: BenchmarkInput, now = new Date()): BenchmarkResultView {
  return {
    benchmarkSlug: input.benchmarkSlug,
    rawValue: input.rawValue,
    normalized: normalizeBenchmarkValue(input.benchmarkSlug, input.rawValue),
    isEstimated: input.isEstimated ?? false,
    isDisputed: input.isDisputed ?? false,
    notes: input.notes ?? null,
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    lastCheckedAt: input.lastCheckedAt ?? now.toISOString()
  };
}

/** A benchmark map keyed by model slug → its measured results. */
export type BenchmarkMap = Record<string, BenchmarkResultView[]>;

export function attachBenchmarks<T extends { slug: string; benchmarks?: BenchmarkResultView[] }>(
  models: T[],
  map: BenchmarkMap
): T[] {
  return models.map((m) => (map[m.slug] ? { ...m, benchmarks: map[m.slug] } : m));
}

/** Average of the normalized intelligence/reasoning/coding/math benchmarks -
 * the measured counterpart to the scoring engine's structural quality proxy. */
export function benchmarkQuality(benchmarks: BenchmarkResultView[] | undefined): number | null {
  if (!benchmarks || benchmarks.length === 0) return null;
  const qualityGroups = new Set(['intelligence', 'reasoning', 'coding', 'math']);
  const vals = benchmarks
    .filter((b) => {
      const def = BENCHMARKS_BY_SLUG[b.benchmarkSlug];
      return def && qualityGroups.has(def.groupSlug) && b.normalized != null;
    })
    .map((b) => b.normalized as number);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
