import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import type { QueryResultRow } from 'pg';

interface SubRow extends QueryResultRow { id: number; email: string; status: string; source: string; created_at: string; }

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'subscribers';
  const search = searchParams.get('q') || '';
  const format = searchParams.get('format');

  if (tab === 'logs') {
    const logs = await query<QueryResultRow>(
      'SELECT id, to_email, subject, kind, status, created_at FROM email_logs ORDER BY created_at DESC LIMIT 200'
    );
    return NextResponse.json({ logs });
  }

  // Subscribers
  let rows: SubRow[];
  if (search) {
    rows = await query<SubRow>(
      "SELECT id, email, status, source, created_at FROM subscribers WHERE email ILIKE $1 ORDER BY created_at DESC LIMIT 200",
      [`%${search}%`]
    );
  } else {
    rows = await query<SubRow>(
      'SELECT id, email, status, source, created_at FROM subscribers ORDER BY created_at DESC LIMIT 200'
    );
  }

  const countRes = await query<QueryResultRow & { count: string }>("SELECT count(*) as count FROM subscribers WHERE status = 'active'");
  const total = Number(countRes[0]?.count || 0);

  if (format === 'csv') {
    const csv = 'email,status,source,created_at\n' + rows.map(r => `${r.email},${r.status},${r.source || ''},${r.created_at}`).join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=subscribers.csv' } });
  }

  return NextResponse.json({ subscribers: rows, total });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await execute('DELETE FROM subscribers WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
