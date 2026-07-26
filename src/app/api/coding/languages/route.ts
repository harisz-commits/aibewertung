import { NextResponse } from 'next/server';
import codingData from '@/data/coding-languages.json';
import type { LanguageLeaderboard } from '@/lib/coding/aggregate';

// Per-language coding leaderboard. Populated by `npm run import:coding` once a
// results source (seed / leaderboard export) is provided; see the methodology.
// Response shape matches the spec: { language: { "JavaScript": [{model, score}] } }.
const data = codingData as unknown as {
  meta: Record<string, unknown> & { coverage?: string[] };
  leaderboard: LanguageLeaderboard;
};

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('language');
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200);

  if (lang) {
    const entries = (data.leaderboard[lang] ?? []).slice(0, limit);
    return NextResponse.json({ meta: data.meta, language: lang, entries });
  }

  const trimmed: LanguageLeaderboard = {};
  for (const [l, entries] of Object.entries(data.leaderboard)) trimmed[l] = entries.slice(0, limit);

  return NextResponse.json(
    { meta: data.meta, coverage: data.meta.coverage ?? [], language: trimmed },
    { headers: { 'Cache-Control': 'public, max-age=600, s-maxage=1200' } }
  );
}
