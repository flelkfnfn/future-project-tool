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

export async function deleteIdea(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from('ideas').delete().eq('id', id)

  if (error) {
    console.error("아이디어 삭제 오류:", error)
    return
  }

  revalidatePath('/ideas')
}
