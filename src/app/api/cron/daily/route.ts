import { NextResponse } from 'next/server';

// Daily update agent entrypoint (Phase 2). Scheduled at 10:00 Europe/Vienna
// via vercel.json (cron runs in UTC — adjust for DST). Authorize with a bearer
// CRON_SECRET so it cannot be triggered publicly.
//
// The full agent (fetch sources → detect new/changed → normalize → changelog →
// regenerate EN/DE descriptions → daily summary) runs against the database and
// is implemented in scripts/import-openrouter.ts + enrichment steps. Wire it in
// once DATABASE_URL is configured.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO(phase-2): invoke the DB import + enrichment pipeline here.
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    note: 'Stub — connect DATABASE_URL and the import pipeline to activate.'
  });
}
