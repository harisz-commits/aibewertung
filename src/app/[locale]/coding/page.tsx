import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import codingData from '@/data/coding-languages.json';
import type { LanguageLeaderboard } from '@/lib/coding/aggregate';
import { CodingLanguages } from '@/components/CodingLanguages';

const data = codingData as unknown as {
  meta: { coverage?: string[]; mode?: string };
  leaderboard: LanguageLeaderboard;
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'coding' });
  return { title: t('title'), description: t('intro') };
}

export default async function CodingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('coding');
  const coverage = data.meta.coverage ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('intro')}</p>

      <div className="mt-8">
        <CodingLanguages leaderboard={data.leaderboard} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-base font-semibold">{t('howTitle')}</h2>
          <p className="text-sm leading-relaxed text-muted">{t('howBody')}</p>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-base font-semibold">{t('sourcesTitle')}</h2>
          <p className="text-sm leading-relaxed text-muted">{t('sourcesBody')}</p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-base font-semibold">{t('coverageTitle', { count: coverage.length })}</h2>
        <div className="flex flex-wrap gap-1.5">
          {coverage.map((l) => (
            <span key={l} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted ring-1 ring-border">
              {l}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
