import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendMail } from '@/lib/email/mailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServiceClient()

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
    return NextResponse.json({ ok: true, processed: 0, sent: 0, failed: 0, errors: [] })
  }

  let okCount = 0
  let failCount = 0
  const errors: Array<{ id: number; to: string; error: string }> = []

  for (const it of items) {
    const recipient = typeof it.to === 'string' ? it.to.trim() : ''
    if (!recipient || !recipient.includes('@')) {
      await supabase.from('email_outbox').update({ error: 'INVALID_RECIPIENT' }).eq('id', it.id)
      failCount++
      errors.push({ id: it.id, to: recipient, error: 'INVALID_RECIPIENT' })
      continue
    }
    try {
      await sendMail(recipient, it.subject ?? '', it.body ?? '')
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
      errors.push({ id: it.id, to: recipient, error: msg })
    }
  }

  let cleared: number | null = null
  let clearError: string | null = null

  // Only clear the outbox when:
  // - this batch had no failures, and
  // - there is nothing left to send (sent_at is still null)
  if (failCount === 0) {
    try {
      const { count: remaining, error: remainingErr } = await supabase
        .from('email_outbox')
        .select('id', { count: 'exact', head: true })
        .is('sent_at', null)

      if (!remainingErr && (remaining ?? 0) === 0) {
        const { count, error: delErr } = await supabase
          .from('email_outbox')
          .delete({ count: 'exact' })
          .gte('id', 0)
        if (delErr) {
          clearError = delErr.message
        } else {
          cleared = count ?? 0
        }
      }
    } catch (e) {
      clearError = (e as { message?: string } | undefined)?.message ?? 'CLEAR_FAILED'
    }
  }

  return NextResponse.json({
    ok: true,
    processed: items.length,
    sent: okCount,
    failed: failCount,
    errors,
    cleared,
    clearError,
  })
}
