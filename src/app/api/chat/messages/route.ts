import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { cookies } from "next/headers"
import { getAuth } from "@/lib/auth/session"

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServiceClient()
  // Primary: chat_messages uses username
  const primary = await supabase
    .from('chat_messages')
    .select('id, text, username, ts')
    .order('ts', { ascending: true })
    .limit(200)
  if (!primary.error && Array.isArray(primary.data)) {
    const data = (primary.data as Array<{ id: number | string; text: string; username: string; ts: number }>).map((r) => ({
      id: String(r.id),
      text: r.text,
      user: r.username,
      ts: r.ts,
    }))
    return NextResponse.json({ ok: true, data })
  }
  // Fallback: singular table chat_message (may not have id)
  
  const alt = await supabase
    .from('chat_message')
    .select('id, text, username, ts')
    .order('ts', { ascending: true })
    .limit(200)
  if (!alt.error && Array.isArray(alt.data)) {
    const data = (alt.data as Array<{ id?: number | string; text: string; username: string; ts: number }>).map((r) => ({
      id: r.id != null ? String(r.id) : `${r.ts}:${r.username}:${r.text}`,
      text: r.text,
      user: r.username,
      ts: r.ts,
    }))
    return NextResponse.json({ ok: true, data })
  }
  const err = primary.error || alt.error
  return NextResponse.json({ ok: false, error: err?.message || 'DB_ERROR' }, { status: 500 })
}

export async function POST(req: Request) {
  const auth = await getAuth()
  if (!auth.authenticated) {
    const jar = await cookies()
    const present = jar.get('local_session_present')?.value
    if (present !== '1') return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const form = await req.formData()
  const text = String(form.get('text') ?? '')
  const ts = Number(String(form.get('ts') ?? '')) || Date.now()
  if (!text) return NextResponse.json({ ok: false, error: 'TEXT_REQUIRED' }, { status: 400 })
  const username = auth.authenticated
    ? (auth.principal?.source === 'supabase' ? (auth.principal.email ?? 'user') : String(auth.principal?.username ?? 'user'))
    : 'user'

  const ins = await supabase.from('chat_messages').insert({ text, username, ts })
  if (!ins.error) return NextResponse.json({ ok: true })
  const alt = await supabase.from('chat_message').insert({ text, username, ts })
  if (!alt.error) return NextResponse.json({ ok: true })
  const errMsg = ins.error?.message || alt.error?.message || 'DB_ERROR'
  return NextResponse.json({ ok: false, error: errMsg }, { status: 500 })
}