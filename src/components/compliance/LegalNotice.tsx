import { Scale } from 'lucide-react';
import clsx from 'clsx';

/**
 * Durchgängiger Hinweis: Information, keine Rechtsberatung.
 *
 * Bewusst sichtbar und nicht im Fußbereich versteckt. In Deutschland ist die
 * Rechtsberatung im Einzelfall nach dem RDG reguliert — wir geben allgemeine
 * Orientierung, keine verbindliche Bewertung eines konkreten Falls.
 *
 * `variant="prominent"` für Seiten mit Compliance-Aussagen (Branchenseiten,
 * Schnellcheck), `variant="inline"` als kompakter Zusatz unter Tabellen.
 */
export function LegalNotice({ variant = 'prominent', className }: { variant?: 'prominent' | 'inline'; className?: string }) {
  if (variant === 'inline') {
    return (
      <p className={clsx('text-[11px] leading-relaxed text-muted', className)}>
        <strong className="font-medium">Keine Rechtsberatung.</strong> Diese Einordnung ist eine allgemeine
        Information auf Basis öffentlich dokumentierter Anbieterangaben. Bitte zusätzlich rechtlich abklären —
        etwa mit dem oder der Datenschutzbeauftragten oder einer Fachanwältin für IT-Recht.
      </p>
    );
  }

  return (
    <div className={clsx('rounded-xl border border-warning/40 bg-warning/10 p-4 sm:p-5', className)}>
      <div className="flex items-start gap-3">
        <Scale size={18} className="mt-0.5 shrink-0 text-warning" />
        <div className="text-sm leading-relaxed">
          <h2 className="font-semibold text-warning">Information — keine Rechtsberatung</h2>
          <p className="mt-1 text-muted">
            Diese Seite gibt eine allgemeine Orientierung auf Basis öffentlich dokumentierter Angaben der
            Anbieter. Sie ist <strong className="font-medium text-fg">keine Rechtsberatung</strong> und
            bewertet keinen konkreten Einzelfall.
          </p>
          <p className="mt-2 text-muted">
            <strong className="font-medium text-fg">Bitte zusätzlich rechtlich abklären.</strong> Ob ein
            Einsatz in Ihrem Betrieb zulässig ist, hängt von Ihren Daten, Ihren Prozessen und Ihren Verträgen
            ab. Ziehen Sie dafür Ihre Datenschutzbeauftragten, Ihre Kammer oder eine Fachanwältin bzw. einen
            Fachanwalt für IT-Recht hinzu.
          </p>
          <p className="mt-2 text-xs text-muted">
            Angaben zu Anbietern sind mit Quelle und Prüfdatum versehen. Anbieter ändern ihre Bedingungen —
            prüfen Sie das Datum und im Zweifel die verlinkte Originalquelle.
          </p>
        </div>
      </div>
    </div>
  );
}
