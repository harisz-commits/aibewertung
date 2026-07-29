// LMArena (Chatbot Arena) importer scaffold (Phase 4). The public leaderboard
// publishes an Elo per model based on blind human votes. This maps a leaderboard
// entry to a 'lmarena' benchmark result. The fetch/source parsing is left as a
// documented step because the leaderboard is distributed as a periodically
// updated dataset rather than a stable JSON API - wire the current source in
// scripts/import-benchmarks.ts and keep `lastCheckedAt` honest.

import type { BenchmarkResultView } from '../types.ts';
import { toResult, type BenchmarkMap } from './benchmarks.ts';

export interface ArenaEntry {
  model: string;
  elo: number;
}

export function mapArenaEntry(entry: ArenaEntry, now = new Date()): BenchmarkResultView {
  return toResult(
    {
      benchmarkSlug: 'lmarena',
      rawValue: Math.round(entry.elo),
      sourceName: 'LMArena',
      sourceUrl: 'https://lmarena.ai/'
    },
    now
  );
}

export function buildArenaMap(
  entries: ArenaEntry[],
  matchSlug: (model: string) => string | null,
  now = new Date()
): BenchmarkMap {
  const map: BenchmarkMap = {};
  for (const e of entries) {
    const slug = matchSlug(e.model);
    if (slug) map[slug] = [mapArenaEntry(e, now)];
  }
  return map;
}
