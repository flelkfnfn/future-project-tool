import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  let principal
  try {
    principal = await requireAuth()
  } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const sub = await req.json()
  const endpoint = String(sub?.endpoint || '')
  const p256dh = String(sub?.keys?.p256dh || '')
  const auth = String(sub?.keys?.auth || '')
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: 'BAD_SUBSCRIPTION' }, { status: 400 })
  }

  const supabase = createServiceClient()
  let ua: string | undefined
  try { ua = (await headers()).get('user-agent') ?? undefined } catch {}

  const row = {
    user_source: principal.source,
    user_id: principal.id,
    endpoint,
    p256dh,
    auth,
    ua,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(row, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

