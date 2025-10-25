
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const supabase = createServiceClient()
  // For now, only list local_users. We might need to merge with supabase users later.
  const { data, error } = await supabase
    .from('local_users')
    .select('id, username')
    .order('username')

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // Ensure local users exist in the public.users table to satisfy foreign key constraints.
  // This is a good place to sync them.
  if (data) {
    const userRows = data.map(u => ({ id: u.id, email: `${u.username}@local.invalid` }));
    await supabase.from('users').upsert(userRows, { onConflict: 'id', ignoreDuplicates: true });
  }

  return NextResponse.json({ ok: true, users: data })
}
