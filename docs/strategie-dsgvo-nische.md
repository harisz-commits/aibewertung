# botbrix — Strategie: Deutscher KI-Compliance-Guide für Unternehmen

**Stand:** 2026-07-28 · **Status:** Plan, noch nicht umgesetzt

---

## 1. Zielbild

**Vorher:** „CoinMarketCap für KI" — Wettrennen um Daten gegen OpenRouter (hat Traffic-Daten,
weil sie der Marktplatz sind) und Artificial Analysis (betreibt ein eigenes Eval-Labor).
Nicht gewinnbar.

**Neu:** Die Seite, die einem deutschen Betrieb ohne IT-Abteilung beantwortet:

> *Darf ich KI für meine Arbeit einsetzen — und wenn ja, welche, wie richte ich das ein,
> und was darf ich auf keinen Fall reingeben?*

Der Wert liegt nicht in mehr Zahlen, sondern in **Einordnung und Urteil**. Das ist genau
das, was sich nicht wegkopieren lässt — und was OpenRouter und AA strukturell nie tun
werden, weil ihre Zielgruppe englischsprachige Entwickler sind.

### Abgrenzung — was wir NICHT machen
- Kein Konkurrenzkampf um Benchmark-Zahlen (wir zeigen sie, aber sie sind nicht der Kern)
- Keine Rechtsberatung im Einzelfall (siehe §12 — das ist in Deutschland reguliert)
- Keine Traffic-/Nutzungsdaten, die wir nicht haben

---

## 2. Zielgruppen (priorisiert)

Auswahlkriterien: viel wiederkehrende Textarbeit × reguliert × zahlungskräftig × technisch
unterversorgt.

| Prio | Branche | Warum | Regulatorischer Kern |
|---|---|---|---|
| 1 | **Steuerkanzlei / Buchhaltung** | Enormes Dokumentenvolumen, Geld da, wenig IT | § 203 StGB, StBerG, DSGVO |
| 2 | **Rechtsanwaltskanzlei** | Schriftsätze, Recherche, Mandantenkommunikation | § 203 StGB, BRAO, DSGVO |
| 3 | **Arztpraxis / MVZ / Therapie** | Befunde, Briefe, Doku | **Art. 9 DSGVO**, § 203 StGB, MBO-Ä |
| 4 | **Handwerksbetrieb** | Angebote, Rechnungen, Kundenmails | DSGVO (normal), AI Act |
| 5 | **Hausverwaltung / Immobilien** | Mieterkommunikation, Verträge | DSGVO (normal) |
| 6 | **Pflegedienst** | Pflegedoku, Berichte | **Art. 9 DSGVO** |
| 7 | **Versicherungsmakler** | Beratungsdokumentation | DSGVO, VVG |
| 8 | **Schule / Bildungsträger** | Schülerdaten, Elternkommunikation | DSGVO, Landesschulgesetze |

**Startempfehlung:** Eine Branche komplett durchziehen (**Steuerkanzlei**), bevor wir
skalieren. Höchster Leidensdruck, klarster Rechtsrahmen, zahlungskräftig.

---

## 3. Kernprinzip (das wichtigste Konzept im ganzen Plan)

> **DSGVO-Konformität ist keine Eigenschaft des Modells. Sie ist eine Eigenschaft des
> Einsatzwegs.**

Dasselbe Modell kann grün oder rot sein:

| Einsatzweg | Bewertung |
|---|---|
| GPT-5.6 über Azure OpenAI, Region Schweden, mit AVV, kein Training | 🟢 |
| GPT-5.6 über `api.openai.com` ohne AVV | 🔴 |
| GPT-5.6 über die kostenlose ChatGPT-Weboberfläche | 🔴 |

**Konsequenz für die Datenmodellierung:** Compliance-Attribute hängen am
**Anbieter/Endpunkt**, nicht am Modell. Wir haben bereits `providers[]` pro Modell —
genau dort gehören sie hin.

**Zweite Achse:** Das Urteil hängt davon ab, *welche Daten* reingehen. Eine Ampel ohne
Datenklasse ist wertlos.

---

## 4. Datenmodell-Erweiterung

### 4.1 Datenklassen (Sensitivitätsstufen)

