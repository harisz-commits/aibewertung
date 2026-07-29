import clsx from 'clsx';
import type { Verdict } from '@/lib/compliance/types';

// "green" heißt NICHT arbeitsfrei: die üblichen Pflichten (AVV abschließen,
// Eintrag ins Verarbeitungsverzeichnis) gelten immer. Deshalb "Möglich" statt
// "Unproblematisch" - sonst widerspricht das Label den angezeigten Auflagen.
export const VERDICT_LABEL: Record<Verdict, string> = {
  green: 'Möglich (mit den üblichen Pflichten)',
  yellow: 'Möglich mit zusätzlichen Auflagen',
  orange: 'Nur ohne Personenbezug',
  red: 'Nicht empfehlenswert',
  unknown: 'Ungeprüft - keine Freigabe'
};

/** Kurzform für enge Spalten. */
export const VERDICT_SHORT: Record<Verdict, string> = {
  green: 'Möglich',
  yellow: 'Auflagen',
  orange: 'Anonym.',
  red: 'Nein',
  unknown: 'ungeprüft'
};

const STYLE: Record<Verdict, string> = {
  green: 'bg-success/15 text-success border-success/30',
  yellow: 'bg-warning/15 text-warning border-warning/30',
  orange: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  red: 'bg-danger/15 text-danger border-danger/30',
  // Ungeprüft bewusst neutral-grau: weder Freigabe noch Verbot.
  unknown: 'bg-surface-2 text-muted border-border'
};

export function VerdictBadge({
  verdict,
  short = false,
  className
}: {
  verdict: Verdict;
  short?: boolean;
  className?: string;
}) {
  return (
    <span
      title={VERDICT_LABEL[verdict]}
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
        STYLE[verdict],
        className
      )}
    >
      {short ? VERDICT_SHORT[verdict] : VERDICT_LABEL[verdict]}
    </span>
  );
}
