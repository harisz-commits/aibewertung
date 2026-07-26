// Benchmark importer (Phase 4). Populates BenchmarkGroup/Benchmark from the
// registry, pulls measured results from Artificial Analysis (key-gated) and an
// optional local LMArena export, upserts ModelBenchmarkResult, and recomputes
// scores with the measured quality blended in.
//
// Run: npm run import:benchmarks   (requires DATABASE_URL; AA needs a key)
// Without a key/data this runs cleanly and simply records nothing new.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { BENCHMARK_GROUPS, BENCHMARKS } from '../src/lib/benchmarks.ts';
import { fetchAARaw, buildAAMap } from '../src/lib/importers/artificialAnalysis.ts';
import { buildArenaMap, type ArenaEntry } from '../src/lib/importers/lmarena.ts';
import { type BenchmarkMap } from '../src/lib/importers/benchmarks.ts';
import { SCORE_VERSION } from '../src/lib/scoring/engine.ts';

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

async function main() {
  // 1. Sync the benchmark registry into the DB.
  for (const g of BENCHMARK_GROUPS) {
    await prisma.benchmarkGroup.upsert({
      where: { slug: g.slug },
      update: { name: g.name.en, description: g.blurb.en },
      create: { slug: g.slug, name: g.name.en, description: g.blurb.en }
    });
  }
  for (const b of BENCHMARKS) {
    const group = await prisma.benchmarkGroup.findUnique({ where: { slug: b.groupSlug } });
    await prisma.benchmark.upsert({
      where: { slug: b.slug },
      update: { name: b.name, groupId: group?.id, sourceUrl: b.sourceUrl, higherIsBetter: b.higherIsBetter, maxValue: b.maxValue },
      create: { slug: b.slug, name: b.name, groupId: group?.id, sourceUrl: b.sourceUrl, higherIsBetter: b.higherIsBetter, maxValue: b.maxValue }
    });
  }

  const models = await prisma.model.findMany({ select: { id: true, slug: true, name: true } });
  const byNorm = new Map(models.map((m) => [norm(m.name), m.slug]));
  const matchByName = (name: string | undefined) => (name ? byNorm.get(norm(name)) ?? null : null);

  // 2. Gather measured results from sources.
  const maps: BenchmarkMap[] = [];
  const rawAA = await fetchAARaw(process.env.ARTIFICIAL_ANALYSIS_API_KEY);
  maps.push(buildAAMap(rawAA, models));

  const arenaFile = join(__dirname, '..', 'src', 'data', 'lmarena.json');
  if (existsSync(arenaFile)) {
    const entries: ArenaEntry[] = JSON.parse(readFileSync(arenaFile, 'utf8'));
    maps.push(buildArenaMap(entries, matchByName));
  }

  // 3. Merge maps by model slug.
  const merged: BenchmarkMap = {};
  for (const map of maps) {
    for (const [slug, results] of Object.entries(map)) {
      merged[slug] = [...(merged[slug] ?? []), ...results];
    }
  }

  const benchSlugToId = new Map(
    (await prisma.benchmark.findMany({ select: { id: true, slug: true } })).map((b) => [b.slug, b.id])
  );

  let written = 0;
  for (const [slug, results] of Object.entries(merged)) {
    const model = models.find((m) => m.slug === slug);
    if (!model) continue;
    for (const r of results) {
      const benchmarkId = benchSlugToId.get(r.benchmarkSlug);
      if (!benchmarkId) continue;
      await prisma.modelBenchmarkResult.upsert({
        where: { modelId_benchmarkId: { modelId: model.id, benchmarkId } },
        update: { rawValue: r.rawValue, normalized: r.normalized, isEstimated: r.isEstimated, lastCheckedAt: new Date() },
        create: {
          modelId: model.id,
          benchmarkId,
          rawValue: r.rawValue,
          normalized: r.normalized,
          isEstimated: r.isEstimated,
          lastCheckedAt: new Date()
        }
      });
      written++;
    }
  }

  // Re-scoring with measured data uses benchmarkQuality() + scoreModel(m, now, q)
  // and runs in the daily agent (Phase 2) alongside import:openrouter.
  console.log(`Benchmark results written: ${written}. Score version ${SCORE_VERSION}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
