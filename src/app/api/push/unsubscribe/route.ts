import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { endpoint } = await req.json()
  const ep = typeof endpoint === 'string' ? endpoint : ''
  if (!ep) return NextResponse.json({ ok: false, error: 'ENDPOINT_REQUIRED' }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', ep)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

