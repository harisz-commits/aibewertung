// Deterministische Ampel je (Einsatzweg × Datenklasse).
//
// Bewusst regelbasiert und nachvollziehbar - wie unsere Score-Engine setzt
// kein Sprachmodell die Bewertung. Jede Ampel liefert die auslösenden Regeln
// im Klartext mit, weil die Begründung der eigentliche Nutzen ist.
//
// Grundhaltung im Zweifel: NICHT grün. Fehlende Belege führen zu 'unknown',
// nie zu einer Freigabe.

import type { DataClass, ProviderCompliance, Verdict, VerdictReason, VerdictResult } from './types.ts';

const RANK: Record<Exclude<Verdict, 'unknown'>, number> = { green: 0, yellow: 1, orange: 2, red: 3 };

/** Schlechteste (= vorsichtigste) der beiden Bewertungen gewinnt. */
function worse(a: Verdict, b: Verdict): Verdict {
  if (a === 'unknown' || b === 'unknown') return a === 'red' || b === 'red' ? 'red' : 'unknown';
  return RANK[a] >= RANK[b] ? a : b;
}

export function evaluate(p: ProviderCompliance, dataClass: DataClass): VerdictResult {
  const reasons: VerdictReason[] = [];
  let verdict: Verdict = 'green';
  const down = (v: Verdict) => {
    verdict = worse(verdict, v);
  };

  // --- S0: keine personenbezogenen Daten -----------------------------------
  // DSGVO greift nicht. Einzig relevantes Restrisiko: Betriebsgeheimnisse in
  // Trainingsdaten.
  if (dataClass === 'S0') {
    if (p.trainingOnCustomerData === 'yes') {
      down('yellow');
      reasons.push({
        severity: 'condition',
        text: 'Anbieter nutzt Eingaben zum Training. Für personenbezogene Daten ungeeignet - auch ohne Personenbezug sollten keine Betriebsgeheimnisse hinein.'
      });
    } else if (p.trainingOnCustomerData === 'unknown') {
      down('unknown');
      reasons.push({ severity: 'info', text: 'Ob der Anbieter auf Eingaben trainiert, ist nicht belegt.' });
    }
    if (verdict === 'green') {
      reasons.push({ severity: 'info', text: 'Ohne Personenbezug greift die DSGVO nicht. Trotzdem keine Betriebsgeheimnisse eingeben.' });
    }
    return { verdict, reasons };
  }

  // --- Ab S1: personenbezogene Daten ---------------------------------------

  // 1) AVV nach Art. 28 DSGVO ist Grundvoraussetzung - außer beim Selbstbetrieb,
  //    denn ohne Dritten gibt es keine Auftragsverarbeitung.
  if (p.hostingRegion === 'self_hosted') {
    reasons.push({ severity: 'info', text: 'Selbstbetrieb: kein Auftragsverarbeiter, daher kein AVV nötig.' });
  } else if (p.dpaAvailable === false) {
    reasons.push({ severity: 'blocker', text: 'Kein Auftragsverarbeitungsvertrag (AVV) verfügbar. Ohne AVV ist die Verarbeitung personenbezogener Daten nach Art. 28 DSGVO nicht zulässig.' });
    return { verdict: 'red', reasons };
  }
  else if (p.dpaAvailable === null) {
    down('unknown');
    reasons.push({ severity: 'info', text: 'Ob ein AVV angeboten wird, ist nicht belegt.' });
  } else {
    reasons.push({ severity: 'condition', text: 'AVV muss vor dem Einsatz tatsächlich abgeschlossen werden - vorhanden heißt nicht automatisch geschlossen.' });
  }

  // 2) Training auf Kundendaten.
  if (p.trainingOnCustomerData === 'yes') {
    reasons.push({ severity: 'blocker', text: 'Anbieter nutzt Eingaben zum Modelltraining. Für personenbezogene Daten nicht vertretbar.' });
    return { verdict: 'red', reasons };
  }
  if (p.trainingOnCustomerData === 'opt_out') {
    down('yellow');
    reasons.push({ severity: 'condition', text: 'Training ist standardmäßig aktiv und muss aktiv abgeschaltet werden (Opt-out).' });
  } else if (p.trainingOnCustomerData === 'unknown') {
    down('unknown');
    reasons.push({ severity: 'info', text: 'Ob auf Eingaben trainiert wird, ist nicht belegt.' });
  } else if (p.trainingOnCustomerData === 'no') {
    reasons.push({ severity: 'info', text: 'Anbieter trainiert laut eigener Dokumentation nicht auf Kundendaten.' });
  }

  // 3) Hosting-Region / Drittlandtransfer (Art. 44 ff. DSGVO).
  switch (p.hostingRegion) {
    case 'self_hosted':
      reasons.push({ severity: 'info', text: 'Selbst betrieben - Daten verlassen die eigene Infrastruktur nicht. Kein Drittlandtransfer.' });
      break;
    case 'eu':
      reasons.push({ severity: 'info', text: `Verarbeitung in der EU/EWR${p.hostingDetail ? ` (${p.hostingDetail})` : ''}. Kein Drittlandtransfer.` });
      break;
    case 'us_dpf':
      down(dataClass === 'S1' ? 'yellow' : 'orange');
      reasons.push({
        severity: 'condition',
        text: 'Verarbeitung in den USA auf Basis des EU-US Data Privacy Framework. Rechtlich zulässig, aber politisch angreifbar - bei sensiblen Daten EU-Region oder Selbstbetrieb vorziehen.'
      });
      break;
    case 'us_no_dpf':
      reasons.push({ severity: 'blocker', text: 'Verarbeitung in den USA ohne Angemessenheitsgrundlage. Für personenbezogene Daten nicht empfehlenswert.' });
      return { verdict: 'red', reasons };
    case 'other':
      reasons.push({ severity: 'blocker', text: 'Verarbeitung in einem Drittland ohne Angemessenheitsbeschluss.' });
      return { verdict: 'red', reasons };
    default:
      down('unknown');
      reasons.push({ severity: 'info', text: 'Verarbeitungsort ist nicht belegt.' });
  }

  // 4) S2 - besondere Kategorien (Art. 9 DSGVO).
  if (dataClass === 'S2' || dataClass === 'S3') {
    if (p.hostingRegion === 'eu' || p.hostingRegion === 'self_hosted') {
      reasons.push({ severity: 'condition', text: 'Besondere Kategorien nach Art. 9 DSGVO: zusätzlich Rechtsgrundlage, Löschkonzept und dokumentierte technische Maßnahmen erforderlich.' });
    } else {
      down('orange');
      reasons.push({ severity: 'condition', text: 'Für Gesundheits- und andere Art.-9-Daten außerhalb der EU: nur pseudonymisiert oder anonymisiert übermitteln.' });
    }
  }

  // 5) S3 - Berufsgeheimnis (§ 203 StGB). Für Kanzlei, Praxis, Steuerberatung
  //    der entscheidende Punkt: Der Anbieter wird "mitwirkende Person" und muss
  //    vertraglich zur Geheimhaltung verpflichtet werden.
  if (dataClass === 'S3') {
    if (p.hostingRegion !== 'self_hosted') {
      // Häufigster und teuerster Irrtum in der Praxis: Ein AVV nach Art. 28
      // DSGVO deckt § 203 StGB NICHT ab. Das sind zwei getrennte Pflichten.
      reasons.push({
        severity: 'condition',
        text: 'Ein AVV nach Art. 28 DSGVO deckt das Berufsgeheimnis NICHT ab - dafür braucht es zusätzlich eine gesonderte Verschwiegenheitsvereinbarung nach § 203 Abs. 4 StGB, in Textform und mit Belehrung über die Strafbarkeit. Auch eingesetzte Beschäftigte und Unterauftragnehmer müssen verpflichtet werden.'
      });
    }
    if (p.supportsProfessionalSecrecy === true) {
      // Bleibt grün, aber NUR mit der Zusatzvereinbarung - das steht als
      // Auflage im Klartext und als Kennzeichnung an der Ampel.
      reasons.push({
        severity: 'condition',
        text: p.secrecyHinweis
          ? `Nur mit Verschwiegenheitsvereinbarung: ${p.secrecyHinweis}`
          : 'Nur mit gesonderter Verschwiegenheitsvereinbarung nach § 203 Abs. 4 StGB - diese muss tatsächlich geschlossen und auf Verlangen vorlegbar sein.'
      });
      if (p.secrecyEvidence === 'community') {
        reasons.push({
          severity: 'condition',
          text: 'Achtung Belegqualität: Diese Angabe stützt sich auf eine Dritt- oder Erfahrungsquelle, nicht auf eine Zusicherung des Anbieters. Vor dem Einsatz mit Mandantendaten schriftlich beim Anbieter bestätigen lassen.'
        });
      }
    } else if (p.supportsProfessionalSecrecy === false) {
      down('red');
      reasons.push({ severity: 'blocker', text: 'Anbieter bietet keine Verschwiegenheitsvereinbarung nach § 203 StGB an. Für Mandanten-, Patienten- oder Steuergeheimnisse nicht einsetzbar.' });
    } else {
      down('orange');
      reasons.push({ severity: 'condition', text: 'Ob der Anbieter eine Verschwiegenheitsvereinbarung nach § 203 Abs. 4 StGB anbietet, ist nicht belegt. Bis das schriftlich geklärt ist: nur ohne Mandantenbezug verwenden (Namen, Steuernummern und Aktenzeichen entfernen).' });
    }
  }

  return { verdict, reasons };
}

/** Rangfolge für "welches Urteil ist besser". 'unknown' liegt bewusst hinter
 * 'orange': ein ungeprüfter Weg ist keine Empfehlung. */
const ORDER: Record<Verdict, number> = { green: 0, yellow: 1, orange: 2, unknown: 3, red: 4 };

/** Beste erreichbare Bewertung eines Modells über alle seine Einsatzwege -
 * für die Übersichtstabelle. Liefert den Weg mit, der sie erreicht, damit die
 * Tabelle sagen kann "grün, aber nur über Azure EU". */
export function bestVerdict(
  routes: ProviderCompliance[],
  dataClass: DataClass
): { verdict: Verdict; via: ProviderCompliance | null } {
  let best: Verdict = 'unknown';
  let via: ProviderCompliance | null = null;
  for (const r of routes) {
    const { verdict } = evaluate(r, dataClass);
    if (via === null || ORDER[verdict] < ORDER[best]) {
      best = verdict;
      via = r;
    }
  }
  return { verdict: best, via };
}
