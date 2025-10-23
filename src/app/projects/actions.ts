'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth/session'

export async function addProject(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

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

export async function deleteProject(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()
  const id = Number(formData.get('id')) // Extract id from FormData and convert to number

  if (isNaN(id)) {
    console.error("프로젝트 삭제 오류: 유효하지 않은 ID입니다.", formData.get('id'))
    return
  }

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) {
    console.error("프로젝트 삭제 오류:", error)
    return
  }

  revalidatePath('/projects')
}

export async function addLink(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const project_id = Number(formData.get('project_id'))
  const url = formData.get('url') as string
  const title = formData.get('title') as string

  if (isNaN(project_id) || !url) {
    return
  }

  const { error } = await supabase.from('project_links').insert({ project_id, url, title })

  if (error) {
    console.error("Error adding link:", error)
    // Optionally surface a user-friendly message in UI if desired
    return
  }

  // Success
}
