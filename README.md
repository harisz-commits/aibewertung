# botbrix

**AI model intelligence & LLM comparison platform** — a bilingual (EN/DE),
CoinMarketCap-style registry of every usable LLM: prices, providers, context,
capabilities, benchmarks and **deterministic, explainable scores**.

> Status: **Phase 1–3 foundation + core slice** is implemented and runs on real
> live data from OpenRouter with **no database required**. Later phases (admin,
> auth, Stripe, paid API, benchmark ingestion, daily agent) are scaffolded and
> documented below.

---

## What works today

- ⚡ **Runs with zero infrastructure.** A committed real-data snapshot
  (`src/data/models.snapshot.json`, 345 live models from OpenRouter) powers the
  whole UI. No DB, no API keys needed to `npm run dev`.
- 🧮 **Model-centric main table** — one row per model, **expandable provider
  rows** with per-provider prices, context, uptime and availability.
- 🔎 Search, sort and free filters (category, lab, capabilities, open-weight,
  local, free tier).
- 📄 **Model detail pages** with capabilities, providers & prices, use-case
  score bars, sources and a "is it worth it?" callout.
- 🧠 **Use-case assistant** — plain-language query → deterministic ranking.
- ⚖️ **Compare** up to 5 models side by side.
- 🏆 Ranking cards (best overall / coding / cheap API / local / German / RAG /
  vision / price-performance).
- 🌍 **i18n EN/DE** with localized routes (`/en`, `/de`), 🌗 **light/dark**.
- 📊 **Deterministic scoring engine** (`src/lib/scoring/engine.ts`) — every
  number comes from auditable formulas; explanations are separate from numbers.
- 🔌 Public read API: `/api/models`, `/api/rankings`, `/api/health`.
- 🔍 SEO: `sitemap.xml`, `robots.txt`, per-model metadata.
- ⚖️ Methodology, Impressum, Datenschutz, transparency disclaimers.

## Tech stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · next-intl ·
Prisma + PostgreSQL (schema ready) · Vercel-compatible.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000  → redirects to /en
```

Refresh the real-data snapshot from live OpenRouter (Node ≥ 22.6):

```bash
npm run snapshot
```

Build for production:

```bash
npm run build && npm start
```

### Environment

Copy `.env.example` → `.env`. **Nothing is required for the read-only demo.**
`DATABASE_URL` and API keys are only needed for the DB-backed pipeline, admin,
auth and payments.

---

## Architecture

```
src/
  app/[locale]/         Localized routes: home, models/[slug], compare,
                        methodology, impressum, datenschutz
  app/api/              Public API (models, rankings, health) + cron/daily stub
  components/           Table, filters, ranking cards, assistant, compare, theme
  i18n/                 next-intl routing/request/navigation
  lib/
    types.ts            Read-side view types
    importers/          Modular source importers (OpenRouter implemented)
    scoring/engine.ts   Deterministic 0–100 scoring (configurable weights)
    data.ts             Read layer (snapshot now; Prisma later, same API)
    labs.ts, format.ts
  data/models.snapshot.json   Committed real data (regenerate via npm run snapshot)
prisma/schema.prisma    Full normalized schema (§19)
prisma/seed.ts          Labs + providers seed
scripts/
  generate-snapshot.ts  Live OpenRouter → snapshot JSON (DB-less)
  import-openrouter.ts   Live OpenRouter → PostgreSQL (Phase 2)
```

### Scoring (transparent by design)

`OVERALL_WEIGHTS` (in `engine.ts`) = quality 30% · price-performance 20% ·
speed 15% · features 15% · availability 10% · trust 10%. Fully configurable.

**Honesty note:** until dedicated benchmark importers land (Phase 4), the
"quality" component is a structural **proxy** (context, capabilities, reasoning,
recency, provider coverage), so snapshot scores are flagged `scoresEstimated:
true` and shown with an *Estimated* badge. We never present a proxy as a
measured benchmark.

---

## Database pipeline (Phase 2, ready to activate)

```bash
# 1. set DATABASE_URL in .env (Postgres: Supabase / Neon / local)
npm run db:generate
npm run db:push          # create tables from schema.prisma
npm run db:seed          # labs + providers
npm run import:openrouter  # upsert models + scores + changelog
```

Then swap `src/lib/data.ts` reads from the snapshot to Prisma queries (same
function signatures) — the UI does not change.

## Admin backend (Phase 5)

Log in at **`/admin`** with `ADMIN_EMAIL` / `ADMIN_PASSWORD` (env). Login works
with no database; **editing** (hide/verify/status/affiliate overrides, featured
slots, data reports) needs `DATABASE_URL` + `npm run db:push`. Admin changes are
stored as slug-keyed overrides applied on top of the snapshot — so monetization
works with just a database connection, ahead of the full model import. Every
change is written to `AdminAuditLog`. Sponsored/featured placements are clearly
labelled and never affect organic scores or rankings.

---

## Per-language coding leaderboard (pipeline)

`npm run import:coding` builds `src/data/coding-languages.json` and the
`/api/coding/languages` endpoint returns `{ language: { "JavaScript": [{model,
score}] } }`. The pipeline (`src/lib/coding/*`) standardizes results rows to
`[model, language, benchmark, score]`, resolves language aliases (js→JavaScript,
cpp→C++), and computes a per-language composite via z-score normalization (or a
weighted average: SWE-bench 50% · McEval 30% · MultiPL-E 20%).

**Honest note on data:** the named HF datasets — `SWE-bench/SWE-bench_Multilingual`,
`nuprl/MultiPL-E`, `Multilingual-Multimodal-NLP/McEval-Instruct` — contain
benchmark **problems / training data, not per-model scores** (verified via the
datasets-server). Model×language scores must come from a results source: a
published leaderboard export or the curated seed
`src/data/coding-languages.seed.json` (see `.seed.example.json`). MultiPL-E's
configs are used only for real **language coverage**. Set `HF_TOKEN` for gated
datasets / higher rate limits.

## Roadmap (from the product spec)

| Phase | Scope | State |
|-------|-------|-------|
| 1 | Project, schema, i18n, light/dark | ✅ done |
| 2 | Importers, daily update job, change logs | 🟡 OpenRouter importer + DB pipeline + cron stub |
| 3 | Main table, expandable providers, filters, detail pages | ✅ done |
| 4 | Scoring engine, use-case rankings, assistant, methodology | 🟡 scoring + rankings + assistant done; benchmark ingestion pending |
| 5 | Admin backend, verification, featured slots, reports | ✅ auth + models/featured/reports admin (DB-backed) |
| 6 | Auth, favorites/watchlist, CSV export, Stripe prep | ⬜ schema ready |
| 7 | Paid API, keys, rate limiting, usage logs | 🟡 open endpoints live; auth/limits pending |
| 8 | SEO, DE translations, daily summaries, polish | 🟡 SEO + i18n done |

## Data & transparency

Data is gathered from provider APIs, marketplaces (OpenRouter), benchmarks and
public docs, and enriched automatically. It may be incomplete or outdated.
Sponsored placements (schema: `FeaturedSlot`) are always clearly marked and
**never** affect organic scores or rankings. See the in-app **Methodology** page.
