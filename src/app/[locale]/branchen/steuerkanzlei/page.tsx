import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AlertTriangle, ArrowRight, Check, Clock, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getAllModels } from '@/lib/data';
import { ALL_ROUTES, evaluate, COMPLIANCE_META } from '@/lib/compliance/data';
import { DATA_CLASSES, type DataClass } from '@/lib/compliance/types';
import { LegalNotice } from '@/components/compliance/LegalNotice';
import { VerdictBadge } from '@/components/compliance/VerdictBadge';

export const metadata: Metadata = {
  title: 'KI in der Steuerkanzlei — was ist erlaubt, was lohnt sich, wie einrichten',
  description:
    'Praktischer Leitfaden für Steuerkanzleien: Wo KI wirklich Zeit spart, was das Steuergeheimnis (§ 203 StGB) und die DSGVO verlangen, welche Modelle in Frage kommen und wie Sie starten. Information, keine Rechtsberatung.'
};

/** Aufgaben, bei denen der Nutzen real ist — mit der Datenklasse, die dabei
 * tatsächlich anfällt. Genau diese Zuordnung fehlt in den meisten Ratgebern. */
const AUFGABEN: { titel: string; beschreibung: string; klasse: DataClass; ersparnis: string }[] = [
  {
    titel: 'Mandantenrundschreiben und Merkblätter',
    beschreibung: 'Gesetzesänderungen verständlich für Mandanten aufbereiten — Entwurf in Minuten statt Stunden.',
    klasse: 'S0',
    ersparnis: '2–4 Std./Monat'
  },
  {
    titel: 'Fachliche Recherche und Einordnung',
    beschreibung: 'Erste Orientierung zu einer Rechtsfrage, ohne Mandantenbezug. Ergebnis immer selbst prüfen.',
    klasse: 'S0',
    ersparnis: '1–3 Std./Woche'
  },
  {
    titel: 'E-Mail-Entwürfe an Mandanten',
    beschreibung: 'Antwortentwürfe auf wiederkehrende Fragen. Sobald Name oder Aktenzeichen drinstehen, ist es S3.',
    klasse: 'S3',
    ersparnis: '3–5 Std./Woche'
  },
  {
    titel: 'Belege und Dokumente zusammenfassen',
    beschreibung: 'Lange Schriftsätze oder Prüfberichte auf das Wesentliche verdichten.',
    klasse: 'S3',
    ersparnis: '2–4 Std./Woche'
  },
  {
    titel: 'Interne Protokolle und Aktenvermerke',
    beschreibung: 'Besprechungsnotizen in strukturierte Vermerke bringen.',
    klasse: 'S3',
    ersparnis: '1–2 Std./Woche'
  },
  {
    titel: 'Stellenanzeigen, interne Texte, Website',
    beschreibung: 'Alles ohne Mandantenbezug — hier ist der Einstieg am einfachsten.',
    klasse: 'S0',
    ersparnis: 'punktuell'
  }
];

const SETUPS = [
  {
    name: 'Einstieg',
    fuer: 'Erste Schritte, nur Aufgaben ohne Mandantenbezug (S0)',
    weg: 'ChatGPT Team oder Microsoft Copilot, Geschäftskonto',
    aufwand: 'Ein Nachmittag',
    kosten: 'ca. 25–30 € pro Person/Monat',
    grenze: 'Keine Mandantendaten. Kein Aktenzeichen, kein Name, keine Belege.',
    ton: 'neutral' as const
  },
  {
    name: 'Solide',
    fuer: 'Kanzleialltag mit Mandantenbezug (S3), ohne eigenen Server',
    weg: 'Azure OpenAI in EU-Region mit AVV, kein Training, Zugriff nur über Kanzlei-Konten',
    aufwand: '1–2 Tage mit IT-Dienstleister',
    kosten: 'nutzungsabhängig, meist 20–80 €/Monat für eine kleine Kanzlei',
    grenze: 'Verpflichtung des Anbieters nach § 203 Abs. 3 StGB muss schriftlich geregelt sein.',
    ton: 'empfohlen' as const
  },
  {
    name: 'Maximale Kontrolle',
    fuer: 'Höchste Anforderungen, Daten verlassen die Kanzlei nicht',
    weg: 'Open-Weight-Modell auf eigenem Server (Ollama oder vLLM)',
    aufwand: '2–5 Tage, IT-Kenntnisse nötig',
    kosten: 'einmalig 2.000–6.000 € Hardware, danach Strom',
    grenze: 'Sie sind selbst für Zugriffsschutz, Backup und Protokollierung verantwortlich.',
    ton: 'neutral' as const
  }
];

