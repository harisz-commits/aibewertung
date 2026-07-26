'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from '@/i18n/navigation';
import type { ModelView } from '@/lib/types';
import {
  CATEGORY_LABELS,
  SCORE_LABELS,
  formatContext,
  formatDate,
  formatLatency,
  formatPrice,
  formatScore,
  formatSpeed,
  scoreBg
} from '@/lib/format';
import { Badge, StatusBadges } from '@/components/badges';
import { RangeSlider } from './RangeSlider';
import { ModelCard } from './ModelCard';

export type TableModel = Omit<ModelView, 'description' | 'descriptionDe' | 'sources' | 'family'>;

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
  'pricePerformance'
] as const;

type SortKey =
  | (typeof SCORE_SORTS)[number]
  | 'context'
  | 'inputPrice'
  | 'outputPrice'
  | 'throughput'
  | 'latency'
  | 'newest'
  | 'name';

const CAP_FILTERS = ['vision', 'audio', 'reasoning', 'tools', 'jsonMode'] as const;
type CapFilter = (typeof CAP_FILTERS)[number];
const MODALITIES = ['image', 'audio', 'file'] as const;

// Discrete stops for the range sliders (handle non-linear domains cleanly).
const PRICE_STOPS = [0, 0.25, 0.5, 1, 2, 5, 10, 20, 50];
const CONTEXT_STOPS = [4000, 16000, 32000, 64000, 128000, 200000, 512000, 1000000, 2000000];
const INDEX_STOPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

