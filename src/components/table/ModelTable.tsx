'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, ExternalLink, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { Link } from '@/i18n/navigation';
import type { ModelView } from '@/lib/types';
import {
  CATEGORY_LABELS,
  SCORE_LABELS,
  formatContext,
  formatDate,
  formatPrice,
  formatScore,
  scoreBg
} from '@/lib/format';
import { Badge, StatusBadges } from '@/components/badges';

export type TableModel = Omit<ModelView, 'description' | 'descriptionDe' | 'sources' | 'family'>;

// Score dimensions users can sort the main table by.
const SCORE_SORTS = [
  'overall',
  'coding',
  'reasoning',
  'math',
  'agentTool',
  'vision',
  'german',
  'rag',
  'longContext',
  'cheapApi',
  'pricePerformance',
  'speed'
] as const;

type SortKey = (typeof SCORE_SORTS)[number] | 'context' | 'inputPrice' | 'outputPrice' | 'newest' | 'name';

const CAP_FILTERS = ['vision', 'audio', 'reasoning', 'tools', 'jsonMode'] as const;
type CapFilter = (typeof CAP_FILTERS)[number];

function ScorePill({ value }: { value: number }) {
  return (
    <span
      className={clsx(
        'inline-flex min-w-[2.4rem] justify-center rounded-md px-1.5 py-1 text-xs font-semibold tabular-nums',
        scoreBg(value)
      )}
    >
      {formatScore(value)}
    </span>
  );
}

