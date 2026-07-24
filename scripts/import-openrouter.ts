// DB-backed OpenRouter importer (Phase 2). Fetches live data, maps with the
// shared importer, and upserts models + scores + a source record, recording an
// UpdateRun and per-field ChangeLogs. Run: npm run import:openrouter
// Requires DATABASE_URL and a migrated schema (npm run db:push).
//
// This is the production pipeline counterpart to scripts/generate-snapshot.ts.
// It intentionally reuses mapModel + scoreModel so scores stay consistent.

import { PrismaClient } from '@prisma/client';
import { mapModel, type RawOpenRouterModel } from '../src/lib/importers/openrouter.ts';
import { scoreModel, SCORE_VERSION } from '../src/lib/scoring/engine.ts';

const prisma = new PrismaClient();
const BASE = 'https://openrouter.ai/api/v1';

async function main() {
  const now = new Date();
  const run = await prisma.updateRun.create({ data: { status: 'running' } });

  const res = await fetch(`${BASE}/models`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const raw: RawOpenRouterModel[] = (await res.json()).data ?? [];

  const source = await prisma.source.create({
    data: {
      sourceType: 'marketplace',
      name: 'OpenRouter Models API',
      url: `${BASE}/models`,
      reliabilityLevel: 'marketplace'
    }
  });

  let created = 0;
  let updated = 0;

  for (const r of raw) {
    const m = mapModel(r, now);
    const lab = await prisma.lab.upsert({
      where: { slug: m.labSlug },
      update: {},
      create: { slug: m.labSlug, name: m.lab }
    });

    const existing = await prisma.model.findUnique({ where: { slug: m.slug } });

    const data = {
      name: m.name,
      labId: lab.id,
      status: m.status as never,
      category: m.category as never,
      releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
      openness: m.openness as never,
      isOpenWeight: m.isOpenWeight,
      license: m.license,
      parameterCount: m.parameterCount,
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
      inputModalities: m.inputModalities,
      outputModalities: m.outputModalities,
      supportsTools: m.features.tools,
      supportsFunctionCall: m.features.functionCalling,
      supportsJsonMode: m.features.jsonMode,
      supportsStructured: m.features.structuredOutput,
      supportsVision: m.features.vision,
      supportsAudio: m.features.audio,
      supportsReasoning: m.features.reasoning,
      supportsCoding: m.features.coding,
      supportsStreaming: m.features.streaming,
      supportsLocal: m.features.localDeployment,
      isPreview: m.isPreview,
      isBeta: m.isBeta,
      isExperimental: m.isExperimental,
      isNew: m.isNew,
      isAutoDetected: true,
      lastCheckedAt: now
    };

    const model = existing
      ? await prisma.model.update({ where: { id: existing.id }, data })
      : await prisma.model.create({ data: { slug: m.slug, ...data } });

    existing ? updated++ : created++;

    if (!existing) {
      await prisma.changeLog.create({
        data: {
          runId: run.id,
          entityType: 'model',
          entityId: model.id,
          changeType: 'create',
          sourceId: source.id,
          changedBy: 'system',
          newValue: m.name
        }
      });
    }

    const { scores } = scoreModel(m, now);
    await prisma.score.create({
      data: { modelId: model.id, scoreVersion: SCORE_VERSION, isEstimated: true, ...scores }
    });
  }

  await prisma.updateRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      status: 'done',
      newModels: created,
      updatedModels: updated,
      summary: `Imported ${raw.length} models (${created} new, ${updated} updated) from OpenRouter.`
    }
  });

  console.log(`Done: ${created} new, ${updated} updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