type Range = [number, number];
const fullRange = (stops: number[]): Range => [0, stops.length - 1];
const isActiveRange = (r: Range, stops: number[]) => r[0] > 0 || r[1] < stops.length - 1;
const lowerBound = (r: Range, stops: number[]) => stops[r[0]];
const upperBound = (r: Range, stops: number[]) => (r[1] >= stops.length - 1 ? Infinity : stops[r[1]]);

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

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-2.5 py-1 text-xs transition',
        active ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted hover:text-fg'
      )}
    >
      {children}
    </button>
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
  const lang = locale === 'de' ? 'de' : 'en';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [openness, setOpenness] = useState<'all' | 'open_weight' | 'closed'>('all');
  const [caps, setCaps] = useState<Set<CapFilter>>(new Set());
  const [mods, setMods] = useState<Set<string>>(new Set());
  const [freeOnly, setFreeOnly] = useState(false);
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [lab, setLab] = useState('all');
  const [releasedMonths, setReleasedMonths] = useState(0); // 0 = any
  const [outPrice, setOutPrice] = useState<Range>(fullRange(PRICE_STOPS));
  const [inPrice, setInPrice] = useState<Range>(fullRange(PRICE_STOPS));
  const [ctx, setCtx] = useState<Range>(fullRange(CONTEXT_STOPS));
  const [intel, setIntel] = useState<Range>(fullRange(INDEX_STOPS));
  const [codingIdx, setCodingIdx] = useState<Range>(fullRange(INDEX_STOPS));
  const [sort, setSort] = useState<SortKey>('overall');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleSet<T>(setter: (fn: (p: Set<T>) => Set<T>) => void, val: T) {
    setter((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  }

  function resetFilters() {
    setQuery('');
    setCategory('all');
    setOpenness('all');
    setCaps(new Set());
    setMods(new Set());
    setFreeOnly(false);
    setShowDeprecated(false);
    setLab('all');
    setReleasedMonths(0);
    setOutPrice(fullRange(PRICE_STOPS));
    setInPrice(fullRange(PRICE_STOPS));
    setCtx(fullRange(CONTEXT_STOPS));
    setIntel(fullRange(INDEX_STOPS));
    setCodingIdx(fullRange(INDEX_STOPS));
    setSort('overall');
  }

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    (openness !== 'all' ? 1 : 0) +
    caps.size +
    mods.size +
    (freeOnly ? 1 : 0) +
    (showDeprecated ? 1 : 0) +
    (lab !== 'all' ? 1 : 0) +
    (releasedMonths ? 1 : 0) +
    (isActiveRange(outPrice, PRICE_STOPS) ? 1 : 0) +
    (isActiveRange(inPrice, PRICE_STOPS) ? 1 : 0) +
    (isActiveRange(ctx, CONTEXT_STOPS) ? 1 : 0) +
    (isActiveRange(intel, INDEX_STOPS) ? 1 : 0) +
    (isActiveRange(codingIdx, INDEX_STOPS) ? 1 : 0);

  const now = Date.now();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = models.filter((m) => {
      if (!showDeprecated && (m.status === 'deprecated' || m.status === 'inactive')) return false;
      if (category !== 'all' && m.category !== category) return false;
      if (openness === 'open_weight' && !m.isOpenWeight) return false;
      if (openness === 'closed' && m.isOpenWeight) return false;
      if (freeOnly && (m.cheapestOutputPer1m ?? 1) !== 0) return false;
      if (lab !== 'all' && m.labSlug !== lab) return false;
      for (const cap of caps) if (!m.features[cap]) return false;
      for (const mod of mods) if (!m.inputModalities.includes(mod)) return false;

      if (releasedMonths && (!m.releaseDate || now - new Date(m.releaseDate).getTime() > releasedMonths * 30 * 864e5))
        return false;

      if (isActiveRange(outPrice, PRICE_STOPS)) {
        const p = m.cheapestOutputPer1m;
        if (p == null || p < lowerBound(outPrice, PRICE_STOPS) || p > upperBound(outPrice, PRICE_STOPS)) return false;
      }
      if (isActiveRange(inPrice, PRICE_STOPS)) {
        const p = m.cheapestInputPer1m;
        if (p == null || p < lowerBound(inPrice, PRICE_STOPS) || p > upperBound(inPrice, PRICE_STOPS)) return false;
      }
      if (isActiveRange(ctx, CONTEXT_STOPS)) {
        const cw = m.contextWindow;
        if (cw == null || cw < lowerBound(ctx, CONTEXT_STOPS) || cw > upperBound(ctx, CONTEXT_STOPS)) return false;
      }
      if (isActiveRange(intel, INDEX_STOPS)) {
        const v = m.aaIntelligence;
        if (v == null || v < lowerBound(intel, INDEX_STOPS) || v > upperBound(intel, INDEX_STOPS)) return false;
      }
      if (isActiveRange(codingIdx, INDEX_STOPS)) {
        const v = m.aaCoding;
        if (v == null || v < lowerBound(codingIdx, INDEX_STOPS) || v > upperBound(codingIdx, INDEX_STOPS)) return false;
      }

      if (q) {
        const hay = `${m.name} ${m.lab} ${m.slug} ${m.providers.map((p) => p.providerName).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...rows].sort((a, b) => {
      switch (sort) {
        case 'context':
          return (b.contextWindow ?? 0) - (a.contextWindow ?? 0);
        case 'inputPrice':
          return (a.cheapestInputPer1m ?? Infinity) - (b.cheapestInputPer1m ?? Infinity);
        case 'outputPrice':
          return (a.cheapestOutputPer1m ?? Infinity) - (b.cheapestOutputPer1m ?? Infinity);
        case 'throughput':
          return (b.outputSpeedTps ?? -1) - (a.outputSpeedTps ?? -1);
        case 'latency':
          return (a.ttftMs ?? Infinity) - (b.ttftMs ?? Infinity);
        case 'newest':
          return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.scores[sort] - a.scores[sort];
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, query, category, openness, caps, mods, freeOnly, showDeprecated, lab, releasedMonths, outPrice, inPrice, ctx, intel, codingIdx, sort]);

  function toggleRow(id: string) {
    toggleSet(setExpanded, id);
  }

  const categories = ['all', 'chat', 'reasoning', 'coding', 'multimodal', 'embedding', 'reranker'];
  const isScoreSort = (SCORE_SORTS as readonly string[]).includes(sort);
  const activeScoreKey = (isScoreSort ? sort : 'overall') as keyof TableModel['scores'];
  const scoreHeader = activeScoreKey === 'overall' ? t('score') : SCORE_LABELS[activeScoreKey][lang];

  const priceFmt = (v: number, last: boolean) => (v === 0 ? 'FREE' : `$${v}${last ? '+' : ''}`);
  const ctxFmt = (v: number, last: boolean) => `${formatContext(v)}${last ? '+' : ''}`;
  const idxFmt = (v: number) => String(v);

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-y border-border bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c('search')}
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition',
              activeFilterCount > 0 || showFilters
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border bg-surface text-muted hover:text-fg'
            )}
          >
            <SlidersHorizontal size={15} /> {f('title')}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-fg">{activeFilterCount}</span>
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-brand"
          >
            <optgroup label={f('sortBy')}>
              {SCORE_SORTS.map((k) => (
                <option key={k} value={k}>
                  {SCORE_LABELS[k][lang]}
                </option>
              ))}
              <option value="throughput">{t('throughput')}</option>
              <option value="latency">{t('latency')}</option>
              <option value="context">{t('context')}</option>
              <option value="inputPrice">{t('input')}</option>
              <option value="outputPrice">{t('output')}</option>
              <option value="newest">{c('new')}</option>
              <option value="name">{t('model')}</option>
            </optgroup>
          </select>

          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setView('table')}
              aria-label={t('viewList')}
              className={clsx('px-2.5 py-2', view === 'table' ? 'bg-brand text-brand-fg' : 'bg-surface text-muted hover:text-fg')}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label={t('viewGrid')}
              className={clsx('px-2.5 py-2', view === 'grid' ? 'bg-brand text-brand-fg' : 'bg-surface text-muted hover:text-fg')}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <span className="ml-auto flex items-center gap-2 text-xs text-muted">
            {t('showingCount', { shown: filtered.length, total: models.length })}
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:text-fg">
              <X size={12} /> {f('reset')}
            </button>
          </span>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FilterLabel>{f('category')}</FilterLabel>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? f('all') : CATEGORY_LABELS[cat]?.[lang] ?? cat}
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <FilterLabel>{f('lab')}</FilterLabel>
                <select value={lab} onChange={(e) => setLab(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand">
                  <option value="all">{f('all')}</option>
                  {labs.map((l) => (
                    <option key={l.slug} value={l.slug}>
                      {l.name} ({l.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FilterLabel>{f('capabilities')}</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {CAP_FILTERS.map((cap) => (
                  <Toggle key={cap} active={caps.has(cap)} onClick={() => toggleSet(setCaps, cap)}>
                    {f(cap)}
                  </Toggle>
                ))}
              </div>
              <FilterLabel className="mt-3">{f('inputModalities')}</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {MODALITIES.map((mod) => (
                  <Toggle key={mod} active={mods.has(mod)} onClick={() => toggleSet(setMods, mod)}>
                    {f(mod)}
                  </Toggle>
                ))}
              </div>
              <FilterLabel className="mt-3">{f('openness')}</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                <Toggle active={openness === 'open_weight'} onClick={() => setOpenness(openness === 'open_weight' ? 'all' : 'open_weight')}>
                  {f('openWeight')}
                </Toggle>
                <Toggle active={openness === 'closed'} onClick={() => setOpenness(openness === 'closed' ? 'all' : 'closed')}>
                  {f('closed')}
                </Toggle>
                <Toggle active={freeOnly} onClick={() => setFreeOnly((v) => !v)}>
                  {f('free')}
                </Toggle>
                <Toggle active={showDeprecated} onClick={() => setShowDeprecated((v) => !v)}>
                  {f('showDeprecated')}
                </Toggle>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <FilterLabel>{f('priceOutput')}</FilterLabel>
                <RangeSlider stops={PRICE_STOPS} value={outPrice} onChange={setOutPrice} formatValue={priceFmt} />
              </div>
              <div>
                <FilterLabel>{f('priceInput')}</FilterLabel>
                <RangeSlider stops={PRICE_STOPS} value={inPrice} onChange={setInPrice} formatValue={priceFmt} />
              </div>
              <div>
                <FilterLabel>{f('contextRange')}</FilterLabel>
                <RangeSlider stops={CONTEXT_STOPS} value={ctx} onChange={setCtx} formatValue={ctxFmt} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <FilterLabel>{f('intelligence')}</FilterLabel>
                <RangeSlider stops={INDEX_STOPS} value={intel} onChange={setIntel} formatValue={idxFmt} />
              </div>
              <div>
                <FilterLabel>{f('coding')}</FilterLabel>
                <RangeSlider stops={INDEX_STOPS} value={codingIdx} onChange={setCodingIdx} formatValue={idxFmt} />
              </div>
              <div>
                <FilterLabel>{f('released')}</FilterLabel>
                <select value={releasedMonths} onChange={(e) => setReleasedMonths(Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand">
                  <option value={0}>{f('anyTime')}</option>
                  <option value={3}>{f('within', { n: 3 })}</option>
                  <option value={6}>{f('within', { n: 6 })}</option>
                  <option value={12}>{f('within', { n: 12 })}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid view */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              scoreKey={activeScoreKey}
              locale={locale}
              statusT={(k) => c(k)}
              labels={{ context: t('context'), output: t('output'), speed: t('speed'), providers: t('providers') }}
            />
          ))}
          {filtered.length === 0 && <p className="col-span-full py-16 text-center text-muted">{t('noResults')}</p>}
        </div>
      ) : (
        /* Table view */
        <div className="overflow-x-auto scroll-thin rounded-xl border border-border">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="w-8 px-2 py-3"></th>
                <th className="px-3 py-3 font-medium">{t('model')}</th>
                <th className="px-3 py-3 font-medium">{t('category')}</th>
                <th className="px-3 py-3 text-center font-medium">{scoreHeader}</th>
                <th className="px-3 py-3 text-right font-medium">{t('context')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('input')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('output')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('throughput')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('latency')}</th>
                <th className="px-3 py-3 text-center font-medium">{t('providers')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <FragmentRow
                  key={m.id}
                  model={m}
                  isOpen={expanded.has(m.id)}
                  onToggle={() => toggleRow(m.id)}
                  scoreKey={activeScoreKey}
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-muted">
                    {t('noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mb-1.5 text-xs font-medium uppercase tracking-wide text-muted', className)}>{children}</div>;
}

function FragmentRow({
  model: m,
  isOpen,
  onToggle,
  scoreKey,
  locale,
  labels,
  statusT
}: {
  model: TableModel;
  isOpen: boolean;
  onToggle: () => void;
  scoreKey: keyof TableModel['scores'];
  locale: string;
  labels: Record<string, string>;
  statusT: (k: string) => string;
}) {
  const catLabel = CATEGORY_LABELS[m.category]?.[locale === 'de' ? 'de' : 'en'] ?? m.category;
  return (
    <>
      <tr className={clsx('border-t border-border transition hover:bg-surface-2/60', isOpen && 'bg-surface-2/40')}>
        <td className="px-2 py-3 align-top">
          <button type="button" onClick={onToggle} aria-label="Expand" className="mt-0.5 text-muted transition hover:text-fg">
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
          <ScorePill value={m.scores[scoreKey]} />
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-muted">{formatContext(m.contextWindow)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{formatPrice(m.cheapestInputPer1m)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{formatPrice(m.cheapestOutputPer1m)}</td>
        <td className="px-3 py-3 text-right tabular-nums text-muted">{m.outputSpeedTps != null ? formatSpeed(m.outputSpeedTps) : '—'}</td>
        <td className="px-3 py-3 text-right tabular-nums text-muted">{formatLatency(m.ttftMs)}</td>
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
          <td colSpan={10} className="px-3 py-3 sm:px-6">
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
                          className={clsx('inline-block h-2 w-2 rounded-full', p.availabilityStatus === 'available' ? 'bg-success' : 'bg-warning')}
                          title={p.availabilityStatus}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-brand">
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
