'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth/session'

export async function addNotice(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title) {
    return
  }

  const { error } = await supabase.from('notices').insert({ title, content })

  if (error) {
    // TODO: Handle error
    console.error(error)
    return
  }

  // Queue notification emails to all registered users (outbox pattern)
  try {
    const { data: users, error: usersErr } = await supabase
      .from('local_users')
      .select('gmail')

    const recipients = new Set<string>()

    if (!usersErr && Array.isArray(users)) {
      const list = users as Array<{ gmail: string | null }>
      for (const u of list) {
        const g = typeof u.gmail === 'string' ? u.gmail.trim() : ''
        if (g && g.includes('@')) recipients.add(g)
      }
    } else if (usersErr) {
      console.error('local_users query error:', usersErr)
    }

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (adminEmail && adminEmail.includes('@')) recipients.add(adminEmail)

    const actorEmail = (auth.principal?.source === 'supabase') ? (auth.principal.email ?? '') : ''
    if (actorEmail && actorEmail.includes('@')) recipients.add(actorEmail)

    const uniq = Array.from(recipients)

    if (uniq.length === 0) {
      console.warn('email_outbox skipped: no recipients (set NEXT_PUBLIC_ADMIN_EMAIL or register users with gmail)')
    } else {
      const rows = uniq.map((to) => ({
        to,
        subject: `[공지] ${title}`,
        body: content ?? '',
      }))
      const { error: outboxErr } = await supabase.from('email_outbox').insert(rows)
      if (outboxErr) {
        console.error('email_outbox insert error:', outboxErr)
      }
    }
  } catch (e) {
    console.error('enqueue emails failed:', e)
    }
    revalidatePath('/notices')
  }

export async function deleteNotice(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()
  const id = Number(formData.get('id'))

  if (isNaN(id)) {
    console.error("공지사항 삭제 오류: 유효하지 않은 ID입니다.", formData.get('id'))
    return
  }

  const { error } = await supabase.from('notices').delete().eq('id', id)

  if (error) {
    console.error("공지사항 삭제 오류:", error)
    return
  }

  revalidatePath('/notices')
}
