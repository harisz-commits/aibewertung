'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border bg-surface text-xs font-medium">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={
            'px-2.5 py-1.5 uppercase transition ' +
            (l === locale ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg')
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
