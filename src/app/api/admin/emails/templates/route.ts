import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import type { QueryResultRow } from 'pg';

export async function GET(): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await query<QueryResultRow>('SELECT id, key, name, subject, html_body, updated_at FROM email_templates ORDER BY id');
  return NextResponse.json({ templates: rows });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json() as { id?: number; subject?: string; html_body?: string };
  if (!body.id || !body.subject || !body.html_body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  await execute('UPDATE email_templates SET subject = $1, html_body = $2, updated_at = now() WHERE id = $3', [body.subject, body.html_body, body.id]);
  return NextResponse.json({ success: true });
}
