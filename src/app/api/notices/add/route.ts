import { NextResponse } from "next/server"
import { getAuth } from "@/lib/auth/session"
import { createServiceClient } from "@/lib/supabase/service"
import { sendMail } from "@/lib/email/mailer"

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const auth = await getAuth()
  if (!auth.authenticated) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })

  const form = await req.formData()
  const title = String(form.get('title') ?? '')
  const content = String(form.get('content') ?? '')
  if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('notices').insert({ title, content })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

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