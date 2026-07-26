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

// ---------------------------------------------------------------------------
// Real results sources (per-language model scores)
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const BIGCODE_CSV =
  'https://huggingface.co/spaces/bigcode/bigcode-models-leaderboard/raw/main/data/code_eval_board.csv';
const BIGCODE_LANG_COLS = [
  'humaneval-python',
  'java',
  'javascript',
  'cpp',
  'php',
  'julia',
  'd',
  'lua',
  'r',
  'racket',
  'rust',
  'swift'
];

/** BigCode Models Leaderboard → MultiPL-E pass@1 per language (open models). */
export async function fetchBigCodeMultiplE(): Promise<RawCodingRow[]> {
  const res = await fetch(BIGCODE_CSV, { headers: { Accept: 'text/csv' } });
  if (!res.ok) throw new Error(`BigCode HTTP ${res.status}`);
  const lines = (await res.text()).trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx: Record<string, number> = {};
  header.forEach((h, i) => (idx[h] = i));
  const modelI = idx['Model'];
  if (modelI == null) throw new Error('BigCode: Model column missing');

  const rows: RawCodingRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const model = cols[modelI]?.trim();
    if (!model) continue;
    for (const col of BIGCODE_LANG_COLS) {
      const ci = idx[col];
      if (ci == null) continue;
      const v = Number(cols[ci]);
      if (Number.isFinite(v) && v > 0) rows.push({ model, language: col, benchmark: 'multipl-e', score: v });
    }
  }
  return rows;
}

const SWE_HTML = 'https://www.swebench.com/multilingual-leaderboard.html';
const SWE_MAP = 'https://www.swebench.com/js/multilingualLanguageMap.js';

/** Parse the `const REPO_LANGUAGE_MAP = {...}` object (repo → language). */
export function parseRepoLanguageMap(js: string): Record<string, string> {
  const map: Record<string, string> = {};
  const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(js))) map[m[1]] = m[2];
  return map;
}

/** SWE-bench Multilingual → per-language resolve rate (recent models/agents).
 * Instances are stratified into languages via the site's repo→language map. */
export async function fetchSweBenchMultilingual(minInstances = 3): Promise<RawCodingRow[]> {
  const [htmlRes, mapRes] = await Promise.all([fetch(SWE_HTML), fetch(SWE_MAP)]);
  if (!htmlRes.ok) throw new Error(`SWE-bench HTML HTTP ${htmlRes.status}`);
  const html = await htmlRes.text();
  const repoLang = parseRepoLanguageMap(mapRes.ok ? await mapRes.text() : '');

  const m = html.match(/<script[^>]*id="leaderboard-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('SWE-bench: leaderboard-data not found');
  const tabs = JSON.parse(m[1]) as { name: string; results: any[] }[];
  const tab = tabs.find((t) => /multilingual/i.test(t.name));
  if (!tab) throw new Error('SWE-bench: Multilingual tab not found');

  const rows: RawCodingRow[] = [];
  for (const r of tab.results ?? []) {
    const details = r.per_instance_details;
    if (!details || typeof details !== 'object') continue;
    const tally: Record<string, { res: number; tot: number }> = {};
    for (const [iid, d] of Object.entries<any>(details)) {
      const repo = iid.replace(/-\d+$/, '');
      const lang = repoLang[repo];
      if (!lang) continue;
      const t = (tally[lang] ??= { res: 0, tot: 0 });
      t.tot++;
      if (d && d.resolved) t.res++;
    }
    for (const [lang, t] of Object.entries(tally)) {
      if (t.tot >= minInstances) {
        rows.push({
          model: String(r.name),
          language: lang,
          benchmark: 'swe-bench-multilingual',
          score: (t.res / t.tot) * 100
        });
      }
    }
  }
  return rows;
}
