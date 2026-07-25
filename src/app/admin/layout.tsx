import type { Metadata } from 'next';
import Link from 'next/link';
import { isDbConfigured } from '@/lib/db';
import { isAdmin, isAdminConfigured } from '@/lib/admin/auth';
import { logoutAction } from '@/lib/admin/actions';
import '../globals.css';

export const metadata: Metadata = {
  title: 'botbrix admin',
  robots: { index: false, follow: false }
};

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/models', label: 'Models' },
  { href: '/admin/featured', label: 'Featured / Sponsored' },
  { href: '/admin/reports', label: 'Data reports' }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-fg">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-fg">b</span>
              botbrix <span className="text-muted">admin</span>
            </Link>
            {authed && (
              <nav className="flex items-center gap-1 text-sm">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-fg">
                    {n.label}
                  </Link>
                ))}
                <form action={logoutAction}>
                  <button className="rounded-md px-3 py-1.5 text-muted hover:text-danger">Logout</button>
                </form>
              </nav>
            )}
          </header>

          {authed && !isDbConfigured() && (
            <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              <strong>Read-only preview.</strong> No <code>DATABASE_URL</code> is configured, so edits cannot be saved.
              Connect a PostgreSQL database (Neon / Supabase / local) and run <code>npm run db:push</code> to enable editing.
            </div>
          )}
          {!isAdminConfigured() && (
            <div className="mb-6 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              <strong>Admin not configured.</strong> Set <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> in your
              environment to enable login.
            </div>
          )}

          {children}
        </div>
      </body>
    </html>
  );
}
