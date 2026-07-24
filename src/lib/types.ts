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
