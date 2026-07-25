import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ExternalLink, Info, TriangleAlert, Eye } from 'lucide-react';
import { BENCHMARK_GROUPS, benchmarksInGroup } from '@/lib/benchmarks';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'benchmarks' });
  return { title: t('title'), description: t('intro') };
}

function Intro({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default async function BenchmarksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('benchmarks');
  const lang = locale === 'de' ? 'de' : 'en';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('intro')}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Intro title={t('whatAreTitle')} body={t('whatAreBody')} />
        <Intro title={t('whyMisleadTitle')} body={t('whyMisleadBody')} />
        <Intro title={t('howWeUseTitle')} body={t('howWeUseBody')} />
      </div>

      <h2 className="mb-4 mt-12 text-lg font-semibold">{t('groupTitle')}</h2>
      <div className="space-y-10">
        {BENCHMARK_GROUPS.map((group) => {
          const items = benchmarksInGroup(group.slug);
          if (!items.length) return null;
          return (
            <section key={group.slug} id={group.slug} className="scroll-mt-20">
              <div className="mb-3 border-b border-border pb-2">
                <h3 className="text-base font-semibold">{group.name[lang]}</h3>
                <p className="text-sm text-muted">{group.blurb[lang]}</p>
              </div>
              <div className="grid gap-3">
                {items.map((b) => (
                  <div key={b.slug} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">{b.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="rounded bg-surface-2 px-2 py-0.5">
                          {t('unit')}: {b.unit}
                        </span>
                        {b.sourceUrl && (
                          <a
                            href={b.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-brand"
                          >
                            {t('source')} <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex gap-2">
                        <Info size={15} className="mt-0.5 shrink-0 text-brand" />
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                            {t('whatItMeasures')}
                          </dt>
                          <dd>{b.what[lang]}</dd>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Eye size={15} className="mt-0.5 shrink-0 text-success" />
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                            {t('howToRead')}
                          </dt>
                          <dd>{b.howToRead[lang]}</dd>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warning" />
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                            {t('caveat')}
                          </dt>
                          <dd className="text-muted">{b.caveat[lang]}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
