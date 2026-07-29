'use client';

import clsx from 'clsx';
import { Link } from '@/i18n/navigation';
import type { ModelView } from '@/lib/types';
import {
  CATEGORY_LABELS,
  SCORE_LABELS,
  formatContext,
  formatPrice,
  formatScore,
  formatSpeed,
  scoreBg
} from '@/lib/format';
import { StatusBadges } from '@/components/badges';

export type CardModel = Omit<ModelView, 'description' | 'descriptionDe' | 'sources' | 'family' | 'providers'>;

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function ModelCard({
  model: m,
  scoreKey,
  locale,
  statusT,
  labels
}: {
  model: CardModel;
  scoreKey: keyof CardModel['scores'];
  locale: string;
  statusT: (k: string) => string;
  labels: { context: string; output: string; speed: string };
}) {
  const lang = locale === 'de' ? 'de' : 'en';
  const catLabel = CATEGORY_LABELS[m.category]?.[lang] ?? m.category;
  return (
    <Link
      href={`/models/${m.slug}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-brand/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium leading-tight">{m.name}</div>
          <div className="mt-0.5 text-xs text-muted">{m.lab} · {catLabel}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase tracking-wide text-muted">{SCORE_LABELS[scoreKey][lang]}</span>
          <span className={clsx('rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums', scoreBg(m.scores[scoreKey]))}>
            {formatScore(m.scores[scoreKey])}
          </span>
        </div>
      </div>

      <StatusBadges model={m as ModelView} t={statusT} />

      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <Stat label={labels.context} value={formatContext(m.contextWindow)} />
        <Stat label={labels.output} value={formatPrice(m.cheapestOutputPer1m)} />
        <Stat label={labels.speed} value={m.outputSpeedTps != null ? formatSpeed(m.outputSpeedTps) : '-'} />
      </div>
    </Link>
  );
}
