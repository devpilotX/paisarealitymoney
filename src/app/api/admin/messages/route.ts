import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import type { QueryResultRow } from 'pg';

interface MessageRow extends QueryResultRow {
  id: number; name: string; email: string; message: string; is_read: boolean; created_at: string;
}

export async function GET(): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await query<MessageRow>(
    'SELECT id, name, email, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 200'
  );
  return NextResponse.json({ success: true, messages });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { id?: number; is_read?: boolean };
  if (!body.id || typeof body.is_read !== 'boolean') {
    return NextResponse.json({ error: 'id and is_read required' }, { status: 400 });
  }
  await execute('UPDATE contact_messages SET is_read = $1 WHERE id = $2', [body.is_read, body.id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await execute('DELETE FROM contact_messages WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
