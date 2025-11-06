import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushToUserIds } from '@/lib/push/send'

export const runtime = 'nodejs'

export async function GET() {
  let principal
  try { principal = await requireAuth() } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const payload = {
    title: '테스트 알림',
    body: '이 알림이 보이면 푸시가 정상 동작합니다.',
    url: '/',
    icon: '/favicon.ico',
  }
  try {
    const result = await sendPushToUserIds(supabase, [String(principal.id)], payload)
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

