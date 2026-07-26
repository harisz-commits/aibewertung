import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getAllModels } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const staticPaths = ['', '/compare', '/benchmarks', '/methodology', '/impressum', '/datenschutz'];
  const models = getAllModels();

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const p of staticPaths) {
      entries.push({ url: `${base}/${locale}${p}`, changeFrequency: 'daily', priority: p === '' ? 1 : 0.6 });
    }
    for (const m of models) {
      entries.push({
        url: `${base}/${locale}/models/${m.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5
      });
    }
  }
  return entries;
}
