import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await getAuth()
  if (!auth.authenticated) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })

  const form = await req.formData()
  const title = String(form.get('title') ?? '')
  const description = String(form.get('description') ?? '')
  if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('ideas').insert({ title, description })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

