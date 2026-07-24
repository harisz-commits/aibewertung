import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('model');
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl font-bold text-brand">404</div>
      <p className="mt-4 text-muted">This page could not be found.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
      >
        {t('backToTable')}
      </Link>
    </div>
  );
}
