'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { checkCredentials, startAdminSession, endAdminSession, requireAdmin } from './auth';
import { getDb, isDbConfigured } from '@/lib/db';
import type { ModelStatus } from '@/lib/types';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (checkCredentials(email, password)) {
    await startAdminSession();
    redirect('/admin');
  }
  redirect('/admin/login?error=1');
}

export async function logoutAction() {
  await endAdminSession();
  redirect('/admin/login');
}

async function audit(action: string, entityType: string, entityId: string | null, after: unknown) {
  const db = getDb();
  await db.adminAuditLog.create({
    data: { adminId: 'admin', action, entityType, entityId: entityId ?? undefined, after: after as object }
  });
}

export async function saveOverrideAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const db = getDb();
  const modelSlug = String(formData.get('modelSlug') ?? '');
  if (!modelSlug) return;

  const data = {
    isHidden: formData.get('isHidden') === 'on',
    isVerified: formData.get('isVerified') === 'on',
    statusOverride: (String(formData.get('statusOverride') ?? '') || null) as ModelStatus | null,
    affiliateUrl: String(formData.get('affiliateUrl') ?? '').trim() || null,
    note: String(formData.get('note') ?? '').trim() || null,
    updatedBy: 'admin'
  };

  await db.adminOverride.upsert({
    where: { modelSlug },
    update: data,
    create: { modelSlug, ...data }
  });
  await audit('override.save', 'model', modelSlug, data);
  revalidatePath('/admin/models');
  revalidatePath('/');
}

export async function saveFeaturedAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const db = getDb();
  const id = String(formData.get('id') ?? '');
  const data = {
    placement: String(formData.get('placement') ?? 'table_top'),
    label: String(formData.get('label') ?? 'Sponsored'),
    modelId: String(formData.get('modelSlug') ?? '').trim() || null,
    targetUrl: String(formData.get('targetUrl') ?? '').trim(),
    isActive: formData.get('isActive') === 'on'
  };
  if (!data.targetUrl) return;

  if (id) {
    await db.featuredSlot.update({ where: { id }, data });
  } else {
    await db.featuredSlot.create({ data });
  }
  await audit('featured.save', 'featured_slot', id || null, data);
  revalidatePath('/admin/featured');
  revalidatePath('/');
}

export async function deleteFeaturedAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const db = getDb();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await db.featuredSlot.delete({ where: { id } });
  await audit('featured.delete', 'featured_slot', id, null);
  revalidatePath('/admin/featured');
  revalidatePath('/');
}

export async function resolveReportAction(formData: FormData) {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const db = getDb();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'resolved') as 'open' | 'reviewing' | 'resolved' | 'rejected';
  if (!id) return;
  await db.dataReport.update({ where: { id }, data: { status } });
  await audit('report.update', 'data_report', id, { status });
  revalidatePath('/admin/reports');
}
