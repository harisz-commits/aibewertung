// OpenRouter importer - maps the public /api/v1/models and /endpoints payloads
// to botbrix's normalized model shape. Pure (no DB/Prisma imports) so it can run
// both in the Next runtime and as a standalone snapshot/import script.
//
// Priority per methodology: OpenRouter is a "marketplace" source (reliability
// level: marketplace). Official provider APIs override it in the full pipeline.

import type {
  Category,
  ModelStatus,
  ModelView,
  Openness,
  ProviderEndpointView,
  SourceRef
} from '../types.ts';
import { resolveLab } from '../labs.ts';

export type ImportedModel = Omit<ModelView, 'scores' | 'scoresEstimated'>;

// --- Raw OpenRouter shapes (loosely typed; upstream may add fields) ---

export interface RawOpenRouterModel {
  id: string;
  canonical_slug?: string;
  hugging_face_id?: string | null;
  name: string;
  created?: number;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
    tokenizer?: string;
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number | null;
    is_moderated?: boolean;
  };
  supported_parameters?: string[];
  reasoning?: { mandatory?: boolean; default_enabled?: boolean } | null;
}

export interface RawOpenRouterEndpoint {
  name?: string;
  provider_name?: string;
  tag?: string;
  context_length?: number;
  max_completion_tokens?: number | null;
  uptime_last_30m?: number | null;
  status?: number;
  pricing?: { prompt?: string; completion?: string; input_cache_read?: string };
}

const OPEN_WEIGHT_HINT = /(llama|mistral|mixtral|qwen|deepseek|gemma|phi|yi-|command-r|glm-|kimi|hermes|falcon|dbrx|olmo)/i;
const CODING_HINT = /(cod(e|er|ing)|codestral|starcoder|devstral|sql)/i;
const EMBED_HINT = /embed/i;
const RERANK_HINT = /re[-\s]?rank/i;
// Image/audio GENERATORS. Matched against id+name and combined with a non-text
// output modality, so a text model that merely *reads* images (vision) is not
// caught - only models whose product is an image or a sound.
const MEDIA_HINT = /(image|audio|speech|tts|voice|music|lyria|imagen|veo|sora|dall-?e|flux|diffusion|midjourney)/i;

function perMillion(perToken?: string): number | null {
  if (perToken == null) return null;
  const n = Number(perToken);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1_000_000 * 10000) / 10000;
}

function has(params: string[] | undefined, name: string): boolean {
  return Array.isArray(params) && params.includes(name);
}

function extractParameterCount(text: string): string | null {
  const m = text.match(/\b(\d+x\d+b|\d+(?:\.\d+)?b)\b/i);
  return m ? m[1].toUpperCase() : null;
}

function deriveStatus(text: string): { status: ModelStatus; isPreview: boolean; isBeta: boolean; isExperimental: boolean } {
  const t = text.toLowerCase();
  if (/\bpreview\b/.test(t)) return { status: 'preview', isPreview: true, isBeta: false, isExperimental: false };
  if (/\bbeta\b/.test(t)) return { status: 'beta', isPreview: false, isBeta: true, isExperimental: false };
  if (/\b(experimental|exp)\b/.test(t)) return { status: 'experimental', isPreview: false, isBeta: false, isExperimental: true };
  return { status: 'active', isPreview: false, isBeta: false, isExperimental: false };
}

function deriveCategory(opts: {
  id: string;
  name: string;
  vision: boolean;
  audio: boolean;
  reasoning: boolean;
  outputModalities: string[];
}): Category {
  const hay = `${opts.id} ${opts.name}`;
  if (EMBED_HINT.test(hay)) return 'embedding';
  if (RERANK_HINT.test(hay)) return 'reranker';
  // Both signals required: OpenRouter's auto-router also lists an image output
  // but is a general text router, so the name must confirm it too.
  if (opts.outputModalities.some((o) => o !== 'text') && MEDIA_HINT.test(hay)) return 'media';
  if (CODING_HINT.test(hay)) return 'coding';
  if (opts.reasoning) return 'reasoning';
  if (opts.vision || opts.audio) return 'multimodal';
  return 'chat';
}

/** URL-safe slug from an OpenRouter model id. Collapses every character that
 * is not [a-z0-9] into a single hyphen, so ids with '/', ':' (e.g. ':free'),
 * '.' (version numbers) or '~' (…-latest aliases) never end up in a URL path -
 * those characters cause routing/404 issues on Vercel. Distinct ids stay
 * distinct (…-a12b vs …-a12b-free). */
