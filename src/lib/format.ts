// Presentation helpers (framework-agnostic).

export function formatPrice(perMillion: number | null | undefined): string {
  if (perMillion == null) return '—';
  if (perMillion === 0) return 'Free';
  if (perMillion < 1) return `$${perMillion.toFixed(3)}`;
  if (perMillion < 100) return `$${perMillion.toFixed(2)}`;
  return `$${perMillion.toFixed(0)}`;
}

export function formatContext(tokens: number | null | undefined): string {
  if (tokens == null) return '—';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return String(tokens);
}

export function formatDate(iso: string | null | undefined, locale = 'en'): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return score.toFixed(0);
}

export function formatSpeed(tps: number | null | undefined): string {
  if (tps == null) return '—';
  return `${Math.round(tps)} t/s`;
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
  return `${Math.round(ms)}ms`;
}

/** Compact counts for download/like figures: 16764566 → "16.8M". */
export function formatCount(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-fg';
  if (score >= 40) return 'text-warning';
  return 'text-danger';
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-success/15 text-success';
  if (score >= 60) return 'bg-brand/15 text-brand';
  if (score >= 40) return 'bg-warning/15 text-warning';
  return 'bg-danger/15 text-danger';
}

export const SCORE_LABELS: Record<string, { en: string; de: string }> = {
  overall: { en: 'Overall', de: 'Gesamt' },
  coding: { en: 'Coding', de: 'Coding' },
  frontendCoding: { en: 'Frontend coding', de: 'Frontend-Coding' },
  backendCoding: { en: 'Backend coding', de: 'Backend-Coding' },
  math: { en: 'Math', de: 'Mathe' },
  reasoning: { en: 'Reasoning', de: 'Reasoning' },
  writing: { en: 'Writing', de: 'Schreiben' },
  german: { en: 'German', de: 'Deutsch' },
  translation: { en: 'Translation', de: 'Übersetzung' },
  business: { en: 'Business', de: 'Business' },
  cheapApi: { en: 'Cheap API', de: 'Günstige API' },
  speed: { en: 'Speed', de: 'Speed' },
  privacyEu: { en: 'Privacy / EU', de: 'Datenschutz / EU' },
  local: { en: 'Local', de: 'Lokal' },
  openWeight: { en: 'Open-weight', de: 'Open-Weight' },
  rag: { en: 'RAG', de: 'RAG' },
  longContext: { en: 'Long context', de: 'Langer Kontext' },
  agentTool: { en: 'Agent / tools', de: 'Agent / Tools' },
  vision: { en: 'Vision', de: 'Vision' },
  dataAnalysis: { en: 'Data analysis', de: 'Datenanalyse' },
  customerSupport: { en: 'Customer support', de: 'Kundensupport' },
  legalDrafting: { en: 'Legal drafting', de: 'Rechtstexte' },
  salesEmail: { en: 'Sales / email', de: 'Vertrieb / E-Mail' },
  pricePerformance: { en: 'Price/performance', de: 'Preis/Leistung' }
};

export function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .trim();
}

export const CATEGORY_LABELS: Record<string, { en: string; de: string }> = {
  chat: { en: 'Chat / Text', de: 'Chat / Text' },
  reasoning: { en: 'Reasoning', de: 'Reasoning' },
  coding: { en: 'Coding', de: 'Coding' },
  multimodal: { en: 'Multimodal', de: 'Multimodal' },
  local: { en: 'Local / Open-Weight', de: 'Lokal / Open-Weight' },
  embedding: { en: 'Embeddings', de: 'Embeddings' },
  reranker: { en: 'Reranker', de: 'Reranker' }
};
