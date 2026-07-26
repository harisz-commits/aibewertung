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
import { computeLanguageLeaderboards, type RawCodingRow, type AggregationMode } from '../src/lib/coding/aggregate.ts';
import { CANONICAL_LANGUAGES } from '../src/lib/coding/languages.ts';
import { multiplELanguages } from '../src/lib/importers/codingBenchmarks.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'src', 'data');
const OUT = join(DATA, 'coding-languages.json');
const SEED = join(DATA, 'coding-languages.seed.json');

async function main() {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
  const mode = (process.env.CODING_AGG_MODE as AggregationMode) || 'zscore';

  // 1) Results rows (curated seed). Real leaderboard exports go here too.
  let rows: RawCodingRow[] = [];
  if (existsSync(SEED)) {
    try {
      const parsed = JSON.parse(readFileSync(SEED, 'utf8'));
      rows = Array.isArray(parsed) ? parsed : (parsed.rows ?? []);
      console.log(`Loaded ${rows.length} result rows from seed.`);
    } catch (e) {
      console.warn(`Seed parse failed: ${(e as Error).message}`);
    }
  } else {
    console.log('No coding-languages.seed.json — writing an empty leaderboard shell.');
  }

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
