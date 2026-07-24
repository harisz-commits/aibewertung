import { NextResponse } from 'next/server';
import { getTopBy } from '@/lib/data';
import type { Scores } from '@/lib/types';

const ALLOWED: (keyof Scores)[] = [
  'overall', 'coding', 'reasoning', 'math', 'writing', 'german', 'translation',
  'cheapApi', 'speed', 'local', 'rag', 'longContext', 'agentTool', 'vision',
  'pricePerformance'
];

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = (searchParams.get('by') ?? 'overall') as keyof Scores;
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50);
  if (!ALLOWED.includes(key)) {
    return NextResponse.json({ error: `Invalid 'by'. Allowed: ${ALLOWED.join(', ')}` }, { status: 400 });
  }
  const data = getTopBy(key, limit).map((m, i) => ({
    rank: i + 1,
    slug: m.slug,
    name: m.name,
    lab: m.lab,
    score: m.scores[key]
  }));
  return NextResponse.json({ by: key, count: data.length, data });
}