const CHECKLISTE = [
  'Verzeichnis von Verarbeitungstätigkeiten (VVT) um den KI-Einsatz ergänzt',
  'AVV nach Art. 28 DSGVO mit dem Anbieter tatsächlich abgeschlossen (nicht nur „verfügbar")',
  'ZUSÄTZLICH: Verschwiegenheitsvereinbarung nach § 203 Abs. 4 StGB in Textform, mit Belehrung über die Strafbarkeit — der AVV ersetzt das nicht',
  'Unterauftragnehmer des Anbieters ebenfalls nach § 203 verpflichtet; Erklärungen auf Verlangen vorlegbar',
  'Training auf eigenen Daten nachweislich abgeschaltet',
  'Schriftliche Kanzlei-Richtlinie: was darf rein, was nicht',
  'Mitarbeitende geschult (KI-Kompetenz ist nach EU-KI-Verordnung Pflicht)',
  'Betriebsrat beteiligt, falls vorhanden (§ 87 BetrVG)',
  'Löschkonzept und Aufbewahrungsfristen geklärt',
  'Ergebnisse werden immer fachlich geprüft — keine ungeprüfte Weitergabe'
];

const FEHLER = [
  'Mandantennamen oder Aktenzeichen in die kostenlose Web-Oberfläche eines Anbieters eingeben',
  'AVV für „abgeschlossen" halten, weil er auf der Anbieterseite verlinkt ist',
  'Steuerliche Auskünfte ungeprüft übernehmen — Modelle erfinden Paragraphen und Fristen',
  'Das Steuergeheimnis mit „ist ja verschlüsselt" für erledigt halten',
  'Mitarbeitende privat ChatGPT nutzen lassen, ohne Regelung („Schatten-KI")'
];

function Klasse({ k }: { k: DataClass }) {
  const d = DATA_CLASSES.find((x) => x.id === k)!;
  return (
    <span
      title={`${d.de} — ${d.norm}`}
      className="whitespace-nowrap rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted"
    >
      {d.id}
    </span>
  );
}

