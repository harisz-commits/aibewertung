// Hugging Face adoption stats for open-weight models.
//
// Public, key-free API. Gives the one thing benchmarks cannot: how much a model
// is ACTUALLY used. Only open-weight models are published on HF, so closed
// models (GPT, Claude, Gemini) legitimately have no data here — we show nothing
// rather than inventing a number, and these stats never feed the quality score
// (downloads measure popularity, not capability).

const HF_API = 'https://huggingface.co/api/models';

export interface HfStats {
  hfId: string;
  downloads30d: number | null;
  downloadsAllTime: number | null;
  likes: number | null;
}

/** Fetch stats for one HF repo id. Returns null when the repo does not exist
 * (some OpenRouter ids point at repos that were never published). */
export async function fetchHfStats(hfId: string, token?: string): Promise<HfStats | null> {
  const url = `${HF_API}/${hfId}?expand[]=downloads&expand[]=likes&expand[]=downloadsAllTime`;
  const res = await fetch(url, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined
  });
  if (!res.ok) return null;
  const j = (await res.json()) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const downloads30d = num(j.downloads);
  const downloadsAllTime = num(j.downloadsAllTime);
  const likes = num(j.likes);
  // A repo with no usable numbers is not worth recording.
  if (downloads30d == null && downloadsAllTime == null && likes == null) return null;
  return { hfId, downloads30d, downloadsAllTime, likes };
}

/** Fetch many repos with bounded concurrency. Failures are skipped, never thrown:
 * adoption data is a bonus signal and must not break a snapshot build. */
export async function fetchHfStatsMap(
  hfIds: string[],
  opts: { token?: string; concurrency?: number } = {}
): Promise<Record<string, HfStats>> {
  const unique = [...new Set(hfIds.filter(Boolean))];
  const out: Record<string, HfStats> = {};
  const limit = opts.concurrency ?? 6;
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, unique.length) }, async () => {
      while (i < unique.length) {
        const id = unique[i++];
        try {
          const s = await fetchHfStats(id, opts.token);
          if (s) out[id] = s;
        } catch {
          /* ignore individual failures */
        }
      }
    })
  );
  return out;
}
