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

// New function to add a comment
export async function addComment(formData: FormData) {
  const supabase = await createClient()

  const idea_id = Number(formData.get('idea_id'))
  const content = formData.get('content') as string

  if (isNaN(idea_id) || !content) {
    console.error("댓글 추가 오류: 유효하지 않은 아이디어 ID 또는 내용입니다.", formData.get('idea_id'), content)
    return
  }

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error("댓글 추가 오류: 사용자가 로그인되어 있지 않습니다.")
    return
  }

  const { error } = await supabase.from('comments').insert({ idea_id, user_id: user.id, content })

  if (error) {
    console.error("댓글 추가 오류:", error)
    return
  }

  revalidatePath('/ideas')
}

// New function to toggle a like
export async function toggleLike(formData: FormData) {
  const supabase = await createClient()

  const idea_id = Number(formData.get('idea_id'))

  if (isNaN(idea_id)) {
    console.error("좋아요 토글 오류: 유효하지 않은 아이디어 ID입니다.", formData.get('idea_id'))
    return
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error("좋아요 토글 오류: 사용자가 로그인되어 있지 않습니다.")
    return
  }

  // Check if the user has already liked this idea
  const { data: existingLike, error: checkError } = await supabase
    .from('idea_likes') // Assuming a new table named 'idea_likes' to track likes
    .select('id')
    .eq('idea_id', idea_id)
    .eq('user_id', user.id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("좋아요 확인 오류:", checkError)
    return
  }

  if (existingLike) {
    // User has already liked, so unlike it
    const { error: deleteError } = await supabase
      .from('idea_likes')
      .delete()
      .eq('id', existingLike.id)

    if (deleteError) {
      console.error("좋아요 취소 오류:", deleteError)
      return
    }

    // Decrement likes count in ideas table
    await supabase.rpc('decrement_idea_likes', { idea_id_param: idea_id })

  } else {
    // User has not liked, so like it
    const { error: insertError } = await supabase
      .from('idea_likes')
      .insert({ idea_id, user_id: user.id })

    if (insertError) {
      console.error("좋아요 추가 오류:", insertError)
      return
    }

    // Increment likes count in ideas table
    await supabase.rpc('increment_idea_likes', { idea_id_param: idea_id })
  }

  revalidatePath('/ideas')
}
