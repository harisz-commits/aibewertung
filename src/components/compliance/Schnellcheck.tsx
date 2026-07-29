'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { Link } from '@/i18n/navigation';
import type { DataClass, ProviderCompliance, VerdictResult } from '@/lib/compliance/types';
import { VerdictBadge } from '@/components/compliance/VerdictBadge';
import { LegalNotice } from '@/components/compliance/LegalNotice';

/** Vorberechnete Bewertung je Einsatzweg × Datenklasse - die Auswertung selbst
 * passiert serverseitig in der Engine, hier wird nur ausgewählt und angezeigt.
 * So bleibt die Logik an EINER Stelle. */
export interface SchnellcheckRoute {
  slug: string;
  route: string;
  name: string;
  hostingRegion: ProviderCompliance['hostingRegion'];
  sourceUrl: string;
  checkedAt: string;
  offeneFragen: number;
  perClass: Record<DataClass, VerdictResult>;
  modelle: { slug: string; name: string }[];
}

type Cloud = 'egal' | 'nur_eu' | 'kein_cloud';
type ITKenntnis = 'keine' | 'dienstleister' | 'eigene';

const FRAGEN = [
  {
    id: 'daten',
    frage: 'Welche Daten sollen in die KI?',
    hilfe: 'Die wichtigste Frage. Sobald ein Mandant, Patient oder Kunde erkennbar ist, gilt die strengere Stufe.',
    optionen: [
      { wert: 'S0', label: 'Keine personenbezogenen Daten', hinweis: 'Textbausteine, allgemeine Recherche, interne Texte' },
      { wert: 'S1', label: 'Normale Kundendaten', hinweis: 'Name, Adresse, E-Mail-Verkehr' },
      { wert: 'S2', label: 'Gesundheits- oder ähnlich sensible Daten', hinweis: 'Art. 9 DSGVO - Praxis, Pflege, Therapie' },
      { wert: 'S3', label: 'Berufsgeheimnis', hinweis: '§ 203 StGB - Kanzlei, Steuerberatung, Arztpraxis' }
    ]
  },
  {
    id: 'cloud',
    frage: 'Darf die Verarbeitung in der Cloud stattfinden?',
    hilfe: 'Viele Kammern und Mandanten erwarten mindestens EU-Verarbeitung.',
    optionen: [
      { wert: 'egal', label: 'Ja, Cloud ist in Ordnung', hinweis: 'Auch außerhalb der EU, wenn rechtlich abgesichert' },
      { wert: 'nur_eu', label: 'Nur innerhalb der EU', hinweis: 'Häufigste Anforderung im Mittelstand' },
      { wert: 'kein_cloud', label: 'Nein, nur eigener Server', hinweis: 'Höchste Kontrolle, höchster Aufwand' }
    ]
  },
  {
    id: 'it',
    frage: 'Wer betreut Ihre IT?',
    hilfe: 'Bestimmt, welcher Weg realistisch umsetzbar ist.',
    optionen: [
      { wert: 'keine', label: 'Niemand - wir machen das selbst nebenbei', hinweis: 'Nur einfache Wege sinnvoll' },
      { wert: 'dienstleister', label: 'Ein externer IT-Dienstleister', hinweis: 'Der Normalfall' },
      { wert: 'eigene', label: 'Eigene IT-Abteilung', hinweis: 'Auch Selbstbetrieb möglich' }
    ]
  }
] as const;

