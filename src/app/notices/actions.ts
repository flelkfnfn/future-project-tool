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

    if (!usersErr && users && users.length > 0) {
      // Simple validation: include only addresses containing '@'
      const list = users
        .map((u: { gmail: string | null }) => (u && typeof u.gmail === 'string' ? u.gmail.trim() : ''))
        .filter((g: string) => g.includes('@'))

      // Optionally include admin email if set
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (adminEmail && adminEmail.includes('@')) list.push(adminEmail)

      // De-duplicate
      const uniq = Array.from(new Set(list))

      if (uniq.length > 0) {
        // Insert into email_outbox for later delivery by a worker/cron
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
