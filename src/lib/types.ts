// Shared view types used by the UI and the (DB-less) snapshot data layer.
// These mirror the Prisma schema but are flattened for read-side rendering.

export type Category =
  | 'chat'
  | 'reasoning'
  | 'coding'
  | 'multimodal'
  | 'local'
  | 'embedding'
  | 'reranker';

export type ModelStatus =
  | 'active'
  | 'preview'
  | 'beta'
  | 'experimental'
  | 'deprecated'
  | 'possibly_unavailable'
  | 'inactive';

export type Openness = 'closed' | 'open_weight' | 'open_source';

export interface ModelFeatures {
  tools: boolean;
  functionCalling: boolean;
  jsonMode: boolean;
  structuredOutput: boolean;
  vision: boolean;
  audio: boolean;
  reasoning: boolean;
  coding: boolean;
  streaming: boolean;
  localDeployment: boolean;
}

export interface ProviderEndpointView {
  providerName: string;
  providerSlug: string;
  apiModelId: string | null;
  inputPricePer1m: number | null;
  outputPricePer1m: number | null;
  cachedInputPricePer1m: number | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  availabilityStatus: 'available' | 'limited' | 'possibly_unavailable' | 'offline';
  uptime30m: number | null;
  region: string | null;
  euHosting: boolean;
  link: string | null;
  lastCheckedAt: string | null;
}

// The full 0-100 deterministic score vector. See lib/scoring/engine.ts.
export interface Scores {
  overall: number;
  coding: number;
  frontendCoding: number;
  backendCoding: number;
  math: number;
  reasoning: number;
  writing: number;
  german: number;
  translation: number;
  business: number;
  cheapApi: number;
  speed: number;
  privacyEu: number;
  local: number;
  openWeight: number;
  rag: number;
  longContext: number;
  agentTool: number;
  vision: number;
  dataAnalysis: number;
  customerSupport: number;
  legalDrafting: number;
  salesEmail: number;
  pricePerformance: number;
}

export interface SourceRef {
  name: string;
  url: string | null;
  reliability: 'official' | 'marketplace' | 'benchmark' | 'community' | 'estimated';
}

export type BenchmarkGroupSlug =
  | 'intelligence'
  | 'reasoning'
  | 'coding'
  | 'math'
  | 'agentic'
  | 'multimodal'
  | 'human_preference'
  | 'speed'
  | 'factuality'
  | 'long_context'
  | 'business_agents'
  | 'price_performance';

// A measured benchmark result attached to a model. `normalized` is 0-100;
// `rawValue` keeps the original score/Elo/percentage for the detail view.
export interface BenchmarkResultView {
  benchmarkSlug: string;
  rawValue: number | null;
  normalized: number | null;
  isEstimated: boolean;
  isDisputed: boolean;
  notes: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
}

export interface ModelView {
  id: string;
  slug: string;
  name: string;
  family: string | null;
  lab: string;
  labSlug: string;
  category: Category;
  description: string;
  descriptionDe: string | null;
  status: ModelStatus;
  releaseDate: string | null;
  lastCheckedAt: string | null;

  openness: Openness;
  isOpenSource: boolean;
  isOpenWeight: boolean;
  license: string | null;
  parameterCount: string | null;

  contextWindow: number | null;
  maxOutputTokens: number | null;
  inputModalities: string[];
  outputModalities: string[];

  features: ModelFeatures;

  isPreview: boolean;
  isBeta: boolean;
  isExperimental: boolean;
  isNew: boolean;
  isAutoDetected: boolean;
  isVerified: boolean;

  cheapestInputPer1m: number | null;
  cheapestOutputPer1m: number | null;
  providerCount: number;
  providers: ProviderEndpointView[];

  scores: Scores;
  scoresEstimated: boolean;
  sources: SourceRef[];

  // Measured benchmarks (optional; populated by the benchmark importers once a
  // source/key is configured). Absent in the marketplace-only snapshot.
  benchmarks?: BenchmarkResultView[];

  // Flattened measured metrics (from Artificial Analysis) for fast table
  // filtering/sorting/columns. Null when not measured for this model.
  aaIntelligence?: number | null;
  aaCoding?: number | null;
  outputSpeedTps?: number | null; // median output tokens/second
  ttftMs?: number | null; // median time to first token, milliseconds

  // Applied from admin overrides when a database is connected.
  affiliateUrl?: string | null;
  isFeatured?: boolean;
}

export interface FeaturedSlotView {
  id: string;
  placement: string;
  label: string;
  modelSlug: string | null;
  targetUrl: string;
}

export interface SnapshotMeta {
  generatedAt: string;
  source: string;
  modelCount: number;
  scoreVersion: string;
}

export interface Snapshot {
  meta: SnapshotMeta;
  models: ModelView[];
}
