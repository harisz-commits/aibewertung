'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { TableModel } from '@/components/table/ModelTable';
import type { Scores } from '@/lib/types';
import { formatPrice, formatScore, scoreBg } from '@/lib/format';
import clsx from 'clsx';

interface Intent {
  scoreKey: keyof Scores;
  requireVision?: boolean;
  requireTools?: boolean;
  requireLocal?: boolean;
  requireFree?: boolean;
  label: string;
}

// Deterministic keyword → intent mapping. No LLM: the ranking is rule-based;
// only the phrasing is templated.
function parseIntent(qRaw: string): Intent {
  const q = qRaw.toLowerCase();
  const has = (...w: string[]) => w.some((x) => q.includes(x));

  const requireVision = has('vision', 'image', 'bild', 'ocr', 'screenshot');
  const requireTools = has('tool', 'agent', 'function', 'werkzeug');
  const requireLocal = has('local', 'lokal', 'offline', 'on-prem', 'self-host', 'selbst');
  const requireFree = has('free', 'kostenlos', 'gratis');

  let scoreKey: keyof Scores = 'overall';
  let label = 'overall quality';
  if (has('code', 'coding', 'programm', 'developer', 'swe')) { scoreKey = 'coding'; label = 'coding'; }
  else if (has('german', 'deutsch')) { scoreKey = 'german'; label = 'German'; }
  else if (has('rag', 'retrieval', 'embedding', 'knowledge base')) { scoreKey = 'rag'; label = 'RAG'; }
  else if (requireVision) { scoreKey = 'vision'; label = 'vision'; }
  else if (has('reason', 'math', 'mathe', 'logic', 'logik')) { scoreKey = 'reasoning'; label = 'reasoning'; }
  else if (requireTools) { scoreKey = 'agentTool'; label = 'agent / tool use'; }
  else if (has('support', 'kundensupport', 'customer', 'helpdesk')) { scoreKey = 'customerSupport'; label = 'customer support'; }
  else if (has('translat', 'übersetz')) { scoreKey = 'translation'; label = 'translation'; }
  else if (has('email', 'mail', 'sales', 'vertrieb', 'writ', 'schreib')) { scoreKey = 'salesEmail'; label = 'writing'; }
  else if (has('fast', 'speed', 'schnell', 'latenc', 'realtime')) { scoreKey = 'speed'; label = 'speed'; }
  else if (has('long', 'document', 'dokument', 'context', 'kontext')) { scoreKey = 'longContext'; label = 'long context'; }
  else if (has('privacy', 'eu', 'dsgvo', 'gdpr', 'datenschutz')) { scoreKey = 'privacyEu'; label = 'EU / privacy'; }
  else if (has('cheap', 'günstig', 'billig', 'budget', 'low cost', 'affordable')) { scoreKey = 'cheapApi'; label = 'low-cost API'; }

  return { scoreKey, requireVision, requireTools, requireLocal, requireFree, label };
}

export function UseCaseAssistant({ models }: { models: TableModel[] }) {
  const t = useTranslations('assistant');
  const h = useTranslations('home');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const intent = useMemo(() => (submitted ? parseIntent(submitted) : null), [submitted]);

  const results = useMemo(() => {
    if (!intent) return [];
    let rows = models.filter((m) => {
      if (intent.requireVision && !m.features.vision) return false;
      if (intent.requireTools && !m.features.tools) return false;
      if (intent.requireLocal && !m.isOpenWeight) return false;
      if (intent.requireFree && (m.cheapestOutputPer1m ?? 1) !== 0) return false;
      return true;
    });
    if (rows.length === 0) rows = models;
    return [...rows].sort((a, b) => b.scores[intent.scoreKey] - a.scores[intent.scoreKey]).slice(0, 3);
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
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('resultTitle')} · <span className="text-brand">{intent.label}</span>
          </div>
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
                <span
                  className={clsx(
                    'rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    scoreBg(m.scores[intent.scoreKey])
                  )}
                >
                  {formatScore(m.scores[intent.scoreKey])}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
