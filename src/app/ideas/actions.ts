'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth/session'

export async function addIdea(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  if (!title) return

  const { error } = await supabase.from('ideas').insert({ title, description })
  if (error) return
  revalidatePath('/ideas')
}

export async function deleteIdea(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const id = Number(formData.get('id'))
  if (isNaN(id)) return

  const { error } = await supabase.from('ideas').delete().eq('id', id)
  if (error) return
  revalidatePath('/ideas')
}

export async function addComment(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const idea_id = Number(formData.get('idea_id'))
  const content = formData.get('content') as string
  if (isNaN(idea_id) || !content) return

  const userId = auth.principal?.source === 'supabase' ? auth.principal.id : `local:${auth.principal?.username}`
  const { error } = await supabase.from('comments').insert({ idea_id, user_id: userId, content })
  if (error) return
  revalidatePath('/ideas')
}

export async function toggleLike(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const idea_id = Number(formData.get('idea_id'))
  if (isNaN(idea_id)) return

  const likeUserId = auth.principal?.source === 'supabase' ? auth.principal.id : `local:${auth.principal?.username}`

  const { data: existingLike, error: checkError } = await supabase
    .from('idea_likes')
    .select('id')
    .eq('idea_id', idea_id)
    .eq('user_id', likeUserId)
    .maybeSingle()

  if (checkError && (checkError as any).code && (checkError as any).code !== 'PGRST116') return

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from('idea_likes')
      .delete()
      .eq('id', existingLike.id)
    if (deleteError) return
    await supabase.rpc('decrement_idea_likes', { idea_id_param: idea_id })
  } else {
    const { error: insertError } = await supabase
      .from('idea_likes')
      .insert({ idea_id, user_id: likeUserId })
    if (insertError) return
    await supabase.rpc('increment_idea_likes', { idea_id_param: idea_id })
  }

  revalidatePath('/ideas')
}
