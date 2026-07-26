// Coding-benchmark ingestion adapters (Hugging Face datasets-server).
//
// IMPORTANT / verified via the datasets-server /info endpoint:
//   • SWE-bench/SWE-bench_Multilingual  → PROBLEM instances (patch, test_patch,
//     FAIL_TO_PASS…). No per-model pass rates.
//   • nuprl/MultiPL-E                    → translated PROBLEMS per language
//     (prompt, tests). No per-model scores.
//   • Multilingual-Multimodal-NLP/McEval-Instruct → instruction-tuning DATA
//     (instruction→output). No scores.
// Model×language scores therefore come from a RESULTS source (a published
// leaderboard export or a curated seed), fed through `fromResultsTable` /
// `loadCodingSeed`. The HF adapters here are used for LANGUAGE COVERAGE and to
// ingest results-shaped datasets when one is available.

import type { RawCodingRow } from '../coding/aggregate.ts';
import { canonicalLanguage } from '../coding/languages.ts';

const HF_ROWS = 'https://datasets-server.huggingface.co/rows';
const HF_SPLITS = 'https://datasets-server.huggingface.co/splits';

export const SOURCE_NOTES: Record<string, string> = {
  'SWE-bench/SWE-bench_Multilingual': 'problem instances (no model scores) — feed results via seed/leaderboard export',
  'nuprl/MultiPL-E': 'translated problems per language (no scores) — used for language coverage',
  'Multilingual-Multimodal-NLP/McEval-Instruct': 'instruction-tuning data (no scores)'
};

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchHf(url: string, token?: string, tries = 4): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: authHeaders(token) });
    if (res.ok) return res.json();
    // Respect rate limits / transient states.
    if (res.status === 429 || res.status === 503) {
      const retryAfter = Number(res.headers.get('retry-after')) || 2 ** i;
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      lastErr = new Error(`HTTP ${res.status}`);
      continue;
    }
    throw new Error(`Hugging Face HTTP ${res.status} for ${url}`);
  }
  throw lastErr;
}

export interface HfSplit {
  config: string;
  split: string;
}

export async function fetchHfSplits(dataset: string, token?: string): Promise<HfSplit[]> {
  const data = await fetchHf(`${HF_SPLITS}?dataset=${encodeURIComponent(dataset)}`, token);
  return (data?.splits ?? []).map((s: any) => ({ config: s.config, split: s.split }));
}

/** Which canonical languages MultiPL-E actually covers (from its config names).
 * Real and useful for building the language coverage list. */
export async function multiplELanguages(token?: string): Promise<string[]> {
  const splits = await fetchHfSplits('nuprl/MultiPL-E', token);
  const langs = new Set<string>();
  for (const s of splits) {
    const lang = canonicalLanguage(s.config);
    if (lang) langs.add(lang);
  }
  return [...langs].sort();
}

/** Paginate a dataset's rows (bounded). Only useful for RESULTS-shaped datasets. */
export async function fetchDatasetRows(
  dataset: string,
  config: string,
  split: string,
  opts: { token?: string; max?: number } = {}
): Promise<any[]> {
  const max = opts.max ?? 1000;
  const out: any[] = [];
  for (let offset = 0; offset < max; offset += 100) {
    const url = `${HF_ROWS}?dataset=${encodeURIComponent(dataset)}&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}&offset=${offset}&length=100`;
    const data = await fetchHf(url, opts.token);
    const rows = (data?.rows ?? []).map((r: any) => r.row);
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

export interface ResultFieldMap {
  benchmark: string;
  modelField: string;
  languageField: string;
  scoreField: string;
}

/** Map arbitrary results rows onto the standardized coding-score schema. */
export function fromResultsTable(rows: any[], map: ResultFieldMap): RawCodingRow[] {
  return rows.map((r) => ({
    model: String(r[map.modelField] ?? ''),
    language: String(r[map.languageField] ?? ''),
    benchmark: map.benchmark,
    score: typeof r[map.scoreField] === 'number' ? r[map.scoreField] : Number(r[map.scoreField])
  }));
}
