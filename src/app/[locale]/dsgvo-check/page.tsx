import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getAllModels } from '@/lib/data';
import { ALL_ROUTES, evaluate } from '@/lib/compliance/data';
import { DATA_CLASSES, type DataClass } from '@/lib/compliance/types';
import { Schnellcheck, type SchnellcheckRoute } from '@/components/compliance/Schnellcheck';

export const metadata: Metadata = {
  title: 'DSGVO-Schnellcheck - welche KI darf ich in meinem Betrieb einsetzen?',
  description:
    'Drei Fragen zu Ihren Daten, Ihrer Cloud-Vorgabe und Ihrer IT - danach sehen Sie, welcher KI-Einsatzweg für Sie in Frage kommt und was Sie dafür konkret erledigen müssen. Information, keine Rechtsberatung.'
};

export default async function DsgvoCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const textModelle = getAllModels().filter(
    (m) => m.category !== 'media' && m.category !== 'embedding' && m.category !== 'reranker'
  );

  // Bewertung serverseitig - die Engine bleibt die einzige Quelle der Wahrheit.
  const routes: SchnellcheckRoute[] = ALL_ROUTES.map((r) => ({
    slug: r.slug,
    route: r.route,
    name: r.name,
    hostingRegion: r.hostingRegion,
    sourceUrl: r.sourceUrl,
    checkedAt: r.checkedAt,
    offeneFragen: r.openQuestions?.length ?? 0,
    perClass: Object.fromEntries(DATA_CLASSES.map((d) => [d.id, evaluate(r, d.id)])) as Record<
      DataClass,
      ReturnType<typeof evaluate>
    >,
    modelle: textModelle
      .filter((m) =>
        r.appliesToOpenWeight && m.isOpenWeight
          ? true
          : r.matchProviderSlugs.some((s) => (m.providers ?? []).some((p) => p.providerSlug === s))
      )
      .sort((a, b) => b.scores.overall - a.scores.overall)
      .slice(0, 5)
      .map((m) => ({ slug: m.slug, name: m.name }))
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-balance text-3xl font-bold tracking-tight">DSGVO-Schnellcheck</h1>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
        Drei Fragen - danach wissen Sie, welcher Weg für Ihren Betrieb in Frage kommt und was Sie dafür
        konkret erledigen müssen. Die Bewertung folgt festen Regeln aus belegten Anbieterangaben; es entscheidet
        kein Sprachmodell.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <Schnellcheck routes={routes} />
      </div>
    </div>
  );
}
