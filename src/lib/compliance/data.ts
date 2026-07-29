// Zugriff auf die Compliance-Daten und Zuordnung Modell → Einsatzwege.

import complianceJson from '@/data/provider-compliance.json';
import type { ModelView } from '@/lib/types';
import type { DataClass, ProviderCompliance, Verdict } from './types';
import { bestVerdict, evaluate } from './verdict';

interface RouteRecord extends ProviderCompliance {
  matchProviderSlugs: string[];
  /** Gilt für jedes Open-Weight-Modell, unabhängig vom Anbieter. */
  appliesToOpenWeight?: boolean;
  belegZitat?: string;
}

const DATA = complianceJson as unknown as { meta: Record<string, string>; routes: RouteRecord[] };

export const COMPLIANCE_META = DATA.meta;
export const ALL_ROUTES: RouteRecord[] = DATA.routes;

/** Alle dokumentierten Einsatzwege für ein Modell. Ein Weg zählt, wenn einer
 * seiner Anbieter-Slugs am Modell hängt - oder wenn er generell für
 * Open-Weight-Modelle gilt (Selbstbetrieb). */
export function routesForModel(m: Pick<ModelView, 'providers' | 'isOpenWeight'>): RouteRecord[] {
  const slugs = new Set((m.providers ?? []).map((p) => p.providerSlug));
  return ALL_ROUTES.filter((r) => {
    if (r.appliesToOpenWeight && m.isOpenWeight) return true;
    return r.matchProviderSlugs.some((s) => slugs.has(s));
  });
}

/** Beste erreichbare Ampel eines Modells für eine Datenklasse. */
export function modelVerdict(
  m: Pick<ModelView, 'providers' | 'isOpenWeight'>,
  dataClass: DataClass
): { verdict: Verdict; via: RouteRecord | null; routeCount: number } {
  const routes = routesForModel(m);
  if (routes.length === 0) return { verdict: 'unknown', via: null, routeCount: 0 };
  const best = bestVerdict(routes, dataClass);
  return { verdict: best.verdict, via: best.via as RouteRecord | null, routeCount: routes.length };
}

export { evaluate };
export type { RouteRecord };
