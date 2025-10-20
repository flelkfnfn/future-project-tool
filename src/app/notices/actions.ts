'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addNotice(formData: FormData) {
  const supabase = await createClient()

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

export async function deleteNotice(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from('notices').delete().eq('id', id)

  if (error) {
    console.error("공지사항 삭제 오류:", error)
    return
  }

  revalidatePath('/notices')
}
