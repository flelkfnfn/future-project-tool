'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth/session'

export async function addProject(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const text = formData.get('name') as string
  const description = (formData.get('description') as string) || ''
  if (!text) {
    return
  }

  let { error } = await supabase.from('projects').insert(description ? { name: text, description } : { name: text })
  if (error && /description/i.test(String(error.message))) {
    const retry = await supabase.from('projects').insert({ name: text })
    error = retry.error
  }

  if (error) {
    console.error(error)
    return
  }

  revalidatePath('/projects')
}

export async function deleteProject(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()
  const id = Number(formData.get('id'))

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

  const normalizedUrl = normalizeExternalUrl(url)
  const { error } = await supabase.from('project_links').insert({ project_id, url: normalizedUrl, title })

  if (error) {
    console.error("Error adding link:", error)
    return
  }
  
  // ▼▼▼ 이 부분이 추가되었습니다 ▼▼▼
  // 링크가 추가된 후에도 프로젝트 목록 페이지를 갱신하도록 합니다.
  revalidatePath('/projects')
}

function normalizeExternalUrl(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (/^\/\//.test(raw)) return `https:${raw}`
  const prefixed = `https://${raw.replace(/^\/+/, '')}`
  try {
    // eslint-disable-next-line no-new
    new URL(prefixed)
    return prefixed
  } catch {
    return raw
  }
}
