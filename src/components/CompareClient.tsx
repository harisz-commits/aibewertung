'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Minus, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import { Link } from '@/i18n/navigation';
import type { TableModel } from '@/components/table/ModelTable';
import type { Scores } from '@/lib/types';
import {
  CATEGORY_LABELS,
  SCORE_LABELS,
  formatContext,
  formatDate,
  formatPrice,
  formatScore,
  scoreBg
} from '@/lib/format';

export function CompareClient({ models }: { models: TableModel[] }) {
  const t = useTranslations('compare');
  const tb = useTranslations('table');
  const locale = useLocale();
  const lang = locale === 'de' ? 'de' : 'en';

  const bySlug = useMemo(() => new Map(models.map((m) => [m.slug, m])), [models]);
  const [selected, setSelected] = useState<string[]>(() => models.slice(0, 3).map((m) => m.slug));

  const cols = selected.map((s) => bySlug.get(s)).filter((m): m is TableModel => Boolean(m));

  function addModel(slug: string) {
    if (slug && !selected.includes(slug) && selected.length < 5) {
      setSelected((prev) => [...prev, slug]);
    }
  }
  function remove(slug: string) {
    setSelected((prev) => prev.filter((s) => s !== slug));
  }

  const scoreKeys = Object.keys(SCORE_LABELS) as (keyof Scores)[];

  const boolRows: { label: string; get: (m: TableModel) => boolean }[] = [
    { label: SCORE_LABELS.vision[lang], get: (m) => m.features.vision },
    { label: SCORE_LABELS.reasoning[lang], get: (m) => m.features.reasoning },
    { label: 'Tool calling', get: (m) => m.features.tools },
    { label: 'JSON mode', get: (m) => m.features.jsonMode },
    { label: 'Audio', get: (m) => m.features.audio },
    { label: SCORE_LABELS.openWeight[lang], get: (m) => m.isOpenWeight }
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value=""
          onChange={(e) => {
            addModel(e.target.value);
            e.currentTarget.value = '';
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">{t('pick')}</option>
          {models
            .filter((m) => !selected.includes(m.slug))
            .map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name} · {m.lab}
              </option>
            ))}
        </select>
        <span className="text-xs text-muted">{selected.length}/5</span>
      </div>

      {cols.length < 2 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          {t('empty')}
        </p>
      ) : (
        <div className="overflow-x-auto scroll-thin rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="sticky left-0 z-10 bg-surface-2 px-4 py-3 text-left text-xs uppercase tracking-wide text-muted">
                  {t('attribute')}
                </th>
                {cols.map((m) => (
                  <th key={m.slug} className="min-w-[160px] px-4 py-3 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/models/${m.slug}`} className="font-semibold hover:text-brand">
                          {m.name}
                        </Link>
                        <div className="text-xs font-normal text-muted">{m.lab}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(m.slug)}
                        className="text-muted hover:text-danger"
                        aria-label={t('remove')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-2.5 [&_th]:px-4 [&_th]:py-2.5">
              <Row label={tb('category')} cols={cols} render={(m) => CATEGORY_LABELS[m.category]?.[lang] ?? m.category} />
              <Row label={tb('context')} cols={cols} render={(m) => formatContext(m.contextWindow)} />
              <Row label={tb('maxOutput')} cols={cols} render={(m) => formatContext(m.maxOutputTokens)} />
              <Row label={tb('input')} cols={cols} render={(m) => formatPrice(m.cheapestInputPer1m)} />
              <Row label={tb('output')} cols={cols} render={(m) => formatPrice(m.cheapestOutputPer1m)} />
              <Row label={tb('providers')} cols={cols} render={(m) => String(m.providerCount)} />
              <Row label={lang === 'de' ? 'Erschienen' : 'Release'} cols={cols} render={(m) => formatDate(m.releaseDate, locale)} />

              {boolRows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <th className="sticky left-0 z-10 bg-surface text-left text-xs font-medium text-muted">{r.label}</th>
                  {cols.map((m) => (
                    <td key={m.slug}>
                      {r.get(m) ? <Check size={15} className="text-success" /> : <Minus size={15} className="text-muted/40" />}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="border-t-2 border-border">
                <th colSpan={cols.length + 1} className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  {lang === 'de' ? 'Anwendungsfall-Scores' : 'Use-case scores'}
                </th>
              </tr>
              {scoreKeys.map((k) => (
                <tr key={k} className="border-t border-border">
                  <th className="sticky left-0 z-10 bg-surface text-left text-xs font-medium text-muted">
                    {SCORE_LABELS[k][lang]}
                  </th>
                  {cols.map((m) => (
                    <td key={m.slug}>
                      <span className={clsx('inline-flex min-w-[2.2rem] justify-center rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums', scoreBg(m.scores[k]))}>
                        {formatScore(m.scores[k])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  cols,
  render
}: {
  label: string;
  cols: TableModel[];
  render: (m: TableModel) => React.ReactNode;
}) {
  return (
    <tr className="border-t border-border">
      <th className="sticky left-0 z-10 bg-surface text-left text-xs font-medium text-muted">{label}</th>
      {cols.map((m) => (
        <td key={m.slug} className="tabular-nums">
          {render(m)}
        </td>
      ))}
    </tr>
  );
}
