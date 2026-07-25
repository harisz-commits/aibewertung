// Generates src/data/models.snapshot.json from LIVE OpenRouter data.
// Run: npm run snapshot   (Node >= 22.6, uses --experimental-strip-types)
//
// This keeps a real-data snapshot in the repo so the app renders without a DB.
// The DB-backed pipeline (scripts/import-openrouter.ts) uses the same importer.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mapModel,
  mapEndpoints,
  withEndpoints,
  type RawOpenRouterModel,
  type RawOpenRouterEndpoint
} from '../src/lib/importers/openrouter.ts';
import { scoreModel, SCORE_VERSION } from '../src/lib/scoring/engine.ts';
import {
  attachBenchmarks,
  benchmarkQuality,
  toResult,
  type BenchmarkMap
} from '../src/lib/importers/benchmarks.ts';
import { fetchArtificialAnalysis, type RawAAModel } from '../src/lib/importers/artificialAnalysis.ts';
import type { ModelView, Snapshot } from '../src/lib/types.ts';

const BASE = 'https://openrouter.ai/api/v1';
const ENDPOINT_SUBSET = 60; // fetch real per-provider endpoints for the newest N

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'models.snapshot.json');

async function fetchJson(url: string, tries = 3): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      out[cur] = await fn(items[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

interface SeedEntry {
  benchmarkSlug: string;
  rawValue: number | null;
  sourceName?: string;
  sourceUrl?: string;
  isEstimated?: boolean;
}

async function loadBenchmarks(models: { slug: string; name: string }[], now: Date): Promise<BenchmarkMap> {
  const byNorm = new Map(models.map((m) => [norm(m.name), m.slug]));
  const matchSlug = (name: string | undefined) => (name ? byNorm.get(norm(name)) ?? null : null);

  const merged: BenchmarkMap = {};
  const add = (map: BenchmarkMap) => {
    for (const [slug, results] of Object.entries(map)) {
      merged[slug] = [...(merged[slug] ?? []), ...results];
    }
  };

  // 1) Artificial Analysis (needs a free API key).
  try {
    add(await fetchArtificialAnalysis(process.env.ARTIFICIAL_ANALYSIS_API_KEY, (aa: RawAAModel) => matchSlug(aa.name ?? aa.slug), now));
  } catch (e) {
    console.warn(`  Artificial Analysis skipped: ${(e as Error).message}`);
  }

  // 2) Local seed file (manually curated; each entry carries its own source).
  const seedPath = join(__dirname, '..', 'src', 'data', 'benchmarks.seed.json');
  if (existsSync(seedPath)) {
    try {
      const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as Record<string, SeedEntry[]>;
      const map: BenchmarkMap = {};
      for (const [slug, entries] of Object.entries(seed)) {
        if (slug.startsWith('_')) continue; // allow _comment keys
        map[slug] = entries.map((e) =>
          toResult(
            {
              benchmarkSlug: e.benchmarkSlug,
              rawValue: e.rawValue,
              isEstimated: e.isEstimated ?? false,
              sourceName: e.sourceName ?? 'Curated seed',
              sourceUrl: e.sourceUrl ?? null
            },
            now
          )
        );
      }
      add(map);
      console.log(`  loaded benchmark seed for ${Object.keys(map).length} models`);
    } catch (e) {
      console.warn(`  benchmark seed parse failed: ${(e as Error).message}`);
    }
  }

  return merged;
}

async function main() {
  const now = new Date();
  console.log('Fetching OpenRouter model list…');
  const list = await fetchJson(`${BASE}/models`);
  const raw: RawOpenRouterModel[] = list.data ?? [];
  console.log(`  ${raw.length} models`);

  let imported = raw.map((m) => mapModel(m, now));

  // Fetch real per-provider endpoints for the newest models (bounded).
  const bySlug = new Map(imported.map((m, i) => [m.id, i]));
  const newest = [...raw]
    .filter((m) => m.created)
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
    .slice(0, ENDPOINT_SUBSET);

  console.log(`Fetching provider endpoints for ${newest.length} newest models…`);
  let endpointHits = 0;
  await mapLimit(newest, 6, async (m) => {
    try {
      const data = await fetchJson(`${BASE}/models/${m.id}/endpoints`);
      const eps: RawOpenRouterEndpoint[] = data?.data?.endpoints ?? [];
      if (eps.length) {
        const slug = m.id.replace(/\//g, '-').toLowerCase();
        const i = bySlug.get(slug);
        if (i != null) {
          imported[i] = withEndpoints(imported[i], mapEndpoints(m.id, eps, now));
          endpointHits++;
        }
      }
    } catch (e) {
      console.warn(`  endpoints failed for ${m.id}: ${(e as Error).message}`);
    }
  });
  console.log(`  merged real endpoints for ${endpointHits} models`);

  // --- Real benchmarks (optional, key/seed gated; never fabricated) ---
  // Sources: Artificial Analysis API (ARTIFICIAL_ANALYSIS_API_KEY) and/or a
  // local seed file src/data/benchmarks.seed.json (see .example for format).
  const bench = await loadBenchmarks(imported.map((m) => ({ slug: m.slug, name: m.name })), now);
  imported = attachBenchmarks(imported, bench);
  const benchCount = Object.keys(bench).length;
  console.log(`  attached measured benchmarks to ${benchCount} models`);

  const models: ModelView[] = imported.map((m) => {
    const q = benchmarkQuality(m.benchmarks);
    const { scores, estimated } = scoreModel(m, now, q);
    return { ...m, scores, scoresEstimated: estimated };
  });

  // Default sort: overall score desc.
  models.sort((a, b) => b.scores.overall - a.scores.overall);

  const snapshot: Snapshot = {
    meta: {
      generatedAt: now.toISOString(),
      source: 'openrouter',
      modelCount: models.length,
      scoreVersion: SCORE_VERSION
    },
    models
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${models.length} models → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
