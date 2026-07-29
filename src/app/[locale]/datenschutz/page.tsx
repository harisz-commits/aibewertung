import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';
import { SITE_LEGAL, LEGAL_UNVOLLSTAENDIG, zeige } from '@/data/site-legal';

export const metadata: Metadata = { title: 'Datenschutzerklärung', robots: { index: false } };

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold">{titel}</h2>
      <div className="mt-2 space-y-2 text-muted">{children}</div>
    </section>
  );
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const L = SITE_LEGAL;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Datenschutzerklärung</h1>

      {LEGAL_UNVOLLSTAENDIG && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <strong className="font-medium text-danger">Noch nicht vollständig.</strong>
            <p className="mt-1 text-muted">
              Die Angaben zum Verantwortlichen fehlen. Vor dem Livegang in{' '}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">src/data/site-legal.ts</code>{' '}
              eintragen und diese Erklärung fachkundig prüfen lassen.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <Abschnitt titel="1. Verantwortlicher">
          <address className="not-italic">
            {zeige(L.betreiber)}
            <br />
            {zeige(L.strasse)}
            <br />
            {zeige(L.plz)} {zeige(L.ort)}, {L.land}
            <br />
            E-Mail: {zeige(L.email)}
          </address>
          {L.datenschutzbeauftragter && <p>Datenschutzbeauftragte:r: {L.datenschutzbeauftragter}</p>}
        </Abschnitt>

        <Abschnitt titel="2. Grundsatz">
          <p>
            Diese Website ist bewusst datensparsam gebaut. Es gibt keine Benutzerkonten, kein Tracking, keine
            Analyse-Werkzeuge, keine Werbenetzwerke und keine Einbindung sozialer Netzwerke. Es werden keine
            Cookies zu Analyse- oder Marketingzwecken gesetzt.
          </p>
        </Abschnitt>

        <Abschnitt titel="3. Aufruf der Website (Server-Logfiles)">
          <p>
            Beim Aufruf werden technisch notwendige Daten an unseren Hosting-Anbieter übertragen und dort
            kurzzeitig verarbeitet: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, übertragene
            Datenmenge, Referrer sowie Browser- und Betriebssystemangaben.
          </p>
          <p>
            <strong className="text-fg">Zweck:</strong> Auslieferung der Seite, Betriebssicherheit und Abwehr
            von Missbrauch. <strong className="text-fg">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse am sicheren Betrieb).
          </p>
        </Abschnitt>

        <Abschnitt titel="4. Hosting">
          <p>
            Die Website wird gehostet bei {L.hoster}, {L.hosterAdresse}. Der Anbieter verarbeitet die unter
            Ziffer 3 genannten Daten in unserem Auftrag als Auftragsverarbeiter nach Art. 28 DSGVO.
          </p>
          <p>
            Dabei kann eine Übermittlung in die USA stattfinden. Grundlage sind die Standardvertragsklauseln
            der Europäischen Kommission und ergänzende Schutzmaßnahmen des Anbieters.
            {L.hosterAvv && (
              <>
                {' '}
                Der Auftragsverarbeitungsvertrag ist abrufbar unter{' '}
                <a href={L.hosterAvv} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  {L.hosterAvv}
                </a>
                .
              </>
            )}
          </p>
        </Abschnitt>

        <Abschnitt titel="5. Spracheinstellung und Farbschema">
          <p>
            Ihre Auswahl von Sprache und hellem oder dunklem Erscheinungsbild wird ausschließlich lokal in
            Ihrem Browser gespeichert (localStorage). Diese Angaben werden nicht an uns übertragen und nicht
            zur Wiedererkennung verwendet. Sie können sie jederzeit über die Einstellungen Ihres Browsers
            löschen.
          </p>
        </Abschnitt>

        <Abschnitt titel="6. Kontaktaufnahme">
          <p>
            Wenn Sie uns per E-Mail schreiben, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage.
            <strong className="text-fg"> Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO, bei
            vertragsbezogenen Anfragen Art. 6 Abs. 1 lit. b DSGVO. Wir löschen die Daten, sobald sie für den
            Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungsfristen entgegenstehen.
          </p>
        </Abschnitt>

        <Abschnitt titel="7. Newsletter">
          <p>
            Sofern ein Newsletter angeboten wird, erfolgt die Anmeldung im Double-Opt-in-Verfahren: Nach
            Eintragung Ihrer E-Mail-Adresse erhalten Sie eine Bestätigungsmail; erst nach Ihrer Bestätigung
            nehmen wir Sie auf. <strong className="text-fg">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a
            DSGVO (Einwilligung). Sie können die Einwilligung jederzeit mit Wirkung für die Zukunft
            widerrufen, etwa über den Abmeldelink in jeder Nachricht.
          </p>
          <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-fg">
            <strong className="font-medium">Hinweis an den Betreiber:</strong> Das Anmeldefeld im Fußbereich
            versendet derzeit keine Daten. Bevor der Versand aktiviert wird, müssen Double-Opt-in, ein
            Auftragsverarbeitungsvertrag mit dem Versanddienstleister und dessen Nennung an dieser Stelle
            ergänzt werden.
          </p>
        </Abschnitt>

        <Abschnitt titel="8. Externe Verlinkungen">
          <p>
            Wir verlinken auf Dokumentation und Angebote der genannten Anbieter. Beim Anklicken gelten deren
            Datenschutzbestimmungen. Ein automatisches Nachladen von Inhalten dieser Anbieter findet auf
            unseren Seiten nicht statt.
          </p>
        </Abschnitt>

        <Abschnitt titel="9. Ihre Rechte">
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
            Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen
            Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO). Erteilte Einwilligungen
            können Sie jederzeit widerrufen.
          </p>
          <p>
            Wenden Sie sich dafür an {zeige(L.email)}. Unabhängig davon steht Ihnen ein Beschwerderecht bei
            einer Datenschutz-Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts
            oder des mutmaßlichen Verstoßes (Art. 77 DSGVO).
          </p>
        </Abschnitt>

        <Abschnitt titel="10. Änderungen">
          <p>
            Wir passen diese Erklärung an, wenn sich die Verarbeitung ändert - etwa bei Einführung von
            Benutzerkonten, Newsletter-Versand oder Reichweitenmessung. Es gilt die jeweils hier abrufbare
            Fassung.
          </p>
        </Abschnitt>
      </div>
    </div>
  );
}
