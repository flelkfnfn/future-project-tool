'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addIdea(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title) {
    return
  }

  const { error } = await supabase.from('ideas').insert({ title, description })

  if (error) {
    // TODO: Handle error
    console.error(error)
    return
  }

  revalidatePath('/ideas')
}

export async function deleteIdea(formData: FormData) {
  const supabase = await createClient()
  const id = Number(formData.get('id'))

  if (isNaN(id)) {
    console.error("아이디어 삭제 오류: 유효하지 않은 ID입니다.", formData.get('id'))
    return
  }

  const { error } = await supabase.from('ideas').delete().eq('id', id)

  if (error) {
    console.error("아이디어 삭제 오류:", error)
    return
  }

  revalidatePath('/ideas')
}
