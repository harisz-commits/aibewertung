import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { ModelView, Scores } from '@/lib/types';
import { formatScore, scoreBg } from '@/lib/format';
import clsx from 'clsx';

export function RankingCards({
  rankings
}: {
  rankings: { id: string; scoreKey: keyof Scores; models: ModelView[] }[];
}) {
  const t = useTranslations('rankings');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {rankings.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Trophy size={15} className="text-brand" />
            {t(r.id)}
          </div>
          <ol className="space-y-1.5">
            {r.models.map((m, i) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <span className="w-4 shrink-0 text-xs tabular-nums text-muted">{i + 1}</span>
                <Link
                  href={`/models/${m.slug}`}
                  className="min-w-0 flex-1 truncate hover:text-brand"
                  title={m.name}
                >
                  {m.name}
                </Link>
                <span
                  className={clsx(
                    'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    scoreBg(m.scores[r.scoreKey])
                  )}
                >
                  {formatScore(m.scores[r.scoreKey])}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
