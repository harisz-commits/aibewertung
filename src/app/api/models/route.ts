import { NextResponse } from 'next/server';
import { getAllModels } from '@/lib/data';

// Public API (Phase 7 will add API-key auth, quotas and per-minute rate limits
// via Upstash Redis; usage is logged per key). For now this is an open,
// read-only endpoint backed by the snapshot.
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 345);
  const q = searchParams.get('q')?.toLowerCase();

  let models = getAllModels();
  if (category) models = models.filter((m) => m.category === category);
  if (q) models = models.filter((m) => `${m.name} ${m.lab}`.toLowerCase().includes(q));

  const data = models.slice(0, limit).map((m) => ({
    slug: m.slug,
    name: m.name,
    lab: m.lab,
    category: m.category,
    status: m.status,
    contextWindow: m.contextWindow,
    isOpenWeight: m.isOpenWeight,
    cheapestInputPer1m: m.cheapestInputPer1m,
    cheapestOutputPer1m: m.cheapestOutputPer1m,
    providerCount: m.providerCount,
    overallScore: m.scores.overall
  }));

  return NextResponse.json(
    { count: data.length, data },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600' } }
  );
}
