// Deterministic, rule-based scoring engine (0-100). No randomness, no LLM.
// Written explanations may be LLM-generated elsewhere, but every NUMBER here
// comes from explicit, auditable formulas over structured signals.
//
// NOTE (methodology, honest): until dedicated benchmark importers land
// (Phase 4), the "quality" component is a capability PROXY derived from
// structure (context, features, reasoning, recency, modality), not measured
// benchmark scores. Snapshots therefore flag scoresEstimated = true.

import type { ImportedModel, } from '../importers/openrouter.ts';
import type { Scores } from '../types.ts';

export const SCORE_VERSION = 'v1-heuristic-2026.07';

// Overall-score weighting (spec §9). Sums to 1.0. Configurable in code.
export const OVERALL_WEIGHTS = {
  quality: 0.30,
  pricePerformance: 0.20,
  speed: 0.15,
  features: 0.15,
  availability: 0.10,
  trust: 0.10
} as const;

// Labs with strong multilingual / German handling (proxy until benchmarks).
const MULTILINGUAL_LAB: Record<string, number> = {
  openai: 90,
  anthropic: 88,
  google: 90,
  'google-deepmind': 90,
  mistralai: 85,
  cohere: 85,
  meta: 78,
  'meta-llama': 78,
  qwen: 80,
  deepseek: 72,
  'x-ai': 80,
  microsoft: 80
};

const FRONTIER_LAB = new Set([
  'openai',
  'anthropic',
  'google',
  'google-deepmind',
  'x-ai',
  'meta',
  'meta-llama',
  'mistralai',
  'deepseek',
  'qwen'
]);

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Map a value in [min,max] (log space) to 0..100. */
function logScale(value: number | null | undefined, min: number, max: number): number {
  if (value == null || value <= 0) return 0;
  const lo = Math.log(min);
  const hi = Math.log(max);
  return clamp(((Math.log(value) - lo) / (hi - lo)) * 100);
}

/** Cheapness: cheaper output price → higher score (log scale, inverted). */
function priceCheapness(outputPer1m: number | null): number {
  if (outputPer1m == null) return 55; // unknown → neutral
  if (outputPer1m <= 0) return 100; // free
  // $0.05/1M → ~100, $75/1M → ~0
  return clamp(100 - logScale(outputPer1m, 0.05, 75));
}

function featureCoverage(m: ImportedModel): number {
  const f = m.features;
  const flags = [
    f.tools,
    f.jsonMode,
    f.structuredOutput,
    f.vision,
    f.reasoning,
    f.streaming,
    f.audio,
    f.localDeployment
  ];
  const present = flags.filter(Boolean).length;
  return clamp((present / flags.length) * 100);
}

function recencyScore(releaseIso: string | null, now: Date): number {
  if (!releaseIso) return 50;
  const ageDays = (now.getTime() - new Date(releaseIso).getTime()) / (24 * 3600 * 1000);
  if (ageDays <= 0) return 100;
  // Linear decay to ~0 over 540 days (~18 months).
  return clamp(100 - (ageDays / 540) * 100);
}

export function qualityProxy(m: ImportedModel, now: Date): number {
  const ctx = logScale(m.contextWindow, 4000, 1_000_000);
  const feat = featureCoverage(m);
  const reasoning = m.features.reasoning ? 100 : 55;
  const modality = clamp(40 + (m.features.vision ? 30 : 0) + (m.features.audio ? 20 : 0) + (m.inputModalities.includes('file') ? 10 : 0));
  const recency = recencyScore(m.releaseDate, now);
  const frontier = FRONTIER_LAB.has(m.labSlug) ? 85 : 60;
  const availability = logScale(m.providerCount, 1, 20);

  return clamp(
    0.20 * ctx +
      0.20 * feat +
      0.15 * reasoning +
      0.10 * modality +
      0.15 * recency +
      0.10 * frontier +
      0.10 * availability
  );
}

function speedProxy(m: ImportedModel): number {
  // No reliable throughput yet: cheaper + smaller models tend to be faster.
  const cheap = priceCheapness(m.cheapestOutputPer1m);
  const small = m.parameterCount && /(\b[1-9]b|1[0-9]b|2[0-9]b)\b/i.test(m.parameterCount) ? 80 : 55;
  const nonReasoning = m.features.reasoning ? 45 : 70; // reasoning models are slower
  return clamp(0.45 * cheap + 0.25 * small + 0.30 * nonReasoning);
}

function availabilityScore(m: ImportedModel): number {
  const count = logScale(m.providerCount, 1, 20);
  const uptimes = m.providers.map((p) => p.uptime30m).filter((n): n is number => n != null);
  const up = uptimes.length ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length : 80;
  return clamp(0.6 * count + 0.4 * up);
}

function trustScore(m: ImportedModel): number {
  const hasOfficial = m.sources.some((s) => s.reliability === 'official');
  const nSources = m.sources.length;
  return clamp(
    (hasOfficial ? 55 : 40) + Math.min(nSources, 4) * 8 + (m.isVerified ? 15 : 0)
  );
}

function multilingualSignal(m: ImportedModel): number {
  return MULTILINGUAL_LAB[m.labSlug] ?? (m.isOpenWeight ? 65 : 60);
}