export function Schnellcheck({ routes }: { routes: SchnellcheckRoute[] }) {
  const [schritt, setSchritt] = useState(0);
  const [daten, setDaten] = useState<DataClass | null>(null);
  const [cloud, setCloud] = useState<Cloud | null>(null);
  const [it, setIt] = useState<ITKenntnis | null>(null);

  const antworten = [daten, cloud, it];
  const setzen = (i: number, wert: string) => {
    if (i === 0) setDaten(wert as DataClass);
    if (i === 1) setCloud(wert as Cloud);
    if (i === 2) setIt(wert as ITKenntnis);
    setSchritt(i + 1);
  };

  const zuruecksetzen = () => {
    setDaten(null);
    setCloud(null);
    setIt(null);
    setSchritt(0);
  };

  const fertig = schritt >= FRAGEN.length && daten && cloud && it;

  // Auswertung: filtern nach den Rahmenbedingungen, dann nach Ampel sortieren.
  let passend: SchnellcheckRoute[] = [];
  if (fertig) {
    const ORDER = { green: 0, yellow: 1, orange: 2, unknown: 3, red: 4 } as const;
    passend = routes
      .filter((r) => {
        if (cloud === 'kein_cloud') return r.hostingRegion === 'self_hosted';
        if (cloud === 'nur_eu') return r.hostingRegion === 'eu' || r.hostingRegion === 'self_hosted';
        return true;
      })
      // Ohne eigene IT ist Selbstbetrieb keine ehrliche Empfehlung.
      .filter((r) => (it === 'keine' ? r.hostingRegion !== 'self_hosted' : true))
      .sort((a, b) => ORDER[a.perClass[daten].verdict] - ORDER[b.perClass[daten].verdict]);
  }

  if (fertig) {
    const besterWeg = passend[0];
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Ihr Ergebnis</h2>
          <button
            type="button"
            onClick={zuruecksetzen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-fg"
          >
            <RotateCcw size={13} /> Neu starten
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-surface-2 px-2 py-1 text-muted">Daten: {daten}</span>
          <span className="rounded-full bg-surface-2 px-2 py-1 text-muted">
            {cloud === 'egal' ? 'Cloud erlaubt' : cloud === 'nur_eu' ? 'Nur EU' : 'Nur eigener Server'}
          </span>
          <span className="rounded-full bg-surface-2 px-2 py-1 text-muted">
            {it === 'keine' ? 'Keine IT-Betreuung' : it === 'dienstleister' ? 'IT-Dienstleister' : 'Eigene IT'}
          </span>
        </div>

        {passend.length === 0 ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm">
            <strong className="font-medium">Kein dokumentierter Weg passt zu dieser Kombination.</strong>
            <p className="mt-1 text-muted">
              Wenn Cloud ausgeschlossen ist, aber niemand einen eigenen Server betreuen kann, bleibt praktisch
              nur: zuerst mit Aufgaben ohne Personenbezug (S0) starten und parallel einen IT-Dienstleister
              hinzuziehen.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border-2 border-brand bg-brand/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">Empfohlener Weg</div>
                  <h3 className="mt-0.5 text-lg font-semibold">{besterWeg.route}</h3>
                </div>
                <VerdictBadge verdict={besterWeg.perClass[daten].verdict} />
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">Das müssen Sie dafür tun</div>
                <ul className="mt-2 space-y-1.5">
                  {besterWeg.perClass[daten].reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={clsx(
                          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                          r.severity === 'blocker' ? 'bg-danger' : r.severity === 'condition' ? 'bg-warning' : 'bg-success'
                        )}
                      />
                      <span className={r.severity === 'info' ? 'text-muted' : ''}>{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {besterWeg.modelle.length > 0 && (
                <div className="mt-4 border-t border-brand/20 pt-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted">Modelle auf diesem Weg</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {besterWeg.modelle.map((m) => (
                      <Link
                        key={m.slug}
                        href={`/models/${m.slug}`}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-xs transition hover:border-brand/50 hover:text-brand"
                      >
                        {m.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <a href={besterWeg.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  Quelle
                </a>
                <span>Geprüft: {besterWeg.checkedAt}</span>
                {besterWeg.offeneFragen > 0 && (
                  <span className="text-warning">{besterWeg.offeneFragen} Punkte noch ungeprüft</span>
                )}
              </div>
            </div>

            {passend.length > 1 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium">Weitere passende Wege</h3>
                <div className="mt-2 space-y-2">
                  {passend.slice(1).map((r) => (
                    <div key={r.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                      <span>{r.route}</span>
                      <VerdictBadge verdict={r.perClass[daten].verdict} short />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <LegalNotice className="mt-6" />
      </div>
    );
  }

  const f = FRAGEN[schritt];
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {FRAGEN.map((_, i) => (
          <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i <= schritt ? 'bg-brand' : 'bg-surface-2')} />
        ))}
      </div>
      <div className="text-xs text-muted">
        Frage {schritt + 1} von {FRAGEN.length}
      </div>
      <h2 className="mt-1 text-xl font-semibold">{f.frage}</h2>
      <p className="mt-1 text-sm text-muted">{f.hilfe}</p>

      <div className="mt-4 space-y-2">
        {f.optionen.map((o) => {
          const aktiv = antworten[schritt] === o.wert;
          return (
            <button
              key={o.wert}
              type="button"
              onClick={() => setzen(schritt, o.wert)}
              className={clsx(
                'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition',
                aktiv ? 'border-brand bg-brand/5' : 'border-border bg-surface hover:border-brand/50'
              )}
            >
              <span>
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{o.hinweis}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-muted" />
            </button>
          );
        })}
      </div>

      {schritt > 0 && (
        <button
          type="button"
          onClick={() => setSchritt(schritt - 1)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft size={14} /> Zurück
        </button>
      )}
    </div>
  );
}
