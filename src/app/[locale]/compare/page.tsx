import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAllModels } from '@/lib/data';
import type { ModelView } from '@/lib/types';
import { CompareClient } from '@/components/CompareClient';
import type { TableModel } from '@/components/table/ModelTable';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'compare' });
  return { title: t('title'), description: t('subtitle') };
}

function toTableModel(m: ModelView): TableModel {
  const { description, descriptionDe, sources, family, ...rest } = m;
  return rest;
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('compare');
  const models = getAllModels().map(toTableModel);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t('subtitle')}</p>
      <div className="mt-6">
        <CompareClient models={models} />
      </div>
    </div>
  );
}
