// Benchmark composite (Phase 4). Turns heterogeneous measured benchmarks into a
// single 0-100 "measured quality" via z-score standardization + domain weights,
// so tests on different scales/difficulties (GPQA vs MMLU-Pro vs Elo) become
// comparable. This composite feeds the scoring engine's quality component.
//
// Missing data is handled by renormalizing the weights over the domains that
// are actually present for a model (rather than zero-filling absent domains).

import type { BenchmarkResultView } from '../types.ts';

export interface DomainSpec {
  weight: number;
  benchmarks: string[];
}

// Domain weights (sum = 1.0). Configurable in one place.
export const DOMAINS: Record<string, DomainSpec> = {
  reasoning: { weight: 0.25, benchmarks: ['gpqa', 'hle'] },
  coding: { weight: 0.25, benchmarks: ['livecodebench', 'scicode', 'aa_coding', 'swebench_verified'] },
  agentic: { weight: 0.2, benchmarks: ['terminalbench', 'ifbench', 'tau2', 'bfcl'] },
  math: { weight: 0.15, benchmarks: ['math', 'aime', 'aa_math'] },
  knowledge: { weight: 0.15, benchmarks: ['mmlu_pro', 'simpleqa', 'mmmu'] }
};

// Benchmarks that are themselves cross-domain blends — excluded from the
// composite to avoid double counting (still shown to users as their own row).
const EXCLUDE = new Set(['aa_intelligence']);

export interface BenchStat {
  mean: number;
  std: number;
  n: number;
}

type WithBench = { benchmarks?: BenchmarkResultView[] };

/** Population mean/std per benchmark slug across all models that have it. */
export function benchmarkStats(models: WithBench[]): Record<string, BenchStat> {
  const values: Record<string, number[]> = {};
  for (const m of models) {
    for (const b of m.benchmarks ?? []) {
      if (EXCLUDE.has(b.benchmarkSlug) || b.rawValue == null) continue;
      (values[b.benchmarkSlug] ??= []).push(b.rawValue);
    }
  }
  const stats: Record<string, BenchStat> = {};
  for (const [slug, arr] of Object.entries(values)) {
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b, 0) / n;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    stats[slug] = { mean, std: Math.sqrt(variance), n };
  }
  return stats;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Map a z-score to 0-100 quality points: population average → 50, ±1σ → 65/35.
function zToQuality(z: number): number {
  return clamp(50 + 15 * z);
}

/** Domain-weighted composite for one model, or null if it has no usable
 * benchmarks. Weights are renormalized over present domains. */
export function compositeFor(
  benchmarks: BenchmarkResultView[] | undefined,
  stats: Record<string, BenchStat>
): number | null {
  if (!benchmarks || benchmarks.length === 0) return null;
  const bySlug = new Map(benchmarks.filter((b) => b.rawValue != null).map((b) => [b.benchmarkSlug, b.rawValue as number]));

  let weightedSum = 0;
  let weightUsed = 0;
  for (const spec of Object.values(DOMAINS)) {
    const qs: number[] = [];
    for (const slug of spec.benchmarks) {
      const v = bySlug.get(slug);
      const st = stats[slug];
      if (v == null || !st || st.n < 2 || st.std === 0) continue;
      qs.push(zToQuality((v - st.mean) / st.std));
    }
    if (qs.length === 0) continue;
    const domainScore = qs.reduce((a, b) => a + b, 0) / qs.length;
    weightedSum += domainScore * spec.weight;
    weightUsed += spec.weight;
  }

  if (weightUsed === 0) return null;
  return Math.round((weightedSum / weightUsed) * 10) / 10;
}