| Stufe | Bezeichnung | Beispiele | Rechtsgrundlage |
|---|---|---|---|
| **S0** | Keine Personendaten | Textbausteine, Code, allgemeine Recherche | — |
| **S1** | Normale Personendaten | Kundenname, Adresse, Mailverkehr | Art. 6 DSGVO |
| **S2** | Besondere Kategorien | Gesundheit, Religion, Gewerkschaft, Biometrie | **Art. 9 DSGVO** |
| **S3** | Berufsgeheimnis | Mandats-, Patienten-, Steuergeheimnis | **§ 203 StGB** |

### 4.2 Neue Felder pro Anbieter/Endpunkt

```ts
interface ProviderCompliance {
  hostingRegion: 'eu' | 'us_dpf' | 'us_no_dpf' | 'other' | 'self_hosted';
  hostingDetail: string | null;        // z. B. "Schweden, Azure Sweden Central"
  legalEntity: string | null;          // Vertragspartner
  legalEntityCountry: string | null;
  dpaAvailable: boolean | null;        // AVV nach Art. 28 DSGVO
  dpaUrl: string | null;
  subprocessorsUrl: string | null;     // Unterauftragsverarbeiter transparent?
  trainingOnCustomerData: 'no' | 'opt_out' | 'yes' | 'unknown';
  retention: string | null;            // z. B. "30 Tage" / "Zero Retention möglich"
  zeroRetentionAvailable: boolean | null;
  certifications: string[];            // ISO 27001, SOC 2 Typ II, BSI C5
  supportsProfessionalSecrecy: boolean | null;  // Verpflichtung mitwirkender
                                                // Personen, § 203 Abs. 3 StGB
  sourceUrl: string;                   // Beleg — Pflichtfeld
  checkedAt: string;                   // Datum — Pflichtfeld
}
```

**Zwei Pflichtfelder, keine Ausnahme:** `sourceUrl` und `checkedAt`. Jede Compliance-Aussage
über ein Unternehmen muss belegt und datiert sein (siehe §12).

---

## 5. Ampel-Logik

Deterministisch und nachvollziehbar — dieselbe Philosophie wie unsere Scores. Kein LLM
setzt die Bewertung.

Ergebnis ist eine **Matrix**: Einsatzweg × Datenklasse.

| Ampel | Bedeutung |
|---|---|
| 🟢 **Unproblematisch** | EU-Hosting oder Self-Hosting, AVV vorhanden, kein Training auf Kundendaten |
| 🟡 **Machbar mit Auflagen** | Zulässig, aber konkrete Schritte nötig (AVV abschließen, Training abschalten, TOM dokumentieren) — Auflagen werden einzeln aufgelistet |
| 🟠 **Nur anonymisiert** | Personenbezug muss vorher raus (Pseudonymisierung, Schwärzung) |
| 🔴 **Nicht empfehlenswert** | Kein AVV, Drittland ohne Garantien, Training auf Kundendaten |

**Beispiel-Regeln (Auszug):**
- `trainingOnCustomerData === 'yes'` → 🔴 ab S1
- `dpaAvailable !== true` → 🔴 ab S1
- `hostingRegion === 'eu'` + AVV + kein Training → 🟢 bis S2
- S3 (§ 203) zusätzlich: `supportsProfessionalSecrecy === true` sonst max. 🟠
- `hostingRegion === 'us_dpf'` → max. 🟡 ab S1 (mit Hinweis auf Rechtsunsicherheit)
- `self_hosted` → 🟢 bis S3

**Wichtig:** Jede Ampel zeigt **warum** — die auslösenden Regeln im Klartext, nicht nur die
Farbe. Das ist der eigentliche Mehrwert.

---

## 6. Tabelle & Filter

**Neue Spalte:** „DSGVO-Einsatz" — Ampel für den *besten verfügbaren* Einsatzweg, bezogen
auf eine oben wählbare Datenklasse (Standard: S1).

**Neue Filter:**
- Datenklasse (S0–S3) — steuert die gesamte Ampel-Spalte
- ☑ Nur EU-Hosting
- ☑ AVV verfügbar
- ☑ Kein Training auf meinen Daten
- ☑ Lokal betreibbar
- ☑ BSI C5 / ISO 27001

