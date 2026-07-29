import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getDb, isDbConfigured } from '@/lib/db';
import { getAllModels, getSnapshotMeta } from '@/lib/data';

async function counts() {
  if (!isDbConfigured()) return null;
  try {
    const db = getDb();
    const [overrides, featured, openReports, leads, signups] = await Promise.all([
      db.adminOverride.count(),
      db.featuredSlot.count({ where: { isActive: true } }),
      db.dataReport.count({ where: { status: 'open' } }),
      db.lead.count(),
      db.newsletterSignup.count()
    ]);
    return { overrides, featured, openReports, leads, signups };
  } catch {
    return null;
  }
}

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  await requireAdmin();
  const meta = getSnapshotMeta();
  const models = getAllModels();
  const c = await counts();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Dashboard</h1>
      <p className="mb-6 text-sm text-muted">
        Snapshot: {meta.modelCount} models · generated {new Date(meta.generatedAt).toISOString().slice(0, 10)} · source{' '}
        {meta.source}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Models in snapshot" value={models.length} href="/admin/models" />
        <Stat label="Active overrides" value={c?.overrides ?? '-'} href="/admin/models" />
        <Stat label="Active featured slots" value={c?.featured ?? '-'} href="/admin/featured" />
        <Stat label="Open data reports" value={c?.openReports ?? '-'} href="/admin/reports" />
        <Stat label="Leads" value={c?.leads ?? '-'} />
        <Stat label="Newsletter signups" value={c?.signups ?? '-'} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
        <h2 className="mb-2 font-semibold text-fg">How editing works</h2>
        <p>
          botbrix serves its public data from a real-data snapshot. The admin applies <em>overrides</em> on top of it
          (hide, verify, change status, set affiliate links) and manages featured/sponsored slots - all stored in
          PostgreSQL and applied to the live site the moment a <code>DATABASE_URL</code> is connected. Sponsored
          placements are clearly labelled and never affect organic scores or rankings.
        </p>
      </div>
    </div>
  );
}
