// Read-side data layer. Currently reads the committed real-data snapshot so the
// app runs with zero infrastructure. When DATABASE_URL is configured, this is
// where DB-backed queries (Prisma) would be swapped in behind the same API.

import snapshotJson from '@/data/models.snapshot.json';
import type { ModelView, Snapshot } from '@/lib/types';

const snapshot = snapshotJson as unknown as Snapshot;

export function getSnapshotMeta() {
  return snapshot.meta;
}

export function getAllModels(): ModelView[] {
  // Hide deprecated/inactive from default listing (spec §5).
  return snapshot.models.filter((m) => m.status !== 'deprecated' && m.status !== 'inactive');
}

export function getModelBySlug(slug: string): ModelView | undefined {
  return snapshot.models.find((m) => m.slug === slug);
}

export function getLabs(): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const m of getAllModels()) {
    const cur = map.get(m.labSlug) ?? { slug: m.labSlug, name: m.lab, count: 0 };
    cur.count++;
    map.set(m.labSlug, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getProviders(): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const m of getAllModels()) {
    for (const p of m.providers) {
      const cur = map.get(p.providerSlug) ?? { slug: p.providerSlug, name: p.providerName, count: 0 };
      cur.count++;
      map.set(p.providerSlug, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

type RankingKey = keyof ModelView['scores'];

export function getTopBy(key: RankingKey, limit = 5, filter?: (m: ModelView) => boolean): ModelView[] {
  return getAllModels()
    .filter((m) => (filter ? filter(m) : true))
    .filter((m) => m.scores[key] > 0)
    .sort((a, b) => b.scores[key] - a.scores[key])
    .slice(0, limit);
}

export interface HomeRanking {
  key: RankingKey;
  models: ModelView[];
  filter?: (m: ModelView) => boolean;
}

export function getHomeRankings(): { id: string; scoreKey: RankingKey; models: ModelView[] }[] {
  return [
    { id: 'overall', scoreKey: 'overall' as RankingKey, models: getTopBy('overall', 5) },
    { id: 'coding', scoreKey: 'coding' as RankingKey, models: getTopBy('coding', 5) },
    {
      id: 'cheapApi',
      scoreKey: 'cheapApi' as RankingKey,
      models: getTopBy('cheapApi', 5, (m) => (m.cheapestOutputPer1m ?? 0) > 0)
    },
    { id: 'local', scoreKey: 'local' as RankingKey, models: getTopBy('local', 5, (m) => m.isOpenWeight) },
    { id: 'german', scoreKey: 'german' as RankingKey, models: getTopBy('german', 5) },
    { id: 'rag', scoreKey: 'rag' as RankingKey, models: getTopBy('rag', 5) },
    { id: 'vision', scoreKey: 'vision' as RankingKey, models: getTopBy('vision', 5, (m) => m.features.vision) },
    { id: 'pricePerformance', scoreKey: 'pricePerformance' as RankingKey, models: getTopBy('pricePerformance', 5) }
  ];
}