**Neue Sortierung:** „DSGVO-Eignung"

**Chance, die wir haben und die Konkurrenz nicht:** EU-Anbieter sind auf OpenRouter und AA
kaum vertreten. **Aleph Alpha, IONOS AI Model Hub, STACKIT (Schwarz Gruppe), Telekom /
T-Systems, Open Telekom Cloud, Scaleway, OVHcloud, Nebius, Mistral** — die decken wir ab,
und dort sind wir dann tatsächlich die bessere Quelle. Das ist eine echte Datenlücke zu
unseren Gunsten.

---

## 7. Modell-Detailseiten (deutlich ausgebaut)

Aufbau je Modell, in dieser Reihenfolge (Laien zuerst):

1. **In einem Satz** — was kann das, für wen lohnt sich das
2. **DSGVO-Ampel je Einsatzweg** — Tabelle Anbieter × Datenklasse, mit Begründung
3. **Was darf ich reingeben, was nicht** — konkrete Beispiele, keine Paragraphen
4. **So richtest du es ein** — Schritt für Schritt, pro Einsatzweg, mit Screenshots
5. **Was kostet mich das wirklich** — nicht $/1M Token, sondern
   „500 Kundenmails/Monat ≈ X €"
6. **Wofür ist es gut / schlecht** — ehrlich, inkl. Schwächen
7. **Alternativen** — inkl. EU-Anbieter und lokaler Option
8. **Benchmarks** — bleibt, aber nach unten, als Beleg statt als Hauptsache
9. **Quellen & Stand** — jede Compliance-Aussage mit Link und Datum

---

## 8. Branchen- und Anwendungsfallseiten (der SEO-Kern)

**Das ist der eigentliche Traffic- und Umsatzmotor.** Ein Steuerberater sucht nicht
„GPT-5.6" — er sucht *„KI Steuerkanzlei DSGVO"* oder *„darf ich ChatGPT für Mandantendaten
nutzen"*.

