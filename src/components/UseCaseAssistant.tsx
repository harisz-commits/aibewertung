'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { TableModel } from '@/components/table/ModelTable';
import type { Scores } from '@/lib/types';
import { SCORE_LABELS, formatPrice, formatScore, scoreBg } from '@/lib/format';
import clsx from 'clsx';

// Every goal the query can express. A query may hit SEVERAL of these at once
// ("cheap model for coding" → cheapApi + coding), which is the whole point:
// ranking by a single key made "cheap coding model" return the most expensive
// top coder. Order here is only the order shown to the user.
const GOALS: { key: keyof Scores; words: string[] }[] = [
  { key: 'coding', words: ['code', 'coding', 'programm', 'developer', 'entwickl', 'swe'] },
  { key: 'german', words: ['german', 'deutsch'] },
  { key: 'rag', words: ['rag', 'retrieval', 'knowledge base', 'wissensbasis', 'dokumente durchsuch'] },
  { key: 'reasoning', words: ['reason', 'logic', 'logik', 'denk'] },
  { key: 'math', words: ['math', 'mathe', 'rechn'] },
  { key: 'customerSupport', words: ['support', 'kundensupport', 'customer', 'helpdesk'] },
  { key: 'translation', words: ['translat', 'übersetz'] },
  { key: 'salesEmail', words: ['email', 'mail', 'sales', 'vertrieb', 'writ', 'schreib', 'text'] },
  { key: 'speed', words: ['fast', 'speed', 'schnell', 'latenc', 'realtime', 'echtzeit'] },
  { key: 'longContext', words: ['long', 'document', 'dokument', 'context', 'kontext'] },
  { key: 'privacyEu', words: ['privacy', 'dsgvo', 'gdpr', 'datenschutz'] },
  { key: 'vision', words: ['vision', 'image', 'bild', 'ocr', 'screenshot'] },
  { key: 'agentTool', words: ['tool', 'agent', 'function', 'werkzeug'] },
  { key: 'local', words: ['local', 'lokal', 'offline', 'on-prem', 'self-host', 'selbst'] },
  { key: 'cheapApi', words: ['cheap', 'günstig', 'guenstig', 'billig', 'budget', 'low cost', 'low-cost', 'affordable', 'preiswert', 'preis', 'kosten'] }
];

interface Intent {
  /** All goals found in the query. Ranking = average of these dimensions, so
   * every stated goal actually influences the result. */
  goals: (keyof Scores)[];
  requireVision: boolean;
  requireTools: boolean;
  requireLocal: boolean;
  requireFree: boolean;
}

// Deterministic keyword → intent mapping. No LLM: the ranking is rule-based
// and reproducible; only the phrasing is templated.
function parseIntent(qRaw: string): Intent {
  const q = qRaw.toLowerCase();
  const has = (...w: string[]) => w.some((x) => q.includes(x));

  const goals = GOALS.filter((g) => has(...g.words)).map((g) => g.key);

  return {
    // No recognized goal → fall back to all-round quality.
    goals: goals.length ? goals : ['overall'],
    // Capability words are ALSO hard filters: "with tool calling" must exclude
    // models that cannot call tools, not merely rank them lower.
    requireVision: has('vision', 'image', 'bild', 'ocr', 'screenshot'),
    requireTools: has('tool', 'agent', 'function', 'werkzeug'),
    requireLocal: has('local', 'lokal', 'offline', 'on-prem', 'self-host', 'selbst'),
    requireFree: has('free', 'kostenlos', 'gratis')
  };
}

/** Combined score across every stated goal (equal weight). A model must be
 * good at ALL of them to win — that is what makes "cheap + coding" return a
 * genuinely cheap capable model instead of the best coder at any price. */
function blendedScore(scores: Scores, goals: (keyof Scores)[]): number {
  if (!goals.length) return scores.overall;
  return goals.reduce((sum, k) => sum + scores[k], 0) / goals.length;
}

export function UseCaseAssistant({ models }: { models: TableModel[] }) {
  const t = useTranslations('assistant');
  const h = useTranslations('home');
  const locale = useLocale();
  const lang = locale === 'de' ? 'de' : 'en';
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const intent = useMemo(() => (submitted ? parseIntent(submitted) : null), [submitted]);

  const { results, relaxed } = useMemo(() => {
    if (!intent) return { results: [], relaxed: false };
    const rows = models.filter((m) => {
      if (intent.requireVision && !m.features.vision) return false;
      if (intent.requireTools && !m.features.tools) return false;
      if (intent.requireLocal && !m.isOpenWeight) return false;
      if (intent.requireFree && (m.cheapestOutputPer1m ?? 1) !== 0) return false;
      return true;
    });
    // Only fall back to the unfiltered set if the constraints matched nothing —
    // and say so, instead of silently returning models that miss the ask.
    const pool = rows.length ? rows : models;
    const ranked = [...pool]
      .sort((a, b) => blendedScore(b.scores, intent.goals) - blendedScore(a.scores, intent.goals))
      .slice(0, 3);
    return { results: ranked, relaxed: rows.length === 0 };
  }, [intent, models]);

  const examples = [t('example1'), t('example2'), t('example3'), t('example4')];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} className="text-brand" />
        {h('assistantTitle')}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="flex-1 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg transition hover:opacity-90"
        >
          {t('button')} <ArrowRight size={15} />
        </button>
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span>{t('examples')}</span>
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              setSubmitted(ex);
            }}
            className="rounded-full border border-border px-2 py-0.5 hover:border-brand/50 hover:text-fg"
          >
            {ex}
          </button>
        ))}
      </div>

      {intent && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs uppercase tracking-wide text-muted">
            <span className="font-semibold">{t('resultTitle')}</span>
            <span>·</span>
            {intent.goals.map((g) => (
              <span key={g} className="rounded-full bg-brand/10 px-2 py-0.5 font-medium normal-case text-brand">
                {SCORE_LABELS[g][lang]}
              </span>
            ))}
          </div>
          {relaxed && <p className="mb-2 text-xs text-warning">{t('empty')}</p>}
          <div className="grid gap-2">
            {results.map((m, i) => (
              <Link
                key={m.id}
                href={`/models/${m.slug}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5 transition hover:border-brand/50"
              >
                <span className="w-4 text-xs tabular-nums text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted">
                    {m.lab} · {formatPrice(m.cheapestOutputPer1m)}/1M out
                  </div>
                </div>
                {/* Per-goal breakdown, so the ranking is auditable at a glance. */}
                <span className="hidden items-center gap-1 sm:flex">
                  {intent.goals.map((g) => (
                    <span
                      key={g}
                      title={SCORE_LABELS[g][lang]}
                      className={clsx('rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', scoreBg(m.scores[g]))}
                    >
                      {formatScore(m.scores[g])}
                    </span>
                  ))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
