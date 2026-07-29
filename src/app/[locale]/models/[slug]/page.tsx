import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Check, ExternalLink, Minus, ArrowLeft, ShieldAlert, Info } from 'lucide-react';
import clsx from 'clsx';
import { Link } from '@/i18n/navigation';
import { getModelBySlug, getOverrides, applyOverrides } from '@/lib/data';
import type { ModelView } from '@/lib/types';
import {
  CATEGORY_LABELS,
  SCORE_LABELS,
  formatContext,
  formatCount,
  formatDate,
  formatPrice,
  formatScore,
  scoreBg,
  stripMarkdown
} from '@/lib/format';
import { Badge, StatusBadges } from '@/components/badges';
import { worthIt, explainOverall, ratingHighlights } from '@/lib/explain';
import { BENCHMARKS_BY_SLUG, benchmarksInGroup } from '@/lib/benchmarks';
import type { BenchmarkGroupSlug } from '@/lib/types';

function relevantBenchmarks(category: string) {
  const groups: BenchmarkGroupSlug[] =
    category === 'coding'
      ? ['coding', 'intelligence']
      : category === 'reasoning'
        ? ['reasoning', 'math', 'intelligence']
        : category === 'multimodal'
          ? ['multimodal', 'intelligence']
          : ['intelligence', 'human_preference'];
  return groups.flatMap((g) => benchmarksInGroup(g)).slice(0, 6);
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getModelBySlug(slug);
  if (!m) return { title: 'Model not found' };
  return {
    title: `${m.name} - price, providers, context & scores`,
    description: stripMarkdown(m.description).slice(0, 155) || `${m.name} by ${m.lab}`
  };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums">{formatScore(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={clsx(
            'h-full rounded-full',
            value >= 80 ? 'bg-success' : value >= 60 ? 'bg-brand' : value >= 40 ? 'bg-warning' : 'bg-danger'
          )}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
    </div>
  );
}

function FeatureRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check size={15} className="text-success" />
      ) : (
        <Minus size={15} className="text-muted/50" />
      )}
      <span className={ok ? '' : 'text-muted/60'}>{label}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function ModelDetailPage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const base = getModelBySlug(slug);
  if (!base) notFound();
  const ov = await getOverrides();
  if (ov.bySlug[base.slug]?.isHidden) notFound();
  const m = applyOverrides([base], ov)[0] ?? base;

  const t = await getTranslations('model');
  const c = await getTranslations('common');
  const lang = locale === 'de' ? 'de' : 'en';
  const desc = stripMarkdown(m.description);

  const scoreKeys = Object.keys(SCORE_LABELS).filter((k) => k !== 'overall') as (keyof ModelView['scores'])[];

  const feats: { ok: boolean; label: string }[] = [
    { ok: m.features.tools, label: 'Tool calling' },
    { ok: m.features.functionCalling, label: 'Function calling' },
    { ok: m.features.jsonMode, label: 'JSON mode' },
    { ok: m.features.structuredOutput, label: 'Structured output' },
    { ok: m.features.vision, label: 'Vision' },
    { ok: m.features.audio, label: 'Audio' },
    { ok: m.features.reasoning, label: 'Reasoning' },
    { ok: m.features.coding, label: 'Coding' },
    { ok: m.features.streaming, label: 'Streaming' },
    { ok: m.features.localDeployment, label: 'Local deployment' }
  ];

  const worthItText = worthIt(m, lang);
  const overallWhy = explainOverall(m, lang);
  const highlights = ratingHighlights(m, lang);
  const benchmarks = m.benchmarks ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/#models" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> {t('backToTable')}
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{m.name}</h1>
            <StatusBadges model={m} t={(k) => c(k)} />
            {m.isVerified && <Badge tone="success">✓ {c('verified')}</Badge>}
            {m.isFeatured && <Badge tone="sponsored">{c('sponsored')}</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{m.lab}</span>
            <span>·</span>
            <span>{CATEGORY_LABELS[m.category]?.[lang] ?? m.category}</span>
            <span>·</span>
            <span>{m.isOpenWeight ? c('openWeight') : c('closed')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {m.affiliateUrl && (
            <a
              href={m.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg transition hover:opacity-90"
            >
              {c('visit')} <ExternalLink size={14} />
            </a>
          )}
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted">{SCORE_LABELS.overall[lang]}</div>
            <div className={clsx('mt-1 rounded-lg px-3 py-1.5 text-2xl font-bold tabular-nums', scoreBg(m.scores.overall))}>
              {formatScore(m.scores.overall)}
            </div>
          </div>
        </div>
      </div>

      {desc && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{desc}</p>}
      {m.scoresEstimated && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
          <Badge tone="warning">{c('estimated')}</Badge>
          <span>{t('noBenchmarks')}</span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: overview + capabilities */}
        <div className="space-y-8 lg:col-span-2">
          {/* Overview */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{t('overview')}</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Meta label={t('releaseDate')} value={formatDate(m.releaseDate, locale)} />
              <Meta label={t('contextWindow')} value={formatContext(m.contextWindow)} />
              <Meta label={t('maxOutput')} value={formatContext(m.maxOutputTokens)} />
              <Meta label={t('parameters')} value={m.parameterCount ?? '-'} />
              <Meta label={t('license')} value={m.license ?? '-'} />
              <Meta label={t('inputModalities')} value={m.inputModalities.join(', ')} />
              <Meta label={t('outputModalities')} value={m.outputModalities.join(', ')} />
              <Meta label={t('cheapestOverall')} value={`${formatPrice(m.cheapestInputPer1m)} / ${formatPrice(m.cheapestOutputPer1m)}`} />
              <Meta label={c('lastChecked')} value={formatDate(m.lastCheckedAt, locale)} />
            </dl>
          </section>

          {/* Capabilities */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{t('capabilities')}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {feats.map((fe) => (
                <FeatureRow key={fe.label} ok={fe.ok} label={fe.label} />
              ))}
            </div>
          </section>

          {/* Providers & prices */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{t('providersPrices')}</h2>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">{c('provider')}</th>
                    <th className="py-2 px-3 text-right font-medium">{t('inputModalities')} /1M</th>
                    <th className="py-2 px-3 text-right font-medium">{t('outputModalities')} /1M</th>
                    <th className="py-2 px-3 text-right font-medium">{t('contextWindow')}</th>
                    <th className="py-2 pl-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {m.providers.map((p, i) => (
                    <tr key={`${p.providerSlug}-${i}`} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium">{p.providerName}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatPrice(p.inputPricePer1m)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatPrice(p.outputPricePer1m)}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-muted">{formatContext(p.contextWindow)}</td>
                      <td className="py-2 pl-3 text-right">
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rating explained (plain language, deterministic) */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ratingTitle')}</h2>
            <p className="mt-1 text-xs text-muted">{t('ratingIntro')}</p>
            <p className="mt-3 text-sm leading-relaxed">{overallWhy}</p>
            <ul className="mt-4 space-y-2.5">
              {highlights.map((h) => (
                <li key={h.key} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={clsx(
                      'mt-0.5 inline-flex min-w-[2.2rem] justify-center rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                      scoreBg(h.value)
                    )}
                  >
                    {formatScore(h.value)}
                  </span>
                  <span>
                    <span className="font-medium">{SCORE_LABELS[h.key][lang]}:</span>{' '}
                    <span className="text-muted">{h.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Benchmarks */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('benchmarks')}</h2>
              <Link href="/benchmarks" className="text-xs font-medium text-brand hover:underline">
                {t('benchmarkGlossary')} →
              </Link>
            </div>

            {benchmarks.length > 0 ? (
              <div className="space-y-3">
                {benchmarks.map((r) => {
                  const def = BENCHMARKS_BY_SLUG[r.benchmarkSlug];
                  if (!def) return null;
                  return (
                    <div key={r.benchmarkSlug} className="border-b border-border/60 pb-3 last:border-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{def.name}</span>
                        <span className="tabular-nums">
                          {r.rawValue != null ? `${r.rawValue}` : '-'} <span className="text-muted">{def.unit}</span>
                          {r.isEstimated && <span className="ml-1 text-warning">*</span>}
                        </span>
                      </div>
                      {r.normalized != null && (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              r.normalized >= 80 ? 'bg-success' : r.normalized >= 60 ? 'bg-brand' : r.normalized >= 40 ? 'bg-warning' : 'bg-danger'
                            )}
                            style={{ width: `${Math.max(2, r.normalized)}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                        <span>{def.what[lang]}</span>
                      </div>
                      {(r.sourceName || r.lastCheckedAt) && (
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                          {r.sourceUrl ? (
                            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                              {r.sourceName}
                            </a>
                          ) : (
                            r.sourceName && <span>{r.sourceName}</span>
                          )}
                          {r.lastCheckedAt && <span>· {formatDate(r.lastCheckedAt, locale)}</span>}
                          {r.isDisputed && <Badge tone="warning">disputed</Badge>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted">
                  <Info size={14} className="mt-0.5 shrink-0 text-brand" />
                  <span>{t('benchmarksNotMeasured')}</span>
                </div>
                <ul className="space-y-2">
                  {relevantBenchmarks(m.category).map((def) => (
                    <li key={def.slug} className="text-sm">
                      <Link href={`/benchmarks#${def.groupSlug}`} className="font-medium hover:text-brand">
                        {def.name}
                      </Link>
                      <span className="text-muted"> - {def.what[lang]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Right: scores + worth-it + local + sources */}
        <div className="space-y-6">
          {/* Worth it */}
          <section className="rounded-xl border border-brand/30 bg-brand/5 p-5">
            <h2 className="mb-2 text-sm font-semibold">{t('worthItTitle')}</h2>
            <p className="text-sm text-muted">{worthItText}</p>
          </section>

          {/* Use-case scores */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{t('scores')}</h2>
            <div className="space-y-3">
              {scoreKeys.map((k) => (
                <ScoreBar key={k} label={SCORE_LABELS[k][lang]} value={m.scores[k]} />
              ))}
            </div>
          </section>

          {/* Adoption (open-weight only - closed models are not published on HF) */}
          {(m.hfDownloads30d != null || m.hfLikes != null) && (
            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">{t('adoptionTitle')}</h2>
              <p className="mb-3 text-xs text-muted">{t('adoptionIntro')}</p>
              <dl className="grid grid-cols-3 gap-3">
                <Meta label={t('downloads30d')} value={formatCount(m.hfDownloads30d)} />
                <Meta label={t('downloadsAllTime')} value={formatCount(m.hfDownloadsAllTime)} />
                <Meta label={t('likes')} value={formatCount(m.hfLikes)} />
              </dl>
              {m.hfId && (
                <a
                  href={`https://huggingface.co/${m.hfId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                >
                  {m.hfId} <ExternalLink size={12} />
                </a>
              )}
            </section>
          )}

          {/* Local deployment */}
          {m.isOpenWeight && (
            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t('localDeployment')}</h2>
              <p className="text-sm text-muted">
                {lang === 'de'
                  ? 'Open-Weight - grundsätzlich lokal ausführbar (Ollama, LM Studio, vLLM, llama.cpp), abhängig von Größe und Hardware.'
                  : 'Open-weight - generally runnable locally (Ollama, LM Studio, vLLM, llama.cpp), depending on size and hardware.'}
              </p>
              {m.parameterCount && (
                <p className="mt-1 text-sm">
                  {t('parameters')}: <span className="font-medium">{m.parameterCount}</span>
                </p>
              )}
            </section>
          )}

          {/* Sources */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{t('sources')}</h2>
            <ul className="space-y-2 text-sm">
              {m.sources.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      {s.name}
                    </a>
                  ) : (
                    <span>{s.name}</span>
                  )}
                  <Badge tone="neutral">{s.reliability}</Badge>
                </li>
              ))}
            </ul>
            <Link
              href="/methodology"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-fg"
            >
              <ShieldAlert size={13} /> {t('reportIssue')}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
