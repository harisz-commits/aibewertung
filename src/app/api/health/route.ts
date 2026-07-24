import { NextResponse } from 'next/server';
import { getSnapshotMeta } from '@/lib/data';

export function GET() {
  return NextResponse.json({ status: 'ok', snapshot: getSnapshotMeta() });
}
