import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin/auth';
import { loginAction } from '@/lib/admin/actions';

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect('/admin');
  const { error } = await searchParams;

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-1 text-xl font-semibold">Admin login</h1>
      <p className="mb-6 text-sm text-muted">Sign in with your admin email and password.</p>
      {error && (
        <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          Invalid credentials.
        </div>
      )}
      <form action={loginAction} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="admin@botbrix.com"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
