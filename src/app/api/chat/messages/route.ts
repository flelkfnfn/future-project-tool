import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('text, user, ts')
    .order('ts', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await getAuth()
  if (!auth.authenticated) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  const supabase = createServiceClient()
  const form = await req.formData()
  const text = String(form.get('text') ?? '')
  const ts = Number(String(form.get('ts') ?? '')) || Date.now()
  if (!text) return NextResponse.json({ ok: false, error: 'TEXT_REQUIRED' }, { status: 400 })
  const username = auth.principal?.source === 'supabase' ? (auth.principal.email ?? 'user') : String(auth.principal?.username ?? 'user')
  const { error } = await supabase.from('chat_messages').insert({ text, user: username, ts })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
