'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProject(formData: FormData) {
  const supabase = await createClient()

  const text = formData.get('name') as string
  if (!text) {
    return
  }

  const { error } = await supabase.from('projects').insert({ name: text })

  if (error) {
    // TODO: Handle error
    console.error(error)
    return
  }

  // 데이터가 성공적으로 추가되면, 프로젝트 페이지의 캐시를 무효화하여
  // 새로운 목록을 다시 불러오도록 합니다.
  revalidatePath('/projects')
}