// Measured speed score from AA throughput (tok/s) + time-to-first-token (ms).
// Returns null when no measurement is available (caller falls back to proxy).
function measuredSpeedScore(tps?: number | null, ttftMs?: number | null): number | null {
  const hasTps = tps != null && Number.isFinite(tps) && tps > 0;
  const hasTtft = ttftMs != null && Number.isFinite(ttftMs) && ttftMs > 0;
  if (!hasTps && !hasTtft) return null;
  const tpsScore = hasTps ? logScale(tps as number, 20, 400) : null;
  const ttftScore = hasTtft ? clamp(100 - logScale(ttftMs as number, 150, 20000)) : null;
  if (tpsScore != null && ttftScore != null) return clamp(0.7 * tpsScore + 0.3 * ttftScore);
  return (tpsScore ?? ttftScore) as number;
}

function localEase(m: ImportedModel): number {
  if (!m.isOpenWeight) return 8;
  // Smaller = easier to run locally.
  const p = m.parameterCount ?? '';
  if (/\b[1-9]b\b/i.test(p)) return 95;
  if (/\b1[0-9]b\b/i.test(p)) return 82;
  if (/\b[23][0-9]b\b/i.test(p)) return 68;
  if (/\b(4[0-9]|[5-9][0-9])b\b/i.test(p)) return 45;
  if (/x\d+b/i.test(p)) return 35;
  return 55;
}

export interface ScoreInputs {
  benchmarkQuality?: number | null;
  tps?: number | null;
  ttftMs?: number | null;
}

export function scoreModel(
  m: ImportedModel,
  now = new Date(),
  inputs: ScoreInputs = {}
): { scores: Scores; estimated: boolean } {
  const proxy = qualityProxy(m, now);
  // When measured benchmark quality is available, blend it in and treat the
  // result as measured (not estimated). Otherwise fall back to the proxy.
  const hasBench = inputs.benchmarkQuality != null && Number.isFinite(inputs.benchmarkQuality);
  const Q = hasBench ? clamp(0.65 * (inputs.benchmarkQuality as number) + 0.35 * proxy) : proxy;
  const cheap = priceCheapness(m.cheapestOutputPer1m);
  const inputCheap = priceCheapness(m.cheapestInputPer1m);
  // Prefer measured throughput/latency; fall back to the structural proxy.
  const SP = measuredSpeedScore(inputs.tps, inputs.ttftMs) ?? speedProxy(m);
  const FC = featureCoverage(m);
  const AV = availabilityScore(m);
  const TR = trustScore(m);
  const ctx = logScale(m.contextWindow, 4000, 1_000_000);
  const ml = multilingualSignal(m);
  const f = m.features;

  const PP = clamp(0.5 * Q + 0.5 * cheap); // quality-per-dollar

  const overall = clamp(
    OVERALL_WEIGHTS.quality * Q +
      OVERALL_WEIGHTS.pricePerformance * PP +
      OVERALL_WEIGHTS.speed * SP +
      OVERALL_WEIGHTS.features * FC +
      OVERALL_WEIGHTS.availability * AV +
      OVERALL_WEIGHTS.trust * TR
  );

  const coding = clamp(0.55 * Q + 0.25 * (f.coding ? 100 : 45) + 0.2 * (f.reasoning ? 80 : 55));
  const visionSig = f.vision ? clamp(0.7 * Q + 30) : 5;

  const scores: Scores = {
    overall: round1(overall),
    coding: round1(coding),
    frontendCoding: round1(clamp(0.85 * coding + 0.15 * visionSig)),
    backendCoding: round1(clamp(0.9 * coding + 0.1 * (f.tools ? 100 : 60))),
    math: round1(clamp(0.7 * Q + 0.3 * (f.reasoning ? 100 : 40))),
    reasoning: round1(clamp(0.6 * Q + 0.4 * (f.reasoning ? 100 : 35))),
    writing: round1(clamp(0.8 * Q + 0.2 * 72)),
    german: round1(clamp(0.7 * Q + 0.3 * ml)),
    translation: round1(clamp(0.65 * Q + 0.35 * ml)),
    business: round1(clamp(0.5 * Q + 0.2 * TR + 0.15 * AV + 0.15 * (f.tools ? 100 : 60))),
    cheapApi: round1(clamp(0.6 * cheap + 0.4 * inputCheap)),
    speed: round1(SP),
    privacyEu: round1(
      clamp(0.5 * (m.isOpenWeight ? 90 : 40) + 0.3 * (m.providers.some((p) => p.euHosting) ? 90 : 35) + 0.2 * (f.localDeployment ? 100 : 50))
    ),
    local: round1(clamp(0.5 * Q + 0.5 * localEase(m))),
    openWeight: round1(m.isOpenWeight ? clamp(0.7 * Q + 30) : 0),
    rag: round1(clamp(0.4 * Q + 0.3 * ctx + 0.15 * (f.tools ? 100 : 60) + 0.15 * PP)),
    longContext: round1(clamp(0.6 * ctx + 0.4 * Q)),
    agentTool: round1(f.tools ? clamp(0.55 * Q + 25 + 0.2 * (f.reasoning ? 90 : 60)) : round1(clamp(0.4 * Q))),
    vision: round1(visionSig),
    dataAnalysis: round1(clamp(0.55 * Q + 0.2 * (f.tools ? 100 : 60) + 0.15 * ctx + 0.1 * (f.reasoning ? 90 : 60))),
    customerSupport: round1(clamp(0.45 * Q + 0.3 * cheap + 0.15 * SP + 0.1 * ml)),
    legalDrafting: round1(clamp(0.6 * Q + 0.2 * ctx + 0.2 * (f.reasoning ? 90 : 60))),
    salesEmail: round1(clamp(0.6 * Q + 0.25 * cheap + 0.15 * 72)),
    pricePerformance: round1(PP)
  };

  // Estimated when quality is a structural proxy; measured when benchmarks fed in.
  return { scores, estimated: !hasBench };
}
