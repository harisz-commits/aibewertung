import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('impressumTitle')}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">{t('impressumBody')}</p>
    </div>
  );
}
