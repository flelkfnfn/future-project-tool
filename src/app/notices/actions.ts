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
