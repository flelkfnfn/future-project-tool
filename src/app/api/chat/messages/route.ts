﻿import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { cookies } from "next/headers"
import { getAuth } from "@/lib/auth/session"

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const roomId = req.nextUrl.searchParams.get('roomId')

  let query = supabase
    .from('chat_messages')
    .select('id, text, username, ts, room_id')
    .order('ts', { ascending: true })
    .limit(200)

  if (roomId) {
    query = query.eq('room_id', roomId)
  } else {
    query = query.is('room_id', null)
  }

  const { data, error } = await query

  if (!error && Array.isArray(data)) {
    const responseData = data.map((r) => ({
      id: String(r.id),
      text: r.text,
      user: r.username,
      ts: r.ts,
      room_id: r.room_id,
    }))
    return NextResponse.json({ ok: true, data: responseData })
  }

  return NextResponse.json({ ok: false, error: error?.message || 'DB_ERROR' }, { status: 500 })
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
  const roomId = form.get('room_id') ? Number(form.get('room_id')) : null

  if (!text) return NextResponse.json({ ok: false, error: 'TEXT_REQUIRED' }, { status: 400 })
  
  const username = auth.authenticated
    ? (auth.principal?.source === 'supabase' ? (auth.principal.email ?? 'user') : String(auth.principal?.username ?? 'user'))
    : 'user'

  const { error } = await supabase.from('chat_messages').insert({ text, username, ts, room_id: roomId })
  
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}