import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMail } from '@/lib/email/mailer'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServiceClient()

  // Fetch unsent emails (batch)
  const { data: items, error } = await supabase
    .from('email_outbox')
    .select('id, "to", subject, body, sent_at')
    .is('sent_at', null)
    .order('id', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let okCount = 0
  let failCount = 0

  for (const it of items) {
    try {
      await sendMail(it.to, it.subject, it.body)
      await supabase
        .from('email_outbox')
        .update({ sent_at: new Date().toISOString(), error: null })
        .eq('id', it.id)
      okCount++
    } catch (e) {
      const msg = (e as { message?: string } | undefined)?.message || 'send error'
      await supabase
        .from('email_outbox')
        .update({ error: msg })
        .eq('id', it.id)
      failCount++
    }
  }

  return NextResponse.json({ ok: true, processed: items.length, sent: okCount, failed: failCount })
}

