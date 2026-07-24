import clsx from 'clsx';
import type { ModelView } from '@/lib/types';

export function Badge({
  children,
  tone = 'neutral',
  title
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'sponsored';
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none',
        {
          'bg-surface-2 text-muted ring-1 ring-border': tone === 'neutral',
          'bg-brand/12 text-brand ring-1 ring-brand/25': tone === 'brand',
          'bg-success/12 text-success ring-1 ring-success/25': tone === 'success',
          'bg-warning/12 text-warning ring-1 ring-warning/25': tone === 'warning',
          'bg-danger/12 text-danger ring-1 ring-danger/25': tone === 'danger',
          'bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400':
            tone === 'sponsored'
        }
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadges({
  model,
  t
}: {
  model: ModelView;
  t: (key: string) => string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {model.isNew && <Badge tone="success">{t('new')}</Badge>}
      {model.isPreview && <Badge tone="warning">{t('preview')}</Badge>}
      {model.isBeta && <Badge tone="warning">{t('beta')}</Badge>}
      {model.isExperimental && <Badge tone="warning">{t('experimental')}</Badge>}
      {model.isOpenWeight && <Badge tone="brand">{t('openWeight')}</Badge>}
    </span>
  );
}
