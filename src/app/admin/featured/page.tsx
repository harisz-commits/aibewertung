import { requireAdmin } from '@/lib/admin/auth';
import { getDb, isDbConfigured } from '@/lib/db';
import { saveFeaturedAction, deleteFeaturedAction } from '@/lib/admin/actions';

const PLACEMENTS = ['homepage_hero', 'table_top', 'sidebar'];

export default async function AdminFeaturedPage() {
  await requireAdmin();

  let slots: {
    id: string;
    placement: string;
    label: string;
    modelId: string | null;
    targetUrl: string;
    isActive: boolean;
  }[] = [];
  if (isDbConfigured()) {
    try {
      slots = await getDb().featuredSlot.findMany({ orderBy: { createdAt: 'desc' } });
    } catch {
      slots = [];
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Featured / Sponsored slots</h1>
      <p className="mb-5 text-sm text-muted">
        Clearly-labelled paid placements. They never affect organic scores or rankings.
      </p>

      {/* New slot */}
      <form action={saveFeaturedAction} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
        <h2 className="text-sm font-semibold sm:col-span-2">Add slot</h2>
        <label className="text-sm">
          Placement
          <select name="placement" className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5">
            {PLACEMENTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Label
          <input name="label" defaultValue="Sponsored" className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Model slug (optional)
          <input name="modelSlug" placeholder="anthropic-claude-opus-5" className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Target URL
          <input name="targetUrl" required placeholder="https://…" className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked /> Active
        </label>
        <div className="sm:col-span-2">
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90">Create slot</button>
        </div>
      </form>

      <div className="space-y-2">
        {slots.length === 0 && <p className="text-sm text-muted">No featured slots yet.</p>}
        {slots.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-sm">
            <div>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">{s.label}</span>{' '}
              <span className="text-muted">{s.placement}</span> · {s.modelId ?? '—'} →{' '}
              <a href={s.targetUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                {s.targetUrl}
              </a>
              {!s.isActive && <span className="ml-2 text-muted">(inactive)</span>}
            </div>
            <form action={deleteFeaturedAction}>
              <input type="hidden" name="id" value={s.id} />
              <button className="rounded-md px-2 py-1 text-xs text-muted hover:text-danger">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
