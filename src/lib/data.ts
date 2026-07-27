// Read-side data layer. Currently reads the committed real-data snapshot so the
// app runs with zero infrastructure. When DATABASE_URL is configured, this is
// where DB-backed queries (Prisma) would be swapped in behind the same API.

import snapshotJson from '@/data/models.snapshot.json';
import type { FeaturedSlotView, ModelStatus, ModelView, Snapshot } from '@/lib/types';
import { getDb, isDbConfigured } from '@/lib/db';

const snapshot = snapshotJson as unknown as Snapshot;

export interface OverrideData {
  bySlug: Record<
    string,
    { isHidden?: boolean; isVerified?: boolean; statusOverride?: ModelStatus | null; affiliateUrl?: string | null }
  >;
  featured: FeaturedSlotView[];
}

const EMPTY_OVERRIDES: OverrideData = { bySlug: {}, featured: [] };

/** Fetch admin overrides + active featured slots. Returns empty (no DB call)
 * when no database is configured, so the public site stays fast and DB-less. */
export async function getOverrides(): Promise<OverrideData> {
  if (!isDbConfigured()) return EMPTY_OVERRIDES;
  try {
    const db = getDb();
    const now = new Date();
    const [rows, slots] = await Promise.all([
      db.adminOverride.findMany(),
      db.featuredSlot.findMany({ where: { isActive: true } })
    ]);
    const bySlug: OverrideData['bySlug'] = {};
    for (const r of rows) {
      bySlug[r.modelSlug] = {
        isHidden: r.isHidden ?? undefined,
        isVerified: r.isVerified ?? undefined,
        statusOverride: (r.statusOverride as ModelStatus | null) ?? undefined,
        affiliateUrl: r.affiliateUrl ?? undefined
      };
    }
    const featured = slots
      .filter((s) => (!s.startsAt || s.startsAt <= now) && (!s.endsAt || s.endsAt >= now))
      .map((s) => ({ id: s.id, placement: s.placement, label: s.label, modelSlug: s.modelId, targetUrl: s.targetUrl }));
    return { bySlug, featured };
  } catch {
    return EMPTY_OVERRIDES;
  }
}

/** Apply overrides to a model list: drop hidden, set verified/affiliate/featured. */
export function applyOverrides(models: ModelView[], ov: OverrideData): ModelView[] {
  const featuredSlugs = new Set(ov.featured.map((f) => f.modelSlug).filter(Boolean) as string[]);
  return models
    .filter((m) => !ov.bySlug[m.slug]?.isHidden)
    .map((m) => {
      const o = ov.bySlug[m.slug];
      if (!o && !featuredSlugs.has(m.slug)) return m;
      return {
        ...m,
        isVerified: o?.isVerified ?? m.isVerified,
        status: o?.statusOverride ?? m.status,
        affiliateUrl: o?.affiliateUrl ?? m.affiliateUrl ?? null,
        isFeatured: featuredSlugs.has(m.slug)
      };
    });
}

export function getSnapshotMeta() {
  return snapshot.meta;
}

export function getAllModels(): ModelView[] {
  // Hide deprecated/inactive from default listing (spec §5).
  return snapshot.models.filter((m) => m.status !== 'deprecated' && m.status !== 'inactive');
}

/** Answers in text, so competing on text-task scores is meaningful. Image and
 * audio GENERATORS are excluded: their coding/writing/German scores come from
 * structural signals (context, price, capabilities) and say nothing about
 * text ability, so ranking them next to chat models is misleading. They stay
 * in the table under their own category. */
export function isTextModel(m: ModelView): boolean {
  return m.category !== 'media' && m.category !== 'embedding' && m.category !== 'reranker';
}

export function getTextModels(): ModelView[] {
  return getAllModels().filter(isTextModel);
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

/** Most-downloaded open-weight models (Hugging Face, last 30 days). Adoption,
 * not quality — kept out of the scored rankings on purpose. Deduplicated by
 * Hugging Face repo, since paid and ":free" variants share one repo. */
export function getMostDownloaded(limit = 8): ModelView[] {
  const seen = new Set<string>();
  return getAllModels()
    .filter((m) => m.hfDownloads30d != null)
    .sort((a, b) => (b.hfDownloads30d ?? 0) - (a.hfDownloads30d ?? 0))
    .filter((m) => {
      const key = m.hfId ?? m.slug;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

type RankingKey = keyof ModelView['scores'];

export function getTopBy(key: RankingKey, limit = 5, filter?: (m: ModelView) => boolean): ModelView[] {
  // Text-task rankings only ever consider models that answer in text.
  return getTextModels()
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
    { id: 'pricePerformance', scoreKey: 'pricePerformance' as RankingKey, models: getTopBy('pricePerformance', 5) },
    { id: 'speed', scoreKey: 'speed' as RankingKey, models: getTopBy('speed', 5, (m) => m.outputSpeedTps != null) }
  ];
}
