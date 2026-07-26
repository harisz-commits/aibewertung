'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const c = useTranslations('common');
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="font-semibold">{c('brand')}</div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">{t('disclaimer')}</p>
        </div>

        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('product')}
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#models" className="text-muted hover:text-fg">{nav('models')}</Link></li>
            <li><Link href="/compare" className="text-muted hover:text-fg">{nav('compare')}</Link></li>
            <li><Link href="/#rankings" className="text-muted hover:text-fg">{nav('rankings')}</Link></li>
            <li><Link href="/benchmarks" className="text-muted hover:text-fg">{nav('benchmarks')}</Link></li>
            <li><Link href="/coding" className="text-muted hover:text-fg">{nav('coding')}</Link></li>
            <li><Link href="/methodology" className="text-muted hover:text-fg">{t('methodology')}</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('legal')}
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/impressum" className="text-muted hover:text-fg">{t('impressum')}</Link></li>
            <li><Link href="/datenschutz" className="text-muted hover:text-fg">{t('datenschutz')}</Link></li>
            <li><Link href="/methodology" className="text-muted hover:text-fg">{t('reportData')}</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('newsletterTitle')}
          </div>
          {done ? (
            <p className="text-sm text-success">✓ {c('brand')} ✓</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes('@')) setDone(true);
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletterPlaceholder')}
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-fg transition hover:opacity-90"
              >
                {t('newsletterCta')}
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} {c('brand')}. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
