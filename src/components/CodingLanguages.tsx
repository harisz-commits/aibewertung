'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import clsx from 'clsx';
import type { LanguageLeaderboard } from '@/lib/coding/aggregate';
import { scoreBg } from '@/lib/format';

export function CodingLanguages({ leaderboard }: { leaderboard: LanguageLeaderboard }) {
  const t = useTranslations('coding');
  const langs = Object.keys(leaderboard).sort();
  const [lang, setLang] = useState(langs[0] ?? '');
  const entries = leaderboard[lang] ?? [];

  if (langs.length === 0) {
    return (
      <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <h2 className="font-semibold text-warning">{t('noData')}</h2>
            <p className="mt-1 text-sm text-muted">{t('noDataBody')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-muted">{t('selectLanguage')}:</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand"
        >
          {langs.map((l) => (
            <option key={l} value={l}>
              {l} ({leaderboard[l].length})
            </option>
          ))}
        </select>
      </label>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">{t('noLangData')}</p>
      ) : (
        <div className="overflow-x-auto scroll-thin rounded-xl border border-border">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="w-10 px-3 py-2 font-medium">{t('rank')}</th>
                <th className="px-3 py-2 font-medium">{t('model')}</th>
                <th className="px-3 py-2 text-center font-medium">{t('score')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.model} className="border-t border-border">
                  <td className="px-3 py-2 tabular-nums text-muted">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{e.model}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx('rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums', scoreBg(e.score))}>
                      {e.score.toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