export function toSlug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function mapModel(raw: RawOpenRouterModel, now = new Date()): ImportedModel {
  const [prefix, ...rest] = raw.id.split('/');
  const lab = resolveLab(prefix);
  const slug = toSlug(raw.id);

  const inputModalities = raw.architecture?.input_modalities ?? ['text'];
  const outputModalities = raw.architecture?.output_modalities ?? ['text'];
  const vision = inputModalities.includes('image');
  const audio = inputModalities.includes('audio') || outputModalities.includes('audio');
  const reasoning = Boolean(raw.reasoning) || has(raw.supported_parameters, 'reasoning');
  const tools = has(raw.supported_parameters, 'tools') || has(raw.supported_parameters, 'tool_choice');
  const jsonMode = has(raw.supported_parameters, 'response_format');
  const structured = has(raw.supported_parameters, 'structured_outputs');

  const hay = `${raw.id} ${raw.name} ${raw.description ?? ''}`;
  const coding = CODING_HINT.test(hay);
  const openWeight = Boolean(lab.openWeight) || Boolean(raw.hugging_face_id) || OPEN_WEIGHT_HINT.test(raw.id);
  const openness: Openness = openWeight ? 'open_weight' : 'closed';

  const category = deriveCategory({ id: raw.id, name: raw.name, vision, audio, reasoning, outputModalities });
  const { status, isPreview, isBeta, isExperimental } = deriveStatus(hay);

  const inputPer1m = perMillion(raw.pricing?.prompt);
  const outputPer1m = perMillion(raw.pricing?.completion);
  const cachedPer1m = perMillion(raw.pricing?.input_cache_read);

  const contextWindow = raw.top_provider?.context_length ?? raw.context_length ?? null;
  const maxOut = raw.top_provider?.max_completion_tokens ?? null;

  const createdAt = raw.created ? new Date(raw.created * 1000) : null;
  const isNew = createdAt ? now.getTime() - createdAt.getTime() < 30 * 24 * 3600 * 1000 : false;

  // Fallback single-provider row from the aggregate listing; the snapshot
  // generator replaces this with real per-provider endpoints where fetched.
  const fallbackProvider: ProviderEndpointView = {
    providerName: lab.name,
    providerSlug: prefix.toLowerCase(),
    apiModelId: raw.id,
    inputPricePer1m: inputPer1m,
    outputPricePer1m: outputPer1m,
    cachedInputPricePer1m: cachedPer1m,
    contextWindow,
    maxOutputTokens: maxOut,
    availabilityStatus: 'available',
    uptime30m: null,
    region: null,
    euHosting: false,
    link: `https://openrouter.ai/${raw.id}`,
    lastCheckedAt: now.toISOString()
  };

  const sources: SourceRef[] = [
    { name: 'OpenRouter', url: `https://openrouter.ai/${raw.id}`, reliability: 'marketplace' }
  ];
  if (raw.hugging_face_id) {
    sources.push({
      name: 'Hugging Face',
      url: `https://huggingface.co/${raw.hugging_face_id}`,
      reliability: 'community'
    });
  }
  if (lab.website) {
    sources.push({ name: lab.name, url: lab.website, reliability: 'official' });
  }

  return {
    id: slug,
    slug,
    name: raw.name,
    family: rest.length ? null : null,
    lab: lab.name,
    labSlug: lab.slug,
    category,
    description: (raw.description ?? '').trim(),
    descriptionDe: null,
    status,
    releaseDate: createdAt ? createdAt.toISOString() : null,
    lastCheckedAt: now.toISOString(),

    openness,
    isOpenSource: false,
    isOpenWeight: openWeight,
    hfId: raw.hugging_face_id ?? null,
    license: null,
    parameterCount: extractParameterCount(hay),

    contextWindow,
    maxOutputTokens: maxOut,
    inputModalities,
    outputModalities,

    features: {
      tools,
      functionCalling: tools,
      jsonMode,
      structuredOutput: structured,
      vision,
      audio,
      reasoning,
      coding,
      streaming: true,
      localDeployment: openWeight
    },

    isPreview,
    isBeta,
    isExperimental,
    isNew,
    isAutoDetected: true,
    isVerified: false,

    cheapestInputPer1m: inputPer1m,
    cheapestOutputPer1m: outputPer1m,
    providerCount: 1,
    providers: [fallbackProvider],

    sources
  };
}

export function mapEndpoints(
  modelId: string,
  endpoints: RawOpenRouterEndpoint[],
  now = new Date()
): ProviderEndpointView[] {
  return endpoints.map((e) => {
    const slug = (e.tag ?? e.provider_name ?? 'unknown').toLowerCase().replace(/\s+/g, '-');
    return {
      providerName: e.provider_name ?? e.tag ?? 'Unknown',
      providerSlug: slug,
      apiModelId: modelId,
      inputPricePer1m: perMillion(e.pricing?.prompt),
      outputPricePer1m: perMillion(e.pricing?.completion),
      cachedInputPricePer1m: perMillion(e.pricing?.input_cache_read),
      contextWindow: e.context_length ?? null,
      maxOutputTokens: e.max_completion_tokens ?? null,
      availabilityStatus: e.status === 0 ? 'available' : 'limited',
      uptime30m: e.uptime_last_30m ?? null,
      region: null,
      euHosting: false,
      link: `https://openrouter.ai/${modelId}`,
      lastCheckedAt: now.toISOString()
    };
  });
}

/** Merge real per-provider endpoints into an imported model, recomputing the
 * cheapest input/output prices and provider count. */
export function withEndpoints(model: ImportedModel, providers: ProviderEndpointView[]): ImportedModel {
  if (!providers.length) return model;
  const inputs = providers.map((p) => p.inputPricePer1m).filter((n): n is number => n != null);
  const outputs = providers.map((p) => p.outputPricePer1m).filter((n): n is number => n != null);
  return {
    ...model,
    providers,
    providerCount: providers.length,
    cheapestInputPer1m: inputs.length ? Math.min(...inputs) : model.cheapestInputPer1m,
    cheapestOutputPer1m: outputs.length ? Math.min(...outputs) : model.cheapestOutputPer1m
  };
}
