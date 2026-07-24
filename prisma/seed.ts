// Seeds labs and providers. Run: npm run db:seed (requires DATABASE_URL).
import { PrismaClient } from '@prisma/client';
import { LABS } from '../src/lib/labs.ts';

const prisma = new PrismaClient();

const PROVIDERS: { slug: string; name: string; website?: string; euHosting?: boolean }[] = [
  { slug: 'openai', name: 'OpenAI', website: 'https://openai.com' },
  { slug: 'anthropic', name: 'Anthropic', website: 'https://anthropic.com' },
  { slug: 'google-vertex', name: 'Google Vertex AI', website: 'https://cloud.google.com/vertex-ai', euHosting: true },
  { slug: 'google-ai-studio', name: 'Google AI Studio', website: 'https://ai.google.dev' },
  { slug: 'azure', name: 'Microsoft Azure', website: 'https://azure.microsoft.com', euHosting: true },
  { slug: 'amazon-bedrock', name: 'Amazon Bedrock', website: 'https://aws.amazon.com/bedrock', euHosting: true },
  { slug: 'mistral', name: 'Mistral', website: 'https://mistral.ai', euHosting: true },
  { slug: 'deepseek', name: 'DeepSeek', website: 'https://deepseek.com' },
  { slug: 'cohere', name: 'Cohere', website: 'https://cohere.com' },
  { slug: 'together', name: 'Together AI', website: 'https://together.ai' },
  { slug: 'fireworks', name: 'Fireworks AI', website: 'https://fireworks.ai' },
  { slug: 'groq', name: 'Groq', website: 'https://groq.com' },
  { slug: 'perplexity', name: 'Perplexity', website: 'https://perplexity.ai' },
  { slug: 'xai', name: 'xAI', website: 'https://x.ai' },
  { slug: 'openrouter', name: 'OpenRouter', website: 'https://openrouter.ai' },
  { slug: 'huggingface', name: 'Hugging Face', website: 'https://huggingface.co' },
  { slug: 'ollama', name: 'Ollama', website: 'https://ollama.com', euHosting: true }
];

async function main() {
  for (const lab of Object.values(LABS)) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: { name: lab.name, websiteUrl: lab.website, country: lab.country },
      create: { slug: lab.slug, name: lab.name, websiteUrl: lab.website, country: lab.country }
    });
  }
  console.log(`Seeded ${Object.keys(LABS).length} labs`);

  for (const p of PROVIDERS) {
    await prisma.provider.upsert({
      where: { slug: p.slug },
      update: { name: p.name, websiteUrl: p.website, euHosting: p.euHosting ?? false },
      create: { slug: p.slug, name: p.name, websiteUrl: p.website, euHosting: p.euHosting ?? false }
    });
  }
  console.log(`Seeded ${PROVIDERS.length} providers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
