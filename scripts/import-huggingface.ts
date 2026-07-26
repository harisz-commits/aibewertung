// Enriches src/data/models.snapshot.json with Hugging Face adoption data.
// Run: npm run import:hf   (optional HF_TOKEN for higher rate limits)
//
// Deliberately separate from `npm run snapshot`: adoption data can be
// refreshed on its own, without re-fetching OpenRouter and without the
// Artificial Analysis key (a full rebuild without that key would drop every
// measured benchmark from the snapshot).
//
// Only open-weight models are on Hugging Face, so closed models keep no
// adoption fields at all — we show nothing rather than invent a number.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toSlug } from '../src/lib/importers/openrouter.ts';
import { fetchHfStatsMap } from '../src/lib/importers/huggingface.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAP = join(__dirname, '..', 'src', 'data', 'models.snapshot.json');
const OR_MODELS = 'https://openrouter.ai/api/v1/models';

async function main() {
  const snap = JSON.parse(readFileSync(SNAP, 'utf8')) as {
    meta: Record<string, unknown>;
    models: Record<string, unknown>[];
  };

  // 1) Map our slugs -> Hugging Face repo ids via the OpenRouter catalogue.
  const res = await fetch(OR_MODELS);
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const raw = ((await res.json()) as { data?: { id: string; hugging_face_id?: string | null }[] }).data ?? [];
  const hfBySlug = new Map<string, string>();
  for (const m of raw) if (m.hugging_face_id) hfBySlug.set(toSlug(m.id), m.hugging_face_id);
  console.log(`OpenRouter: ${raw.length} models, ${hfBySlug.size} with a Hugging Face id.`);

  // 2) Fetch adoption stats for the ids our snapshot actually uses.
  const ids = [...new Set(snap.models.map((m) => hfBySlug.get(String(m.slug))).filter((x): x is string => Boolean(x)))];
  console.log(`Fetching Hugging Face stats for ${ids.length} repos…`);
  const stats = await fetchHfStatsMap(ids, { token: process.env.HF_TOKEN });
  console.log(`  ${Object.keys(stats).length}/${ids.length} repos returned data.`);

  // 3) Merge in place, leaving every other field untouched.
  let enriched = 0;
  for (const m of snap.models) {
    const hfId = hfBySlug.get(String(m.slug));
    if (!hfId) continue;
    m.hfId = hfId;
    const s = stats[hfId];
    if (!s) continue;
    m.hfDownloads30d = s.downloads30d;
    m.hfDownloadsAllTime = s.downloadsAllTime;
    m.hfLikes = s.likes;
    enriched++;
  }

  snap.meta.hfCheckedAt = new Date().toISOString();
  writeFileSync(SNAP, JSON.stringify(snap, null, 2) + '\n');
  console.log(`Wrote ${SNAP}: adoption data on ${enriched} models.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