export function ModelTable({
  models,
  labs
}: {
  models: TableModel[];
  labs: { slug: string; name: string; count: number }[];
}) {
  const t = useTranslations('table');
  const f = useTranslations('filters');
  const c = useTranslations('common');
  const locale = useLocale();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [deployment, setDeployment] = useState<'all' | 'local'>('all');
  const [openness, setOpenness] = useState<'all' | 'open_weight' | 'closed'>('all');
  const [caps, setCaps] = useState<Set<CapFilter>>(new Set());
  const [freeOnly, setFreeOnly] = useState(false);
  const [lab, setLab] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number | null>(null); // max output $/1M
  const [minContext, setMinContext] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('overall');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleCap(cap: CapFilter) {
    setCaps((prev) => {
      const next = new Set(prev);
      next.has(cap) ? next.delete(cap) : next.add(cap);
      return next;
    });
  }

  function resetFilters() {
    setQuery('');
    setCategory('all');
    setDeployment('all');
    setOpenness('all');
    setCaps(new Set());
    setFreeOnly(false);
    setLab('all');
    setMaxPrice(null);
    setMinContext(null);
    setSort('overall');
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = models.filter((m) => {
      if (category !== 'all' && m.category !== category) return false;
      if (deployment === 'local' && !m.isOpenWeight) return false;
      if (openness === 'open_weight' && !m.isOpenWeight) return false;
      if (openness === 'closed' && m.isOpenWeight) return false;
      if (freeOnly && (m.cheapestOutputPer1m ?? 1) !== 0) return false;
      if (lab !== 'all' && m.labSlug !== lab) return false;
      if (maxPrice != null && (m.cheapestOutputPer1m == null || m.cheapestOutputPer1m > maxPrice)) return false;
      if (minContext != null && (m.contextWindow == null || m.contextWindow < minContext)) return false;
      for (const cap of caps) {
        if (!m.features[cap]) return false;
      }
      if (q) {
        const hay = `${m.name} ${m.lab} ${m.slug} ${m.providers.map((p) => p.providerName).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'context':
          return (b.contextWindow ?? 0) - (a.contextWindow ?? 0);
        case 'inputPrice':
          return (a.cheapestInputPer1m ?? Infinity) - (b.cheapestInputPer1m ?? Infinity);
        case 'outputPrice':
          return (a.cheapestOutputPer1m ?? Infinity) - (b.cheapestOutputPer1m ?? Infinity);
        case 'newest':
          return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.scores[sort] - a.scores[sort];
      }
    });
    return rows;
  }, [models, query, category, deployment, openness, caps, freeOnly, lab, maxPrice, minContext, sort]);

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const categories = ['all', 'chat', 'reasoning', 'coding', 'multimodal', 'embedding', 'reranker'];

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-y border-border bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c('search')}
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? f('all') : CATEGORY_LABELS[cat]?.[locale === 'de' ? 'de' : 'en'] ?? cat}
              </option>
            ))}
          </select>

          <select
            value={lab}
            onChange={(e) => setLab(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="all">{f('lab')}: {f('all')}</option>
            {labs.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name} ({l.count})
              </option>
            ))}
          </select>

          <select
            value={maxPrice ?? ''}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">{t('output')}: {f('all')}</option>
            <option value="1">≤ $1 /1M</option>
            <option value="3">≤ $3 /1M</option>
            <option value="10">≤ $10 /1M</option>
            <option value="20">≤ $20 /1M</option>
          </select>

          <select
            value={minContext ?? ''}
            onChange={(e) => setMinContext(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">{t('context')}: {f('all')}</option>
            <option value="32000">≥ 32K</option>
            <option value="128000">≥ 128K</option>
            <option value="200000">≥ 200K</option>
            <option value="1000000">≥ 1M</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand"
          >
            <optgroup label={f('sortBy')}>
              {SCORE_SORTS.map((k) => (
                <option key={k} value={k}>
                  {SCORE_LABELS[k][locale === 'de' ? 'de' : 'en']}
                </option>
              ))}
              <option value="context">{t('context')}</option>
              <option value="inputPrice">{t('input')}</option>
              <option value="outputPrice">{t('output')}</option>
              <option value="newest">{c('new')}</option>
              <option value="name">{t('model')}</option>
            </optgroup>
          </select>
        </div>

        {/* Capability chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {CAP_FILTERS.map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() => toggleCap(cap)}
              className={clsx(
                'rounded-full border px-2.5 py-1 text-xs transition',
                caps.has(cap)
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border text-muted hover:text-fg'
              )}
            >
              {f(cap)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDeployment(deployment === 'local' ? 'all' : 'local')}
            className={clsx(
              'rounded-full border px-2.5 py-1 text-xs transition',
              deployment === 'local' ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted hover:text-fg'
            )}
          >
            {f('local')}
          </button>
          <button
            type="button"
            onClick={() => setOpenness(openness === 'open_weight' ? 'all' : 'open_weight')}
            className={clsx(
              'rounded-full border px-2.5 py-1 text-xs transition',
              openness === 'open_weight' ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted hover:text-fg'
            )}
          >
            {f('openWeight')}
          </button>
          <button
            type="button"
            onClick={() => setFreeOnly((v) => !v)}
            className={clsx(
              'rounded-full border px-2.5 py-1 text-xs transition',
              freeOnly ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted hover:text-fg'
            )}
          >
            {f('free')}
          </button>

          <span className="ml-auto flex items-center gap-2 text-xs text-muted">
            {t('showingCount', { shown: filtered.length, total: models.length })}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:text-fg"
            >
              <X size={12} /> {f('reset')}
            </button>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scroll-thin rounded-xl border border-border">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <th className="px-3 py-3 font-medium">{t('model')}</th>
              <th className="px-3 py-3 font-medium">{t('category')}</th>
              <th className="px-3 py-3 text-center font-medium">{t('score')}</th>
              <th className="px-3 py-3 text-right font-medium">{t('context')}</th>
              <th className="px-3 py-3 text-right font-medium">{t('input')}</th>
              <th className="px-3 py-3 text-right font-medium">{t('output')}</th>
              <th className="px-3 py-3 text-center font-medium">{t('providers')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const isOpen = expanded.has(m.id);
              return (
                <FragmentRow
                  key={m.id}
                  model={m}
                  isOpen={isOpen}
                  onToggle={() => toggleRow(m.id)}
                  locale={locale}
                  labels={{
                    apiModelId: t('apiModelId'),
                    input: t('input'),
                    output: t('output'),
                    cachedInput: t('cachedInput'),
                    context: t('context'),
                    maxOutput: t('maxOutput'),
                    uptime: t('uptime'),
                    availability: t('availability'),
                    lastChecked: c('lastChecked'),
                    viewDetails: c('viewDetails')
                  }}
                  statusT={(k) => c(k)}
                />
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-muted">
                  {t('noResults')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  model: m,
  isOpen,
  onToggle,
  locale,
  labels,
  statusT
}: {
  model: TableModel;
  isOpen: boolean;
  onToggle: () => void;
  locale: string;
  labels: Record<string, string>;
  statusT: (k: string) => string;
}) {
  const catLabel = CATEGORY_LABELS[m.category]?.[locale === 'de' ? 'de' : 'en'] ?? m.category;
  return (
    <>
      <tr
        className={clsx(
          'border-t border-border transition hover:bg-surface-2/60',
          isOpen && 'bg-surface-2/40'
        )}
      >
        <td className="px-2 py-3 align-top">
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand"
            className="mt-0.5 text-muted transition hover:text-fg"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-col gap-1">
            <Link href={`/models/${m.slug}`} className="font-medium leading-tight hover:text-brand">
              {m.name}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <span>{m.lab}</span>
              <StatusBadges model={m as ModelView} t={statusT} />
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <span className="whitespace-nowrap text-xs text-muted">{catLabel}</span>
        </td>
        <td className="px-3 py-3 text-center">
          <ScorePill value={m.scores.overall} />
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-muted">{formatContext(m.contextWindow)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{formatPrice(m.cheapestInputPer1m)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{formatPrice(m.cheapestOutputPer1m)}</td>
        <td className="px-3 py-3 text-center">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-brand/50 hover:text-fg"
          >
            {m.providerCount}
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t border-border bg-surface-2/30">
          <td colSpan={8} className="px-3 py-3 sm:px-6">
            <div className="overflow-x-auto scroll-thin rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[720px] text-xs">
                <thead className="bg-surface-2 text-left uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">{statusT('provider')}</th>
                    <th className="px-3 py-2 font-medium">{labels.apiModelId}</th>
                    <th className="px-3 py-2 text-right font-medium">{labels.input}</th>
                    <th className="px-3 py-2 text-right font-medium">{labels.output}</th>
                    <th className="px-3 py-2 text-right font-medium">{labels.cachedInput}</th>
                    <th className="px-3 py-2 text-right font-medium">{labels.context}</th>
                    <th className="px-3 py-2 text-right font-medium">{labels.uptime}</th>
                    <th className="px-3 py-2 text-center font-medium">{labels.availability}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {m.providers.map((p, i) => (
                    <tr key={`${p.providerSlug}-${i}`} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{p.providerName}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted">{p.apiModelId ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPrice(p.inputPricePer1m)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPrice(p.outputPricePer1m)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPrice(p.cachedInputPricePer1m)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted">{formatContext(p.contextWindow)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted">
                        {p.uptime30m != null ? `${p.uptime30m.toFixed(0)}%` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={clsx(
                            'inline-block h-2 w-2 rounded-full',
                            p.availabilityStatus === 'available' ? 'bg-success' : 'bg-warning'
                          )}
                          title={p.availabilityStatus}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-muted hover:text-brand"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted">
              <span>
                {labels.lastChecked}: {formatDate(m.lastCheckedAt, locale)}
              </span>
              <Link href={`/models/${m.slug}`} className="font-medium text-brand hover:underline">
                {labels.viewDetails} →
              </Link>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
