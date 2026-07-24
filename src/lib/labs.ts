// Lab/company registry: maps provider prefixes (OpenRouter uses "lab/model")
// to display names, and flags labs that publish open-weight models.

export interface LabInfo {
  slug: string;
  name: string;
  website?: string;
  country?: string;
  /** Lab predominantly ships open-weight / downloadable models. */
  openWeight?: boolean;
}

export const LABS: Record<string, LabInfo> = {
  openai: { slug: 'openai', name: 'OpenAI', website: 'https://openai.com', country: 'US' },
  anthropic: { slug: 'anthropic', name: 'Anthropic', website: 'https://anthropic.com', country: 'US' },
  google: { slug: 'google', name: 'Google', website: 'https://ai.google', country: 'US' },
  'google-deepmind': { slug: 'google-deepmind', name: 'Google DeepMind', website: 'https://deepmind.google', country: 'UK' },
  meta: { slug: 'meta', name: 'Meta', website: 'https://ai.meta.com', country: 'US', openWeight: true },
  'meta-llama': { slug: 'meta-llama', name: 'Meta', website: 'https://ai.meta.com', country: 'US', openWeight: true },
  mistralai: { slug: 'mistralai', name: 'Mistral AI', website: 'https://mistral.ai', country: 'FR', openWeight: true },
  deepseek: { slug: 'deepseek', name: 'DeepSeek', website: 'https://deepseek.com', country: 'CN', openWeight: true },
  qwen: { slug: 'qwen', name: 'Qwen (Alibaba)', website: 'https://qwenlm.github.io', country: 'CN', openWeight: true },
  cohere: { slug: 'cohere', name: 'Cohere', website: 'https://cohere.com', country: 'CA' },
  'x-ai': { slug: 'x-ai', name: 'xAI', website: 'https://x.ai', country: 'US' },
  microsoft: { slug: 'microsoft', name: 'Microsoft', website: 'https://microsoft.com', country: 'US', openWeight: true },
  amazon: { slug: 'amazon', name: 'Amazon', website: 'https://aws.amazon.com/bedrock', country: 'US' },
  ai21: { slug: 'ai21', name: 'AI21 Labs', website: 'https://ai21.com', country: 'IL' },
  perplexity: { slug: 'perplexity', name: 'Perplexity', website: 'https://perplexity.ai', country: 'US' },
  'z-ai': { slug: 'z-ai', name: 'Z.ai (Zhipu)', website: 'https://z.ai', country: 'CN', openWeight: true },
  minimax: { slug: 'minimax', name: 'MiniMax', website: 'https://minimax.io', country: 'CN' },
  moonshotai: { slug: 'moonshotai', name: 'Moonshot AI (Kimi)', website: 'https://moonshot.ai', country: 'CN', openWeight: true },
  nvidia: { slug: 'nvidia', name: 'NVIDIA', website: 'https://nvidia.com', country: 'US', openWeight: true },
  nousresearch: { slug: 'nousresearch', name: 'Nous Research', country: 'US', openWeight: true },
  'nous-research': { slug: 'nous-research', name: 'Nous Research', country: 'US', openWeight: true },
  gryphe: { slug: 'gryphe', name: 'Gryphe', openWeight: true },
  sao10k: { slug: 'sao10k', name: 'Sao10K', openWeight: true },
  liquid: { slug: 'liquid', name: 'Liquid AI', country: 'US', openWeight: true },
  inflection: { slug: 'inflection', name: 'Inflection AI', country: 'US' },
  databricks: { slug: 'databricks', name: 'Databricks', country: 'US', openWeight: true },
  'stability-ai': { slug: 'stability-ai', name: 'Stability AI', country: 'UK', openWeight: true },
  thudm: { slug: 'thudm', name: 'THUDM', country: 'CN', openWeight: true },
  '01-ai': { slug: '01-ai', name: '01.AI (Yi)', country: 'CN', openWeight: true },
  baidu: { slug: 'baidu', name: 'Baidu', country: 'CN' },
  tencent: { slug: 'tencent', name: 'Tencent', country: 'CN', openWeight: true },
  bytedance: { slug: 'bytedance', name: 'ByteDance', country: 'CN' },
  reka: { slug: 'reka', name: 'Reka AI', country: 'US' },
  'allenai': { slug: 'allenai', name: 'Allen Institute for AI', country: 'US', openWeight: true }
};

export function resolveLab(prefix: string): LabInfo {
  const key = prefix.toLowerCase();
  if (LABS[key]) return LABS[key];
  // Fallback: title-case the raw prefix.
  const name = key
    .split(/[-_]/)
    .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
  return { slug: key, name };
}
