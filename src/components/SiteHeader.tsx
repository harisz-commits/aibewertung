'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BrainCircuit } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SiteHeader() {
  const t = useTranslations('nav');
  const c = useTranslations('common');

  const links = [
    { href: '/#models', label: t('models') },
    { href: '/#rankings', label: t('rankings') },
    { href: '/compare', label: t('compare') },
    { href: '/benchmarks', label: t('benchmarks') },
    { href: '/methodology', label: t('methodology') }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-fg">
            <BrainCircuit size={18} />
          </span>
          <span className="text-[15px]">{c('brand')}</span>
          <span className="hidden text-xs font-normal text-muted sm:inline">· {c('tagline')}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
