import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Database, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { applyOverrides, getAllModels, getHomeRankings, getLabs, getOverrides, getSnapshotMeta } from '@/lib/data';
import type { ModelView } from '@/lib/types';
import { ModelTable, type TableModel } from '@/components/table/ModelTable';
import { RankingCards } from '@/components/RankingCards';
import { UseCaseAssistant } from '@/components/UseCaseAssistant';
import { formatDate, formatPrice } from '@/lib/format';
import { Badge } from '@/components/badges';

function toTableModel(m: ModelView): TableModel {
  // Drop heavy/unused fields from the client payload. Providers live on the
  // model detail page, so the full endpoint array never ships to the table.
  const { description, descriptionDe, sources, family, providers, ...rest } = m;
  return rest;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const c = await getTranslations('common');

  const ov = await getOverrides();
  const hidden = (slug: string) => Boolean(ov.bySlug[slug]?.isHidden);
  const models = applyOverrides(getAllModels(), ov);
  const tableModels = models.map(toTableModel);
  const rankings = getHomeRankings().map((r) => ({
    ...r,
    models: r.models.filter((m) => !hidden(m.slug))
  }));
  const labs = getLabs();
  const meta = getSnapshotMeta();
  const newest = [...models]
    .filter((m) => m.releaseDate)
    .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''))
    .slice(0, 8);

  const sponsored = ov.featured.find((f) => f.placement === 'table_top' || f.placement === 'homepage_hero');
  const sponsoredModel = sponsored?.modelSlug ? models.find((m) => m.slug === sponsored.modelSlug) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <Database size={12} /> {t('heroModelsCount', { count: meta.modelCount })}
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted sm:text-base">
            {t('heroSubtitle')}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/#models"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg transition hover:opacity-90"
            >
              {t('heroCta')} <ArrowRight size={15} />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-brand/50"
            >
              {c('brand')} · Compare
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <UseCaseAssistant models={tableModels} />
        </div>
      </section>

      {/* Rankings */}
      <section id="rankings" className="scroll-mt-20 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-brand" />
          <h2 className="text-lg font-semibold">{t('rankingsTitle')}</h2>
        </div>
        <RankingCards rankings={rankings} />
      </section>

      {/* Main table */}
      <section id="models" className="scroll-mt-20 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t('tableTitle')}</h2>
          <p className="text-sm text-muted">{t('tableSubtitle')}</p>
        </div>
        {sponsored && (
          <a
            href={sponsored.targetUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm transition hover:border-amber-500/70"
          >
            <span className="flex items-center gap-2">
              <Badge tone="sponsored">{sponsored.label || c('sponsored')}</Badge>
              <span className="font-medium">{sponsoredModel?.name ?? sponsored.targetUrl}</span>
            </span>
            <span className="text-xs text-muted">{c('learnMore')} →</span>
          </a>
        )}
        <ModelTable models={tableModels} labs={labs} />
      </section>

      {/* Today in LLMs */}
      <section id="news" className="scroll-mt-20 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t('newModelsTitle')}</h2>
          <p className="text-sm text-muted">{t('newModelsSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((m) => (
            <Link
              key={m.id}
              href={`/models/${m.slug}`}
              className="rounded-xl border border-border bg-surface p-4 transition hover:border-brand/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{m.lab}</span>
                {m.isNew && <Badge tone="success">{c('new')}</Badge>}
              </div>
              <div className="mt-1 truncate font-medium">{m.name}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{formatDate(m.releaseDate, locale)}</span>
                <span className="tabular-nums">{formatPrice(m.cheapestOutputPer1m)}/1M</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
