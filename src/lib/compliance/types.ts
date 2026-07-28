// Datenschutz-Einordnung von KI-Einsatzwegen.
//
// GRUNDPRINZIP: DSGVO-Konformität ist keine Eigenschaft des MODELLS, sondern
// des EINSATZWEGS. Dasselbe Modell kann über Azure OpenAI (EU-Region, AVV,
// kein Training) unproblematisch und über einen Endpunkt ohne AVV unzulässig
// sein. Die Attribute hängen deshalb am Anbieter/Endpunkt.
//
// KEINE RECHTSBERATUNG: Diese Einordnung ist eine Orientierung auf Basis
// öffentlich dokumentierter Anbieterangaben. Sie ersetzt keine Prüfung des
// Einzelfalls. Jede Angabe trägt Quelle und Prüfdatum.

/** Wie sensibel sind die Daten, die in das Modell gehen? Das Urteil hängt
 * genauso stark hiervon ab wie vom Anbieter. */
export type DataClass = 'S0' | 'S1' | 'S2' | 'S3';

export const DATA_CLASSES: { id: DataClass; de: string; beispiel: string; norm: string }[] = [
  { id: 'S0', de: 'Keine personenbezogenen Daten', beispiel: 'Textbausteine, allgemeine Recherche, Code', norm: '—' },
  { id: 'S1', de: 'Normale personenbezogene Daten', beispiel: 'Name, Adresse, E-Mail-Verkehr', norm: 'Art. 6 DSGVO' },
  { id: 'S2', de: 'Besondere Kategorien', beispiel: 'Gesundheit, Religion, Gewerkschaft, Biometrie', norm: 'Art. 9 DSGVO' },
  { id: 'S3', de: 'Berufsgeheimnis', beispiel: 'Mandats-, Patienten-, Steuergeheimnis', norm: '§ 203 StGB' }
];

export type HostingRegion = 'eu' | 'us_dpf' | 'us_no_dpf' | 'other' | 'self_hosted' | 'unknown';
export type TrainingUse = 'no' | 'opt_out' | 'yes' | 'unknown';

/** Belegte Eigenschaften eines Einsatzwegs. `sourceUrl` und `checkedAt` sind
 * Pflicht — eine Compliance-Aussage über ein Unternehmen ohne Beleg und Datum
 * wird nicht veröffentlicht. */
export interface ProviderCompliance {
  slug: string;
  name: string;
  /** Konkreter Einsatzweg, z. B. "Azure OpenAI (EU-Region)". */
  route: string;
  hostingRegion: HostingRegion;
  hostingDetail: string | null;
  legalEntity: string | null;
  legalEntityCountry: string | null;
  /** Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. */
  dpaAvailable: boolean | null;
  dpaUrl: string | null;
  subprocessorsUrl: string | null;
  trainingOnCustomerData: TrainingUse;
  retention: string | null;
  zeroRetentionAvailable: boolean | null;
  certifications: string[];
  /** Verpflichtung mitwirkender Personen (§ 203 Abs. 3 StGB) vertraglich
   * abgedeckt? Für Kanzleien/Praxen der entscheidende Punkt. */
  supportsProfessionalSecrecy: boolean | null;
  sourceUrl: string;
  sourceUrl2?: string;
  checkedAt: string;
  /** Offene Punkte, die wir NICHT belegen konnten. Wird sichtbar ausgewiesen. */
  openQuestions?: string[];
}

export type Verdict = 'green' | 'yellow' | 'orange' | 'red' | 'unknown';

export interface VerdictReason {
  /** 'blocker' verhindert den Einsatz, 'condition' ist eine Auflage,
   * 'info' erklärt nur. */
  severity: 'blocker' | 'condition' | 'info';
  text: string;
}

export interface VerdictResult {
  verdict: Verdict;
  reasons: VerdictReason[];
}
