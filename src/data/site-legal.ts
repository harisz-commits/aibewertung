// Betreiberangaben für Impressum und Datenschutzerklärung.
//
// ⚠️ VOR DEM LIVEGANG AUSFÜLLEN. Die mit AUSFÜLLEN markierten Felder sind
// Pflichtangaben nach § 5 DDG (früher § 5 TMG) bzw. Art. 13 DSGVO und können
// nur vom Betreiber eingetragen werden. Solange sie leer sind, weist die Seite
// sichtbar darauf hin, statt Angaben zu erfinden.
//
// ⚠️ Dieser Text ist eine sorgfältig erstellte Vorlage, aber KEINE
// Rechtsberatung. Vor dem Livegang von einer Fachanwältin oder einem
// Fachanwalt prüfen lassen - insbesondere, wenn Newsletter, Auftragsverarbeiter
// oder weitere Dienste hinzukommen.

export interface SiteLegal {
  betreiber: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  email: string;
  telefon: string | null;
  ustIdNr: string | null;
  /** Nur nötig bei journalistisch-redaktionellen Inhalten (§ 18 Abs. 2 MStV). */
  verantwortlich: string | null;
  /** Pflicht, sobald ein Datenschutzbeauftragter benannt ist (Art. 37 DSGVO). */
  datenschutzbeauftragter: string | null;
  /** Hosting-Anbieter - für die Datenschutzerklärung erforderlich. */
  hoster: string;
  hosterAdresse: string;
  hosterAvv: string | null;
}

const PLATZHALTER = 'AUSFÜLLEN';

export const SITE_LEGAL: SiteLegal = {
  betreiber: PLATZHALTER,
  strasse: PLATZHALTER,
  plz: PLATZHALTER,
  ort: PLATZHALTER,
  land: 'Deutschland',
  email: PLATZHALTER,
  telefon: null,
  ustIdNr: null,
  verantwortlich: null,
  datenschutzbeauftragter: null,
  // Vorbelegt, weil die Seite auf Vercel läuft - anpassen, falls sich das ändert.
  hoster: 'Vercel Inc.',
  hosterAdresse: '340 S Lemon Ave #4133, Walnut, CA 91789, USA',
  hosterAvv: 'https://vercel.com/legal/dpa'
};

/** true, solange Pflichtangaben fehlen - die Seiten weisen dann sichtbar aus,
 * dass sie noch nicht vollständig sind, statt Erfundenes anzuzeigen. */
export const LEGAL_UNVOLLSTAENDIG = Object.entries(SITE_LEGAL).some(
  ([, v]) => v === PLATZHALTER
);

export const istPlatzhalter = (v: string | null) => v === PLATZHALTER || v === null;
export const zeige = (v: string | null) => (istPlatzhalter(v) ? '[noch nicht hinterlegt]' : (v as string));