export default async function SteuerkanzleiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Nach EINSATZWEG gruppiert, nicht nach Modellscore: Ein reines Ranking
  // würde nur Open-Weight-Modelle zeigen (Selbstbetrieb ist der einzige bei S3
  // uneingeschränkte Weg), obwohl die meisten Kanzleien keinen eigenen Server
  // betreiben wollen. Die Gruppierung spiegelt die drei Wege oben.
  const textModelle = getAllModels().filter(
    (m) => m.category !== 'media' && m.category !== 'embedding' && m.category !== 'reranker'
  );
  const wege = ALL_ROUTES.filter((r) => r.slug !== 'azure-openai-global') // ungeprüfte Region nicht empfehlen
    .map((r) => {
      const modelle = textModelle
        .filter((m) =>
          r.appliesToOpenWeight && m.isOpenWeight
            ? true
            : r.matchProviderSlugs.some((s) => (m.providers ?? []).some((p) => p.providerSlug === s))
        )
        .sort((a, b) => b.scores.overall - a.scores.overall)
        .slice(0, 4);
      return { route: r, modelle, s1: evaluate(r, 'S1'), s3: evaluate(r, 'S3') };
    })
    .filter((x) => x.modelle.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-fg">
        ← Alle Modelle
      </Link>

      <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        KI in der Steuerkanzlei
      </h1>
      <p className="mt-3 text-pretty text-base leading-relaxed text-muted">
        Was wirklich Zeit spart, was das Steuergeheimnis verlangt, welche Modelle in Frage kommen — und wie Sie
        in einer Woche starten, ohne sich angreifbar zu machen. Geschrieben für Kanzleien ohne eigene
        IT-Abteilung.
      </p>

      <LegalNotice className="mt-6" />

      {/* 1. Nutzen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Wo KI in der Kanzlei wirklich hilft</h2>
        <p className="mt-2 text-sm text-muted">
          Entscheidend ist nicht die Aufgabe allein, sondern <strong className="text-fg">welche Daten dabei
          anfallen</strong>. Deshalb steht an jeder Aufgabe die Datenklasse — sie bestimmt, welcher Einsatzweg
          zulässig ist.
        </p>
        <div className="mt-4 overflow-x-auto scroll-thin rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Aufgabe</th>
                <th className="px-3 py-2 font-medium">Daten</th>
                <th className="px-3 py-2 font-medium">Zeitersparnis</th>
              </tr>
            </thead>
            <tbody>
              {AUFGABEN.map((a) => (
                <tr key={a.titel} className="border-t border-border align-top">
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{a.titel}</div>
                    <div className="mt-0.5 text-xs text-muted">{a.beschreibung}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Klasse k={a.klasse} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {a.ersparnis}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Datenklassen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Die vier Datenklassen — im Kanzleialltag</h2>
        <p className="mt-2 text-sm text-muted">
          Das ist der wichtigste Begriff auf dieser Seite. Fast alles in einer Kanzlei ist S3.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DATA_CLASSES.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-semibold text-brand">{d.id}</span>
                <span className="font-medium">{d.de}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted">{d.beispiel}</p>
              <p className="mt-1 text-xs text-muted">{d.norm}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
          <strong className="font-medium">Faustregel für die Kanzlei:</strong> Sobald ein Mandant erkennbar
          ist — Name, Firma, Steuernummer, Aktenzeichen, oder auch nur aus dem Zusammenhang — gilt{' '}
          <strong className="font-medium">S3 (Steuergeheimnis, § 203 StGB)</strong>. Das ist strenger als
          normaler Datenschutz und der Grund, warum die kostenlose Web-Oberfläche eines KI-Anbieters für
          Kanzleiarbeit ausscheidet.
        </div>
      </section>

      {/* 3. Rechtsrahmen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Was rechtlich gilt — in Alltagssprache</h2>
        <dl className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="font-medium">§ 203 StGB — Steuergeheimnis</dt>
            <dd className="mt-1 text-sm text-muted">
              Sie dürfen Mandantengeheimnisse nicht an Dritte offenbaren. Ein KI-Anbieter, der Ihre Texte
              verarbeitet, wird zum Dritten. Seit der Reform von 2017 ist das nicht automatisch verboten:
              Absatz 3 Satz 2 erlaubt es ausdrücklich, externe Dienstleister als{' '}
              <strong className="text-fg">sonstige mitwirkende Personen</strong> einzubeziehen. Dafür muss der
              Anbieter nach Absatz 4 <strong className="text-fg">in Textform zur Verschwiegenheit
              verpflichtet</strong> und über die Strafbarkeit eines Verstoßes belehrt werden — ebenso seine
              Beschäftigten und Unterauftragnehmer. Die Erklärungen müssen Ihnen auf Verlangen vorgelegt
              werden.
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="font-medium">DSGVO — Auftragsverarbeitung</dt>
            <dd className="mt-1 text-sm text-muted">
              Der Anbieter verarbeitet personenbezogene Daten in Ihrem Auftrag. Dafür brauchen Sie einen{' '}
              <strong className="text-fg">Auftragsverarbeitungsvertrag (AVV)</strong> nach Art. 28 DSGVO —
              tatsächlich abgeschlossen, nicht nur auf der Anbieterseite verfügbar. Dazu kommt ein Eintrag im
              Verzeichnis von Verarbeitungstätigkeiten.
              <span className="mt-2 block rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-fg">
                <strong className="font-medium">Der teuerste Irrtum:</strong> Ein AVV deckt das
                Steuergeheimnis <strong className="font-medium">nicht</strong> ab. AVV und Verpflichtung nach
                § 203 StGB sind zwei getrennte Verträge — Sie brauchen beide.
              </span>
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="font-medium">EU-KI-Verordnung — KI-Kompetenz</dt>
            <dd className="mt-1 text-sm text-muted">
              Wer KI im Betrieb einsetzt, muss dafür sorgen, dass die Mitarbeitenden ausreichend geschult
              sind. Für eine Kanzlei heißt das praktisch: eine schriftliche Richtlinie und eine kurze
              Einweisung, beides dokumentiert.
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="font-medium">Berufsrecht und Sorgfalt</dt>
            <dd className="mt-1 text-sm text-muted">
              Die fachliche Verantwortung bleibt immer bei Ihnen. Sprachmodelle erfinden gelegentlich
              Paragraphen, Fristen und Urteile, die es nicht gibt. Jedes Ergebnis muss geprüft werden, bevor es
              die Kanzlei verlässt.
            </dd>
          </div>
        </dl>
      </section>

      {/* 4. Setup-Wege */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Drei Wege — welcher passt zu Ihnen?</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {SETUPS.map((s) => (
            <div
              key={s.name}
              className={
                s.ton === 'empfohlen'
                  ? 'rounded-xl border-2 border-brand bg-brand/5 p-4'
                  : 'rounded-xl border border-border bg-surface p-4'
              }
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{s.name}</h3>
                {s.ton === 'empfohlen' && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-brand-fg">
                    Empfehlung
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">{s.fuer}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Weg</dt>
                  <dd>{s.weg}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Aufwand</dt>
                  <dd>{s.aufwand}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Kosten</dt>
                  <dd>{s.kosten}</dd>
                </div>
              </dl>
              <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" />
                {s.grenze}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Modelle mit Ampel */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Welche Modelle kommen in Frage?</h2>
        <p className="mt-2 text-sm text-muted">
          Die Ampel bewertet den <strong className="text-fg">besten dokumentierten Einsatzweg</strong> je
          Modell — nicht das Modell selbst. Dasselbe Modell kann über eine EU-Region unproblematisch und über
          einen anderen Weg unzulässig sein. „Ungeprüft" heißt: wir haben es noch nicht belegt, nicht dass es
          zulässig wäre.
        </p>
        <div className="mt-4 space-y-4">
          {wege.map(({ route, modelle, s1, s3 }) => (
            <div key={route.slug} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{route.route}</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-muted">S1</span>
                  <VerdictBadge verdict={s1.verdict} short />
                  <span className="ml-1 text-muted">S3 Mandantendaten</span>
                  <VerdictBadge verdict={s3.verdict} short />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {modelle.map((m) => (
                  <Link
                    key={m.id}
                    href={`/models/${m.slug}`}
                    className="rounded-md border border-border px-2 py-1 text-xs transition hover:border-brand/50 hover:text-brand"
                  >
                    {m.name}
                  </Link>
                ))}
              </div>

              {/* Auflagen und Blocker im Klartext — der eigentliche Nutzen. */}
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {s3.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                    <span className="mt-0.5 shrink-0">
                      {r.severity === 'blocker' ? (
                        <X size={12} className="text-danger" />
                      ) : r.severity === 'condition' ? (
                        <AlertTriangle size={12} className="text-warning" />
                      ) : (
                        <Check size={12} className="text-success" />
                      )}
                    </span>
                    {r.text}
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <a href={route.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  Quelle
                </a>
                <span>Geprüft: {route.checkedAt}</span>
                {route.openQuestions && route.openQuestions.length > 0 && (
                  <span className="text-warning">
                    {route.openQuestions.length} offene{route.openQuestions.length === 1 ? 'r' : ''} Punkt
                    {route.openQuestions.length === 1 ? '' : 'e'} ungeprüft
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <LegalNotice variant="inline" className="mt-3" />
        <p className="mt-1 text-[11px] text-muted">
          Stand der Anbieterangaben: {COMPLIANCE_META.letztePruefung}. Prüfung {COMPLIANCE_META.pflegeIntervall}.
        </p>
      </section>

      {/* 6. Checkliste */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Checkliste vor dem Start</h2>
        <ul className="mt-4 space-y-2">
          {CHECKLISTE.map((c) => (
            <li key={c} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
              <Check size={15} className="mt-0.5 shrink-0 text-success" />
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Fehler */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Die fünf häufigsten Fehler</h2>
        <ul className="mt-4 space-y-2">
          {FEHLER.map((f) => (
            <li key={f} className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm">
              <X size={15} className="mt-0.5 shrink-0 text-danger" />
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Nächster Schritt</h2>
        <p className="mt-1 text-sm text-muted">
          Beginnen Sie mit S0-Aufgaben — Rundschreiben, interne Texte, Recherche ohne Mandantenbezug. Damit
          sammeln Sie Erfahrung ohne rechtliches Risiko, während Sie den AVV und die Verpflichtung nach § 203
          für den nächsten Schritt vorbereiten.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg transition hover:opacity-90"
        >
          Modelle vergleichen <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}
