import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';
import { SITE_LEGAL, LEGAL_UNVOLLSTAENDIG, zeige } from '@/data/site-legal';

export const metadata: Metadata = { title: 'Impressum', robots: { index: false } };

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const L = SITE_LEGAL;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Impressum</h1>

      {LEGAL_UNVOLLSTAENDIG && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <strong className="font-medium text-danger">Noch nicht vollständig.</strong>
            <p className="mt-1 text-muted">
              Die Pflichtangaben nach § 5 DDG sind noch nicht hinterlegt. Vor dem Livegang in{' '}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">src/data/site-legal.ts</code>{' '}
              eintragen. Ein unvollständiges Impressum ist abmahnfähig.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold">Angaben gemäß § 5 DDG</h2>
          <address className="mt-2 not-italic text-muted">
            {zeige(L.betreiber)}
            <br />
            {zeige(L.strasse)}
            <br />
            {zeige(L.plz)} {zeige(L.ort)}
            <br />
            {L.land}
          </address>
        </section>

        <section>
          <h2 className="font-semibold">Kontakt</h2>
          <p className="mt-2 text-muted">
            E-Mail: {zeige(L.email)}
            {L.telefon && (
              <>
                <br />
                Telefon: {L.telefon}
              </>
            )}
          </p>
        </section>

        {L.ustIdNr && (
          <section>
            <h2 className="font-semibold">Umsatzsteuer-Identifikationsnummer</h2>
            <p className="mt-2 text-muted">Gemäß § 27 a Umsatzsteuergesetz: {L.ustIdNr}</p>
          </section>
        )}

        {L.verantwortlich && (
          <section>
            <h2 className="font-semibold">Redaktionell verantwortlich</h2>
            <p className="mt-2 text-muted">{L.verantwortlich}</p>
          </section>
        )}

        <section>
          <h2 className="font-semibold">Streitschlichtung</h2>
          <p className="mt-2 text-muted">
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Haftung für Inhalte</h2>
          <p className="mt-2 text-muted">
            Die Inhalte dieser Seite werden mit Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und
            Aktualität können wir jedoch keine Gewähr übernehmen. Die dargestellten Angaben zu KI-Modellen und
            Anbietern stammen aus öffentlichen Quellen und Anbieterdokumentation; Anbieter ändern ihre
            Bedingungen laufend. Jede Angabe ist mit Quelle und Prüfdatum versehen - maßgeblich ist stets die
            verlinkte Originalquelle.
          </p>
          <p className="mt-2 text-muted">
            Die datenschutzrechtlichen Einordnungen auf dieser Seite sind allgemeine Information und{' '}
            <strong className="text-fg">keine Rechtsberatung</strong>. Sie ersetzen keine Prüfung des
            Einzelfalls durch fachkundige Personen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Haftung für Links</h2>
          <p className="mt-2 text-muted">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
            haben. Für diese fremden Inhalte ist stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden
            von Rechtsverletzungen entfernen wir derartige Links umgehend.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Urheberrecht</h2>
          <p className="mt-2 text-muted">
            Die durch die Betreiber erstellten Inhalte unterliegen dem deutschen Urheberrecht. Marken- und
            Produktnamen der genannten Anbieter sind Eigentum der jeweiligen Rechteinhaber und werden
            ausschließlich zur Beschreibung verwendet.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Fehler melden</h2>
          <p className="mt-2 text-muted">
            Sollte eine Angabe zu einem Anbieter unzutreffend oder veraltet sein, melden Sie das bitte an{' '}
            {zeige(L.email)}. Wir prüfen und korrigieren umgehend.
          </p>
        </section>
      </div>
    </div>
  );
}
