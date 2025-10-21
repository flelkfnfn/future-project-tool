'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth/session'

export async function addEvent(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const event_date = formData.get('event_date') as string

  if (!title || !event_date) {
    return
  }

  const { error } = await supabase.from('calendar_events').insert({ title, description, event_date })

  if (error) {
    // TODO: Handle error
    console.error(error)
    return
  }

  revalidatePath('/calendar')
}

export async function deleteEvent(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()
  const id = Number(formData.get('id'))

  if (isNaN(id)) {
    console.error("이벤트 삭제 오류: 유효하지 않은 ID입니다.", formData.get('id'))
    return
  }

  const { error } = await supabase.from('calendar_events').delete().eq('id', id)

  if (error) {
    console.error("이벤트 삭제 오류:", error)
    return
  }

  revalidatePath('/calendar')
}
