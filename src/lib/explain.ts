// Plain-language, deterministic explanations of botbrix scores. No LLM: these
// are templated from the exact structural signals the scoring engine uses, so
// "why is this score what it is?" is answerable for a non-technical user.

import type { ModelView, Scores } from './types';
import { formatContext, formatPrice } from './format';

type Lang = 'en' | 'de';

function priceBand(outputPer1m: number | null, lang: Lang): string {
  if (outputPer1m == null) return lang === 'de' ? 'unbekannt bepreist' : 'unpriced';
  if (outputPer1m === 0) return lang === 'de' ? 'kostenlos' : 'free';
  if (outputPer1m < 0.5) return lang === 'de' ? 'sehr günstig' : 'very cheap';
  if (outputPer1m < 2) return lang === 'de' ? 'günstig' : 'cheap';
  if (outputPer1m < 8) return lang === 'de' ? 'im mittleren Preisbereich' : 'mid-priced';
  if (outputPer1m < 20) return lang === 'de' ? 'im gehobenen Preisbereich' : 'upper-mid priced';
  return lang === 'de' ? 'im Premium-Bereich' : 'premium-priced';
}

function contextBand(ctx: number | null, lang: Lang): string {
  if (ctx == null) return lang === 'de' ? 'unbekannter Kontext' : 'unknown context';
  if (ctx >= 500_000) return lang === 'de' ? 'ein sehr langes Kontextfenster' : 'a very long context window';
  if (ctx >= 128_000) return lang === 'de' ? 'ein langes Kontextfenster' : 'a long context window';
  if (ctx >= 32_000) return lang === 'de' ? 'ein solides Kontextfenster' : 'a solid context window';
  return lang === 'de' ? 'ein kurzes Kontextfenster' : 'a short context window';
}

function band(score: number, lang: Lang): string {
  if (score >= 80) return lang === 'de' ? 'sehr stark' : 'very strong';
  if (score >= 65) return lang === 'de' ? 'stark' : 'strong';
  if (score >= 50) return lang === 'de' ? 'solide' : 'solid';
  if (score >= 35) return lang === 'de' ? 'durchschnittlich' : 'average';
  return lang === 'de' ? 'schwach' : 'weak';
}

export function explainOverall(m: ModelView, lang: Lang): string {
  const s = m.scores;
  const price = priceBand(m.cheapestOutputPer1m, lang);
  const ctx = contextBand(m.contextWindow, lang);
  if (lang === 'de') {
    return `${m.name} von ${m.lab} erreicht einen Gesamt-Score von ${s.overall.toFixed(0)}/100. Es ist ${price}, bietet ${ctx} (${formatContext(
      m.contextWindow
    )} Tokens)${m.features.reasoning ? ', hat explizites Reasoning' : ''}${
      m.features.vision ? ' und versteht Bilder' : ''
    }. Der Score gewichtet Qualität, Preis-Leistung, Speed, Funktionsumfang, Verfügbarkeit und Quellen-Vertrauen.`;
  }
  return `${m.name} by ${m.lab} scores ${s.overall.toFixed(0)}/100 overall. It is ${price}, offers ${ctx} (${formatContext(
    m.contextWindow
  )} tokens)${m.features.reasoning ? ', has explicit reasoning' : ''}${
    m.features.vision ? ' and understands images' : ''
  }. The score weighs quality, price-performance, speed, feature coverage, availability and source trust.`;
}

