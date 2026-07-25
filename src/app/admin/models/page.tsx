import { requireAdmin } from '@/lib/admin/auth';
import { getDb, isDbConfigured } from '@/lib/db';
import { getAllModels } from '@/lib/data';
import { saveOverrideAction } from '@/lib/admin/actions';

const STATUSES = ['', 'active', 'preview', 'beta', 'experimental', 'deprecated', 'possibly_unavailable', 'inactive'];

interface OverrideRow {
  isHidden: boolean | null;
  isVerified: boolean | null;
  statusOverride: string | null;
  affiliateUrl: string | null;
  note: string | null;
}

export default async function AdminModelsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (q ?? '').toLowerCase();

  const all = getAllModels();
  const models = (query ? all.filter((m) => `${m.name} ${m.lab} ${m.slug}`.toLowerCase().includes(query)) : all).slice(
    0,
    query ? 100 : 40
  );

  let overrides: Record<string, OverrideRow> = {};
  if (isDbConfigured()) {
    try {
      const rows = await getDb().adminOverride.findMany();
      overrides = Object.fromEntries(rows.map((r) => [r.modelSlug, r as unknown as OverrideRow]));
    } catch {
      overrides = {};
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Models</h1>
      <p className="mb-4 text-sm text-muted">
        Hide, verify, change status and attach affiliate links. Changes are applied on top of the snapshot.
      </p>

      <form method="get" className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search models…"
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button className="rounded-lg border border-border px-3 py-2 text-sm hover:border-brand/50">Search</button>
      </form>

      <div className="space-y-2">
        {models.map((m) => {
          const o = overrides[m.slug];
          return (
            <form
              key={m.slug}
              action={saveOverrideAction}
              className="grid grid-cols-1 items-center gap-3 rounded-xl border border-border bg-surface p-3 lg:grid-cols-[1fr_auto]"
            >
              <input type="hidden" name="modelSlug" value={m.slug} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  {m.name}
                  <span className="text-xs font-normal text-muted">{m.lab}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="isHidden" defaultChecked={o?.isHidden ?? false} /> Hidden
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="isVerified" defaultChecked={o?.isVerified ?? m.isVerified} /> Verified
                  </label>
                  <label className="flex items-center gap-1.5">
                    Status
                    <select
                      name="statusOverride"
                      defaultValue={o?.statusOverride ?? ''}
                      className="rounded border border-border bg-bg px-1.5 py-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s || '(unchanged)'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    name="affiliateUrl"
                    defaultValue={o?.affiliateUrl ?? ''}
                    placeholder="Affiliate / ref URL"
                    className="min-w-[200px] flex-1 rounded border border-border bg-bg px-2 py-1"
                  />
                  <input
                    name="note"
                    defaultValue={o?.note ?? ''}
                    placeholder="Internal note"
                    className="min-w-[140px] rounded border border-border bg-bg px-2 py-1"
                  />
                </div>
              </div>
              <button className="justify-self-start rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 lg:justify-self-end">
                Save
              </button>
            </form>
          );
        })}
      </div>
      {!query && all.length > models.length && (
        <p className="mt-4 text-sm text-muted">Showing first {models.length}. Use search to find others.</p>
      )}
    </div>
  );
}
