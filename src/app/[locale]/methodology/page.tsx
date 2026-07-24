import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OVERALL_WEIGHTS, SCORE_VERSION } from '@/lib/scoring/engine';
import { getSnapshotMeta } from '@/lib/data';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'methodology' });
  return { title: t('title'), description: t('intro') };
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}

export default async function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('methodology');
  const meta = getSnapshotMeta();

  const weights = Object.entries(OVERALL_WEIGHTS);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-muted">{t('intro')}</p>
      <p className="mt-1 text-xs text-muted">
        Score engine: <code className="font-mono">{SCORE_VERSION}</code> · data snapshot:{' '}
        {new Date(meta.generatedAt).toISOString().slice(0, 10)} · {meta.modelCount} models · source: {meta.source}
      </p>

      <div className="mt-8 space-y-5">
        <Section title={t('scoringTitle')} body={t('scoringBody')} />

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-base font-semibold">{t('weightsTitle')}</h2>
          <div className="space-y-2">
            {weights.map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="capitalize text-muted">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold tabular-nums">{Math.round(v * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${v * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <Section title={t('benchmarksTitle')} body={t('benchmarksBody')} />
        <Section title={t('sourcesTitle')} body={t('sourcesBody')} />
        <Section title={t('sponsoredTitle')} body={t('sponsoredBody')} />
        <Section title={t('estimatedTitle')} body={t('estimatedBody')} />
      </div>
    </div>
  );
}
