import { requireAdmin } from '@/lib/admin/auth';
import { getDb, isDbConfigured } from '@/lib/db';
import { resolveReportAction } from '@/lib/admin/actions';

export default async function AdminReportsPage() {
  await requireAdmin();

  let reports: {
    id: string;
    modelId: string | null;
    field: string | null;
    message: string;
    reporterEmail: string | null;
    status: string;
    createdAt: Date;
  }[] = [];
  if (isDbConfigured()) {
    try {
      reports = await getDb().dataReport.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    } catch {
      reports = [];
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Data reports</h1>
      <p className="mb-5 text-sm text-muted">User-submitted "report wrong data" tickets.</p>

      <div className="space-y-2">
        {reports.length === 0 && <p className="text-sm text-muted">No reports.</p>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{r.modelId ?? 'general'}{r.field ? ` · ${r.field}` : ''}</span>
              <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">{r.status}</span>
            </div>
            <p className="mt-1 text-muted">{r.message}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted">
                {r.reporterEmail ?? 'anonymous'} · {new Date(r.createdAt).toISOString().slice(0, 10)}
              </span>
              <form action={resolveReportAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={r.status} className="rounded border border-border bg-bg px-2 py-1 text-xs">
                  <option value="open">open</option>
                  <option value="reviewing">reviewing</option>
                  <option value="resolved">resolved</option>
                  <option value="rejected">rejected</option>
                </select>
                <button className="rounded-md border border-border px-2 py-1 text-xs hover:border-brand/50">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
