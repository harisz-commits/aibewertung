// Builds src/data/coding-languages.json — the per-language coding leaderboard.
// Run: npm run import:coding   (optional HF_TOKEN for gated datasets / higher limits)
//
// Data flow: results rows (curated seed and/or a results-shaped dataset) →
// standardize → z-score/weighted composite per (model, language) → export.
// The three HF benchmark datasets are PROBLEM/training sets (no model scores),
// so real scores must be supplied via the seed or a leaderboard export.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeLanguageLeaderboards,
  estimateRows,
  type RawCodingRow,
  type AggregationMode,
  type CurrentModel
} from '../src/lib/coding/aggregate.ts';
import { CANONICAL_LANGUAGES } from '../src/lib/coding/languages.ts';
import {
  multiplELanguages,
  fetchBigCodeMultiplE,
  fetchSweBenchMultilingual
} from '../src/lib/importers/codingBenchmarks.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'src', 'data');
const OUT = join(DATA, 'coding-languages.json');
const SEED = join(DATA, 'coding-languages.seed.json');

async function main() {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
  const mode = (process.env.CODING_AGG_MODE as AggregationMode) || 'weighted';

  // 1) Results rows from real sources + optional curated seed.
  let rows: RawCodingRow[] = [];
  const addRows = (label: string, rs: RawCodingRow[]) => {
    rows = rows.concat(rs);
    console.log(`  ${label}: ${rs.length} rows`);
  };

  // BigCode / MultiPL-E (broad language coverage; open models).
  try {
    addRows('BigCode MultiPL-E', await fetchBigCodeMultiplE());
  } catch (e) {
    console.warn(`  BigCode skipped: ${(e as Error).message}`);
  }
  // SWE-bench Multilingual (recent models/agents; real bug-fixing per language).
  try {
    addRows('SWE-bench Multilingual', await fetchSweBenchMultilingual());
  } catch (e) {
    console.warn(`  SWE-bench Multilingual skipped: ${(e as Error).message}`);
  }
  // Curated seed (manual additions / other leaderboard exports).
  if (existsSync(SEED)) {
    try {
      const parsed = JSON.parse(readFileSync(SEED, 'utf8'));
      addRows('seed', Array.isArray(parsed) ? parsed : (parsed.rows ?? []));
    } catch (e) {
      console.warn(`  Seed parse failed: ${(e as Error).message}`);
    }
  }
  console.log(`Total ${rows.length} measured rows.`);

  // Estimates for CURRENT models (from the snapshot) that lack real per-language
  // data — clearly flagged as estimates. Baseline = their AA coding index.
  try {
    const snapPath = join(DATA, 'models.snapshot.json');
    if (existsSync(snapPath)) {
      const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
      const current: CurrentModel[] = (snap.models ?? [])
        .filter((m: any) => typeof m.aaCoding === 'number')
        .map((m: any) => ({ name: String(m.name).replace(/^[^:]+:\s*/, ''), coding: m.aaCoding }));
      const est = estimateRows(rows, current);
      rows = rows.concat(est);
      console.log(`  estimated: ${est.length} rows for ${current.length} current models`);
    }
  } catch (e) {
    console.warn(`  estimation skipped: ${(e as Error).message}`);
  }
  console.log(`Total ${rows.length} rows (incl. estimates).`);

  // 2) Language coverage (real, from MultiPL-E configs when reachable).
  let coverage: string[] = CANONICAL_LANGUAGES;
  try {
    const mpl = await multiplELanguages(token);
    if (mpl.length) coverage = [...new Set([...mpl, ...CANONICAL_LANGUAGES])].sort();
    console.log(`MultiPL-E covers ${mpl.length} languages.`);
  } catch (e) {
    console.warn(`Language coverage fetch skipped: ${(e as Error).message}`);
  }

  // 3) Aggregate → export.
  const result = computeLanguageLeaderboards(rows, { mode });
  const output = { meta: { ...result.meta, coverage }, leaderboard: result.leaderboard };

  mkdirSync(DATA, { recursive: true });
  writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(
    `Wrote ${OUT}: ${result.meta.languages.length} languages, ${result.meta.models.length} models, ` +
      `${result.meta.rowCount} rows (${result.meta.skipped} skipped), mode=${mode}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
