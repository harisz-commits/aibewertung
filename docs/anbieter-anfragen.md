# Anbieter-Anfragen: § 203 StGB und Datenschutz

**Zweck:** Die Angaben, die sich **nicht** aus öffentlicher Dokumentation belegen lassen, direkt beim
Anbieter erfragen. Genau diese Antworten sind der Burggraben - sie stehen nirgends im Netz und lassen sich
nicht scrapen.

**Wer fragt:** Du als Betreiber der Seite. Ich kann öffentliche Quellen auswerten, aber keine Anfragen in
deinem Namen versenden.

**Was mit den Antworten passiert:** Jede Antwort wird als Beleg in `src/data/provider-compliance.json`
eingetragen - mit `sourceUrl` (oder Aktenzeichen/Datum der Anbieterantwort) und `checkedAt`. Erst dann
ändert sich eine Ampel.

---

## Warum § 203 die entscheidende Frage ist

Aktuell steht **jeder** Cloud-Weg bei S3 (Mandanten-, Patienten-, Steuergeheimnis) auf
„nur ohne Personenbezug" - nicht weil die Anbieter ungeeignet wären, sondern weil sich **für keinen**
belegen ließ, ob er eine Verschwiegenheitsvereinbarung nach § 203 Abs. 4 StGB anbietet.

Sobald ein Anbieter das schriftlich bestätigt, springt seine Bewertung für die gesamte Zielgruppe
(Kanzleien, Steuerberatung, Praxen) von „nur anonymisiert" auf „möglich mit Auflagen". Das ist der
wertvollste einzelne Datenpunkt im ganzen Projekt.

---

## Vorlage A - an KI-/Cloud-Anbieter (deutsch)

> **Betreff:** Verschwiegenheitsvereinbarung nach § 203 Abs. 4 StGB für Berufsgeheimnisträger
>
> Sehr geehrte Damen und Herren,
>
> wir betreiben ein deutschsprachiges Informationsportal, das Unternehmen - insbesondere
> Steuerkanzleien, Rechtsanwaltskanzleien und Arztpraxen - bei der Auswahl von KI-Diensten unterstützt.
> Wir dokumentieren dabei die datenschutzrechtlichen Rahmenbedingungen der Anbieter und verlinken jeweils
> auf die Originalquelle.
>
> Für diese Zielgruppe ist eine Frage entscheidend, die sich aus Ihrer öffentlichen Dokumentation nicht
> beantworten lässt. Berufsgeheimnisträger nach § 203 StGB dürfen externe Dienstleister nur einbeziehen,
> wenn diese nach § 203 Abs. 3 Satz 2 als „sonstige mitwirkende Personen" eingebunden und nach Absatz 4
> in Textform zur Verschwiegenheit verpflichtet werden - einschließlich Belehrung über die Strafbarkeit
> eines Verstoßes.
>
> Wir bitten um Auskunft zu folgenden Punkten:
>
> 1. Bieten Sie Kunden, die Berufsgeheimnisträger sind, eine **gesonderte Verschwiegenheitsvereinbarung
>    nach § 203 Abs. 4 StGB** an - zusätzlich zum Auftragsverarbeitungsvertrag nach Art. 28 DSGVO?
>    Falls ja: Ist ein Muster verfügbar oder erfolgt das im Rahmen einer Einzelvereinbarung?
> 2. Werden Ihre **Beschäftigten und Unterauftragnehmer** ebenfalls entsprechend verpflichtet, und können
>    die Erklärungen dem Berufsgeheimnisträger auf Verlangen vorgelegt werden?
> 3. In welchen **Regionen** werden Anfragen unserer Kunden verarbeitet und gespeichert? Ist eine
>    ausschließliche Verarbeitung innerhalb der EU/des EWR vertraglich zusicherbar?
> 4. Wie lange werden Ein- und Ausgaben **gespeichert**, und ist eine vollständige Speicherfreiheit
>    (Zero Data Retention) verfügbar? Falls ja: unter welchen Voraussetzungen?
> 5. Werden Kundeneingaben zum **Training** von Modellen verwendet? Falls nein: Ist das vertraglich
>    zugesichert oder nur Richtlinie?
> 6. Welche **Zertifizierungen** liegen für den betreffenden Dienst vor (ISO 27001, SOC 2 Typ II,
>    BSI C5)? Sind die Berichte auf Anfrage einsehbar?
>
> Ihre Antwort veröffentlichen wir - sofern Sie nicht widersprechen - als belegte Angabe mit Datum und
> Quellenangabe. Selbstverständlich korrigieren wir jede Angabe umgehend, wenn sich etwas ändert.
>
> Für eine Rückmeldung bis zum [DATUM] wären wir dankbar.
>
> Mit freundlichen Grüßen
> [NAME], [SEITE]