### `/branchen/<slug>` — z. B. `/branchen/steuerkanzlei`
- Typische Aufgaben, bei denen KI wirklich Zeit spart (konkret, nicht generisch)
- Was ist erlaubt, was nicht — mit den einschlägigen Normen in Alltagssprache
- Empfohlenes Setup (3 Varianten: einfach / solide / maximale Kontrolle)
- Konkrete Modellempfehlung mit Begründung
- Realistische Kosten- und Zeitersparnisrechnung
- **Checkliste zum Abhaken** vor dem Start
- Häufige Fehler („Mandantenname in den Prompt" u. Ä.)

### `/anwendungsfaelle/<slug>`
`angebot-schreiben` · `kundenmail-beantworten` · `protokoll-zusammenfassen` ·
`dokument-auswerten` · `text-uebersetzen` · `rechnung-pruefen`

Aufgabenorientiert, branchenübergreifend, mit fertigen Prompt-Vorlagen auf Deutsch.

**Umfang Zielbild:** 8 Branchen × 6 Anwendungsfälle + 345 Modellseiten × 2 Sprachen.
Aber: **Qualität vor Menge.** Lieber 3 exzellente Branchenseiten als 8 dünne — dünner
Content rankt heute nicht mehr.

---

## 9. Interaktive Werkzeuge (Lead-Motor)

| Werkzeug | Funktion | Zweck |
|---|---|---|
| **DSGVO-Schnellcheck** | 5 Fragen (Branche, Datenart, Cloud erlaubt?, Budget, IT vorhanden?) → Ampel + konkrete Empfehlung + PDF | Kern-Einstieg, hoch teilbar |
| **Kostenrechner** | Reale Arbeitslast → €/Monat je Einsatzweg | Beantwortet die tatsächliche Frage |
| **Setup-Assistent** | Gewählter Weg → Schritt-für-Schritt-Anleitung | Senkt Umsetzungshürde |

**Downloads gegen E-Mail** (der eigentliche Lead-Kanal):
- AVV-Checkliste für KI-Anbieter
- Muster **KI-Nutzungsrichtlinie** für Mitarbeitende
- Vorlage Eintrag ins **Verzeichnis von Verarbeitungstätigkeiten (VVT)**
- Branchen-Leitfaden als PDF

---

## 10. Wissensbasis `/wissen/`

Erklärstücke in Alltagssprache, jeweils mit „Was heißt das für mich konkret?"-Kasten:

- **AVV** — Was ist ein Auftragsverarbeitungsvertrag und warum brauche ich den
- **Art. 9 DSGVO** — Gesundheitsdaten und andere heikle Kategorien
- **§ 203 StGB** — Berufsgeheimnis: Wann darf ein IT-Dienstleister mitwirken
- **Drittlandtransfer** — US-Anbieter, EU-US Data Privacy Framework, aktueller Stand
- **EU AI Act** — **Pflichten für Betreiber** (nicht nur Hersteller!), inkl.
  KI-Kompetenz-Pflicht nach Art. 4
- **Betriebsrat** — Mitbestimmung nach § 87 BetrVG bei KI-Tools ← *stark unterversorgtes
  Thema*
- **TOM** — Technische und organisatorische Maßnahmen, praktisch
- **Löschkonzept & Zweckbindung**

Diese Seiten sind gleichzeitig SEO-Fläche und Vertrauensbeweis.

---

## 11. Datenbeschaffung & Pflege — der Burggraben

**Das ist bewusst Handarbeit, und genau deshalb verteidigbar.** Die Compliance-Daten sind
nirgends als API abrufbar; sie erfordern Recherche und Urteil.

**Einmalige Erhebung:** ~20–30 Anbieter (OpenAI, Anthropic, Google, Azure OpenAI, AWS
Bedrock, Mistral, Aleph Alpha, IONOS, STACKIT, Telekom, Scaleway, OVH, Nebius,
Groq, Together, Fireworks, DeepInfra …). Pro Anbieter: AVV-Seite, Unterauftragsverarbeiter,
Regionen, Trainingsrichtlinie, Zertifikate. **Aufwand: 30–60 Min. pro Anbieter.**

**Pflege:** Quartalsweise Prüfung + `checkedAt` aktualisieren. Anbieter ändern Richtlinien —
veraltete Aussagen sind hier ein echtes Risiko, kein Schönheitsfehler.

**Technisch:** Erfassung als versionierte JSON-Datei im Repo
(`src/data/provider-compliance.json`), wie unsere anderen Snapshots. Admin-Oberfläche
später.

---

## 12. Rechtliche Leitplanken ⚠️

Das ist kein Kleingedrucktes, sondern eine Voraussetzung für das ganze Vorhaben.

1. **RDG (Rechtsdienstleistungsgesetz).** Allgemeine Information ist zulässig, **konkrete
   Rechtsberatung im Einzelfall nicht**. Der Schnellcheck muss allgemeine Orientierung
   geben, keine verbindliche Einzelfallbewertung. Formulierung durchgängig:
   *„Das ist eine Orientierung, keine Rechtsberatung. Im Zweifel Datenschutzbeauftragten
   oder Fachanwalt einbeziehen."*
2. **Aussagen über Unternehmen** müssen belegt, datiert und korrigierbar sein. Falsche
   Behauptungen über OpenAI, Microsoft & Co. sind wettbewerbs- und äußerungsrechtlich
   riskant (UWG). Deshalb `sourceUrl` + `checkedAt` als Pflichtfelder und ein
   „Fehler melden"-Weg auf jeder Aussage.
3. **Keine Suggestion von Rechtssicherheit.** Die Ampel bewertet *Einsatzwege*, sie erteilt
   keine Freigabe.
4. **Eigene DSGVO-Hausaufgaben:** Impressum und Datenschutzerklärung sind aktuell
   Platzhalter (`legal.impressumBody`: „placeholder"). Das muss **vor** jeder
   Bewerbung der Seite echt werden — eine Datenschutz-Seite mit Platzhalter-Datenschutz
   ist unhaltbar.
5. **Fachliche Gegenprüfung.** Vor Live-Gang der Compliance-Inhalte einmal von einem
   Fachanwalt für IT-Recht gegenlesen lassen. Kostet, ist aber die Grundlage der
   Glaubwürdigkeit.

---

## 13. Monetarisierung

Nach Erfolgswahrscheinlichkeit geordnet:

| Weg | Realismus | Anmerkung |
|---|---|---|
| **Beratung / Einrichtung für KMU** | ★★★★★ | Seite ist Referenz und Lead-Quelle. Ein Projekt bringt mehr als Affiliate im Jahr |
| **Branchen-Leitfäden als PDF** (49–199 €) | ★★★★ | Direkt verkaufbar, skaliert ohne Zeitaufwand |
| **Lead-Vermittlung an EU-Anbieter** | ★★★★ | IONOS, Aleph Alpha, STACKIT zahlen für qualifizierte KMU-Leads — deutlich lohnender als API-Affiliate |
| **Sponsored Placements** (Infra fertig) | ★★★ | Erst ab Traffic |
| **Newsletter „KI & Recht für KMU"** | ★★★ | Baut Publikum, später Werbeplätze |
| API-Affiliate (OpenAI etc.) | ★ | Entwickler gehen direkt, kaum Attribution |
| Bezahlte API/CSV | ★ | Direkte Konkurrenz zu AA mit weniger Daten — würde ich lassen |

---

## 14. Umsetzungsreihenfolge

**Prinzip: erst an einer Branche beweisen, dann skalieren.**

### Etappe 1 — Fundament *(bringt sofort sichtbaren Nutzen)*
1. Datenmodell `ProviderCompliance` + Datenklassen S0–S3
2. Compliance-Daten für die **10 wichtigsten Anbieter** recherchieren
3. Ampel-Logik (deterministisch, mit Begründungstexten)
4. Tabelle: DSGVO-Spalte + Filter „Nur EU-Hosting" / „AVV" / „kein Training"

### Etappe 2 — Beweis an einer Branche
5. `/branchen/steuerkanzlei` vollständig und exzellent
6. DSGVO-Schnellcheck (5 Fragen → Ampel + Empfehlung)
7. Modell-Detailseiten um Ampel + „Was reingeben, was nicht" + Setup erweitern

### Etappe 3 — Skalieren
8. Wissensbasis (AVV, Art. 9, § 203, AI Act, Betriebsrat)
9. Branchen 2–4 (Kanzlei, Arztpraxis, Handwerk)
10. Kostenrechner
11. Anwendungsfallseiten

### Etappe 4 — Umsatz
12. Downloads gegen E-Mail + Newsletter
13. Impressum/Datenschutz echt machen, juristische Gegenprüfung
14. EU-Anbieter auf Lead-Kooperation ansprechen

---

## 15. Risiken (ehrlich)

| Risiko | Bewertung | Umgang |
|---|---|---|
| **Falsche Compliance-Aussage** | Hoch | Belegpflicht, Datum, Gegenprüfung, Korrekturweg |
| **Rechtsberatungs-Grenze (RDG)** | Mittel-hoch | Durchgängige Einordnung als Orientierung; kein Einzelfallurteil |
| **Pflegeaufwand** | Mittel | Quartalsrhythmus; veraltete Daten sichtbar machen statt verstecken |
| **SEO braucht Zeit** | Sicher | 6–12 Monate. Beratung überbrückt die Anlaufzeit |
| **Zielgruppe schwer erreichbar** | Mittel | Steuerberater-/Handwerkskammern, Fachgruppen, Verbände statt breiter Werbung |

**Was ich nicht versprechen kann:** dass daraus Umsatz wird. Was ich sagen kann: Das ist
eine Nische, in der es auf Deutsch kaum Wettbewerb gibt, in der die Zielgruppe zahlt, und
in der der Vorsprung aus Arbeit und Urteil entsteht statt aus Daten, die andere besser
haben.

---

## 16. Was aus dem Bestand weiterverwendet wird

Nichts davon war umsonst:

- **345 Modelle, 340 mit Preisen** → Kostenrechner
- **Anbieter/Endpunkte je Modell** → Träger der Compliance-Attribute
- **`privacyEu`-Score** → wird von Nebenwert zur Hauptachse
- **`local`/Open-Weight-Erkennung, 184 Modelle** → Self-Hosting-Empfehlungen
- **Deterministische Score-Engine** → Vorlage für die Ampel-Logik
- **Zweisprachigkeit, Admin, Sponsored-Slots** → unverändert nutzbar
- **Benchmarks (92 Modelle) / HF-Verbreitung (151)** → Belege, nicht mehr Hauptsache