export function explainScore(m: ModelView, key: keyof Scores, lang: Lang): string {
  const v = m.scores[key];
  const b = band(v, lang);
  const f = m.features;
  const price = priceBand(m.cheapestOutputPer1m, lang);
  const de = lang === 'de';

  switch (key) {
    case 'coding':
    case 'backendCoding':
    case 'frontendCoding':
      return de
        ? `${b} - ${f.coding ? 'ein auf Code ausgerichtetes Modell' : 'kein spezialisiertes Code-Modell'}${
            f.tools ? ', mit Tool-Calling für Agenten' : ''
          }; ${contextBand(m.contextWindow, lang)} hilft bei großen Dateien.`
        : `${b} - ${f.coding ? 'a coding-focused model' : 'not a specialised coding model'}${
            f.tools ? ', with tool calling for agents' : ''
          }; ${contextBand(m.contextWindow, lang)} helps with large files.`;
    case 'reasoning':
    case 'math':
      return de
        ? `${b} - ${f.reasoning ? 'unterstützt explizites schrittweises Reasoning' : 'ohne dedizierten Reasoning-Modus'}.`
        : `${b} - ${f.reasoning ? 'supports explicit step-by-step reasoning' : 'no dedicated reasoning mode'}.`;
    case 'cheapApi':
    case 'pricePerformance':
      return de
        ? `${b} - ${price} bei ${formatPrice(m.cheapestOutputPer1m)}/1M Output-Tokens${
            m.providerCount > 1 ? `, über ${m.providerCount} Anbieter verfügbar` : ''
          }.`
        : `${b} - ${price} at ${formatPrice(m.cheapestOutputPer1m)}/1M output tokens${
            m.providerCount > 1 ? `, available across ${m.providerCount} providers` : ''
          }.`;
    case 'local':
    case 'openWeight':
      return de
        ? `${b} - ${m.isOpenWeight ? 'Open-Weight, also grundsätzlich lokal ausführbar' : 'geschlossen, nur über Anbieter-APIs'}${
            m.parameterCount ? ` (${m.parameterCount})` : ''
          }.`
        : `${b} - ${m.isOpenWeight ? 'open-weight, so it can run locally' : 'closed, provider APIs only'}${
            m.parameterCount ? ` (${m.parameterCount})` : ''
          }.`;
    case 'privacyEu':
      return de
        ? `${b} - ${m.isOpenWeight ? 'lokal/selbst gehostet betreibbar, was Datenschutz erleichtert' : 'nur über Anbieter, EU-Hosting je nach Provider'}.`
        : `${b} - ${m.isOpenWeight ? 'can be self-hosted, which helps privacy' : 'provider-only; EU hosting depends on the provider'}.`;
    case 'vision':
      return de
        ? `${b} - ${f.vision ? 'kann Bilder/Dokumente verarbeiten' : 'kein Bildverständnis'}.`
        : `${b} - ${f.vision ? 'can process images/documents' : 'no image understanding'}.`;
    case 'rag':
    case 'longContext':
      return de
        ? `${b} - ${contextBand(m.contextWindow, lang)} (${formatContext(m.contextWindow)})${
            f.tools ? ' und Tool-Calling für Abrufe' : ''
          }.`
        : `${b} - ${contextBand(m.contextWindow, lang)} (${formatContext(m.contextWindow)})${
            f.tools ? ' plus tool calling for retrieval' : ''
          }.`;
    case 'agentTool':
      return de
        ? `${b} - ${f.tools ? 'unterstützt Tool-/Function-Calling' : 'ohne Tool-Calling'}${
            f.reasoning ? ' und Reasoning für mehrstufige Aufgaben' : ''
          }.`
        : `${b} - ${f.tools ? 'supports tool/function calling' : 'no tool calling'}${
            f.reasoning ? ' plus reasoning for multi-step tasks' : ''
          }.`;
    case 'german':
    case 'translation':
      return de
        ? `${b} - geschätzt aus der mehrsprachigen Stärke von ${m.lab} und der Gesamtqualität (bis Benchmark-Daten vorliegen).`
        : `${b} - estimated from ${m.lab}'s multilingual strength and overall quality (until benchmark data lands).`;
    case 'speed':
      return de
        ? `${b} - Näherung aus Preis und Modellgröße; echte Durchsatz-/Latenzdaten folgen mit den Provider-Messungen.`
        : `${b} - approximated from price and model size; real throughput/latency arrives with provider measurements.`;
    default:
      return de
        ? `${b} - abgeleitet aus Qualitätssignalen, Funktionsumfang und Preis dieses Modells.`
        : `${b} - derived from this model's quality signals, feature set and price.`;
  }
}

// Top use-case scores worth explaining on the detail page (excludes overall).
export function ratingHighlights(
  m: ModelView,
  lang: Lang
): { key: keyof Scores; value: number; text: string }[] {
  const candidates: (keyof Scores)[] = [
    'coding',
    'reasoning',
    'cheapApi',
    'agentTool',
    'rag',
    'longContext',
    'vision',
    'local',
    'german',
    'speed',
    'pricePerformance'
  ];
  return candidates
    .map((key) => ({ key, value: m.scores[key], text: explainScore(m, key, lang) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function worthIt(m: ModelView, lang: Lang): string {
  const pp = m.scores.pricePerformance;
  const out = m.cheapestOutputPer1m;
  const de = lang === 'de';
  if (out === 0) {
    return de
      ? 'Dieses Modell ist kostenlos verfügbar - für Experimente und die meisten Alltagsaufgaben ein risikofreier Einstieg.'
      : 'This model is available for free - a risk-free start for experiments and most everyday tasks.';
  }
  // Genuinely cheap, or strong value-for-money → clearly recommend.
  if ((out != null && out < 8) || pp >= 60) {
    return de
      ? 'Gutes Preis-Leistungs-Verhältnis für die meisten Nutzer - ein deutlich teureres Frontier-Modell brauchst du nur für Spezialfälle.'
      : 'Good price/performance for most users - you only need a much pricier frontier model for special cases.';
  }
  // Only the genuinely expensive tier gets the "premium" caveat.
  if (out != null && out >= 20) {
    return de
      ? 'Dieses Modell liegt im Premium-Bereich. Es lohnt sich, wenn du maximale Qualität brauchst; für vieles reichen günstigere Modelle mit ähnlichem Score.'
      : 'This model is in the premium tier. Worth it when you need maximum quality; for many tasks cheaper models reach a similar score.';
  }
  // Upper-mid: neutral, not alarmist.
  return de
    ? 'Preislich im gehobenen Mittelfeld - eine solide Wahl, wenn dir Qualität wichtig ist; wer vor allem aufs Budget schaut, findet günstigere Alternativen.'
    : 'Priced in the upper-mid range - a solid pick when you value quality; budget-focused users can find cheaper alternatives.';
}