---

## Vorlage B - an internationale Anbieter (englisch)

> **Subject:** Confidentiality undertaking under German § 203 StGB for professional secrecy holders
>
> Dear Sir or Madam,
>
> We run a German-language information portal that helps businesses - in particular tax advisory firms,
> law firms and medical practices - choose AI services. We document each provider's data protection
> position and always link to the original source.
>
> One question is decisive for this audience and cannot be answered from your public documentation. Under
> German law (§ 203 of the Criminal Code), members of professions bound by secrecy may only involve
> external service providers if those providers are included as "contributing persons" under § 203(3)
> sentence 2 and are bound to confidentiality in text form under § 203(4), including an explicit warning
> about the criminal liability of a breach. This is a **separate** obligation from a GDPR Art. 28 data
> processing agreement - the DPA does not satisfy it.
>
> We would appreciate your answers to the following:
>
> 1. Do you offer customers who are subject to German professional secrecy a **separate confidentiality
>    undertaking under § 203(4) StGB**, in addition to your DPA? If so, is a template available, or is it
>    handled as an individual agreement?
> 2. Are your **employees and sub-processors** bound accordingly, and can those declarations be produced
>    to the customer on request?
> 3. In which **regions** are our customers' requests processed and stored? Can exclusive processing
>    within the EU/EEA be contractually assured?
> 4. What is the **retention period** for inputs and outputs, and is Zero Data Retention available? Under
>    what conditions?
> 5. Is customer input used for **model training**? If not, is that contractually assured or policy only?
> 6. Which **certifications** apply to the service (ISO 27001, SOC 2 Type II, BSI C5)? Are reports
>    available on request?
>
> Unless you object, we will publish your answer as a sourced, dated statement, and we correct any entry
> promptly when circumstances change.
>
> We would be grateful for a reply by [DATE].
>
> Kind regards
> [NAME], [SITE]

---

## Verteiler - nach Priorität

| Prio | Anbieter | Warum | Kontakt |
|---|---|---|---|
| 1 | **Microsoft** (Azure OpenAI) | Aktuell der beste dokumentierte EU-Weg; § 203 würde ihn für Kanzleien freigeben | Account-Team / Datenschutz-Kontakt |
| 2 | **IONOS** | Deutscher Anbieter, adressiert regulierte Branchen - höchste Trefferwahrscheinlichkeit | Vertrieb Cloud |
| 3 | **STACKIT** (Schwarz Gruppe) | BSI C5 wird beworben, aber keine Primärquelle gefunden - direkt klären | Vertrieb |
| 4 | **Aleph Alpha** | Deutscher Anbieter, Ausrichtung auf souveräne KI | Vertrieb |
| 5 | **Telekom / T-Systems** | Adressiert öffentlichen Sektor und regulierte Branchen | Geschäftskunden |
| 6 | **Mistral AI** | EU-Anbieter (Frankreich) | Sales / DPO |
| 7 | **OpenAI** | Größte Modellabdeckung; EU-Datenresidenz-Umfang ebenfalls offen | Enterprise Sales |
| 8 | **Anthropic** | Verarbeitungsort für EU-Kunden offen | Sales |

---

## Offene Punkte, die aktuell in den Daten stehen

Diese Liste ist der Arbeitsvorrat - jeder erledigte Punkt verbessert eine Ampel:

**Anthropic** - Verarbeitungsort für EU-Kunden · § 203 · Zertifizierungen
**OpenAI** - Umfang der EU-Datenresidenz · § 203 · Unterauftragsverarbeiter
**Azure OpenAI EU** - Speicherdauer Missbrauchs-Monitoring und Abschaltbarkeit · § 203 · BSI C5/ISO für den Dienst
**IONOS** - § 203 · konkrete Modellzuordnung zu unserem Katalog · BSI C5

---

## Nach Eingang einer Antwort

1. Eintrag in `src/data/provider-compliance.json` anpassen
2. `sourceUrl` auf die Antwort verweisen (E-Mail-Datum + Aktenzeichen genügt, wenn keine URL existiert)
3. `checkedAt` auf das Antwortdatum setzen
4. Erledigten Punkt aus `openQuestions` entfernen
5. Antwort im Original ablegen - bei Compliance-Aussagen über Unternehmen muss der Beleg vorzeigbar sein
