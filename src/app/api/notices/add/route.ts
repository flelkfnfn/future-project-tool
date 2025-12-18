import { NextResponse } from "next/server"
import { getAuth } from "@/lib/auth/session"
import { createServiceClient } from "@/lib/supabase/service"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await getAuth()
  if (!auth.authenticated) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })

  const form = await req.formData()
  const title = String(form.get('title') ?? '')
  const content = String(form.get('content') ?? '')
  const pollRaw = form.get('poll')
  if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: notice, error } = await supabase
    .from('notices')
    .insert({ title, content })
    .select('id')
    .single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Optional poll/survey payload (JSON string)
  if (pollRaw) {
    try {
      const parsed = JSON.parse(String(pollRaw)) as {
        enabled?: boolean
        question?: string | null
        multiple?: boolean
        anonymous?: boolean
        allowChange?: boolean
        deadline?: string | null
        options?: Array<string>
      }

      const enabled = parsed?.enabled === true
      const options = Array.isArray(parsed?.options)
        ? parsed.options.map((s) => String(s ?? '').trim()).filter(Boolean)
        : []

      if (enabled && options.length >= 2) {
        const { data: poll, error: pollErr } = await supabase
          .from('notice_polls')
          .insert({
            notice_id: (notice as any).id,
            question: parsed?.question ? String(parsed.question) : null,
            multiple: !!parsed?.multiple,
            anonymous: !!parsed?.anonymous,
            allow_change: parsed?.allowChange !== false,
            deadline: parsed?.deadline ? String(parsed.deadline) : null,
          })
          .select('id')
          .single()

        if (!pollErr && poll?.id) {
          const rows = options.map((label, idx) => ({
            poll_id: poll.id,
            label,
            position: idx,
          }))
          const { error: optErr } = await supabase
            .from('notice_poll_options')
            .insert(rows)
          if (optErr) console.error('notice_poll_options insert error:', optErr)
        } else if (pollErr) {
          console.error('notice_polls insert error:', pollErr)
        }
      }
    } catch (e) {
      console.error('poll parse error:', e)
    }
  }

  // Build recipient list
  const recipients = new Set<string>()
  try {
    const { data: users, error: usersErr } = await supabase
      .from('local_users')
      .select('gmail')
    if (!usersErr && Array.isArray(users)) {
      for (const u of users as Array<{ gmail: string | null }>) {
        const g = typeof u.gmail === 'string' ? u.gmail.trim() : ''
        if (g && g.includes('@')) recipients.add(g)
      }
    }
  } catch {}
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (adminEmail && adminEmail.includes('@')) recipients.add(adminEmail)
  const actorEmail = auth.principal?.source === 'supabase' ? (auth.principal.email ?? '') : ''
  if (actorEmail && actorEmail.includes('@')) recipients.add(actorEmail)

  // Enqueue into outbox
  if (recipients.size > 0) {
    const rows = Array.from(recipients).map((to) => ({ to, subject: `[공지] ${title}`, body: content ?? '' }))
    const { error: outboxErr } = await supabase.from('email_outbox').insert(rows)
    if (outboxErr) {
      console.error('email_outbox insert error:', outboxErr)
    }
  }
  return NextResponse.json({ ok: true })
}
