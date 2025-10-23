'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth/session'
async function ensureUsersRow(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  email?: string | null
): Promise<boolean> {
  const { data: existing, error: selErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (!existing && !selErr) {
    const payload: Record<string, unknown> = { id: userId }
    if (typeof email === 'string') payload.email = email
    const { error: insErr } = await supabase.from('users').upsert(payload, { onConflict: 'id', ignoreDuplicates: true })
    if (insErr) {
      console.error('ensure users row error:', insErr)
      return false
    }
    return true
  }
  return true
}


async function ensureLocalUserRow(supabase: ReturnType<typeof createServiceClient>, username: string, userId: string): Promise<boolean> {
  try {
    const { data: u, error: uErr } = await supabase.from('local_users').select('gmail').eq('username', username).maybeSingle()
    if (uErr) {
      console.error('fetch local_users gmail error:', uErr)
    }
    const email = u?.gmail || `${username}@local.invalid`
    const { error: upErr } = await supabase.from('users').upsert({ id: userId, email }, { onConflict: 'id', ignoreDuplicates: true })
    if (upErr) {
      console.error('upsert users (local) error:', upErr)
      return false
    }
    return true
  } catch (e) {
    console.error('ensureLocalUserRow unexpected error:', e)
    return false
  }
}

export async function addIdea(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  if (!title) return

  const { error } = await supabase.from('ideas').insert({ title, description })
  if (error) {
    console.error('addIdea insert error:', error)
    return
  }
  revalidatePath('/ideas')
}

export async function deleteIdea(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const id = Number(formData.get('id'))
  if (isNaN(id)) return

  const { error } = await supabase.from('ideas').delete().eq('id', id)
  if (error) {
    console.error('deleteIdea delete error:', error)
    return
  }
  revalidatePath('/ideas')
}

export async function addComment(formData: FormData) {
  const auth = await getAuth()
  if (!auth.authenticated) return
  const supabase = createServiceClient()

  const idea_id = Number(formData.get('idea_id'))
  const content = formData.get('content') as string
  if (isNaN(idea_id) || !content) return

  const userId = auth.principal?.id
  if (!userId) {
    console.error('addComment: missing user id from auth principal')
    return
  }
  // Support both Supabase and local users by ensuring users(id) exists
  let fkUserId = String(userId)
  try {
    if (auth.principal?.source === 'supabase') {
      const ok = await ensureUsersRow(supabase, fkUserId, auth.principal?.email ?? null)
      if (!ok) {
        console.error('addComment: USERS_ROW_MISSING_AFTER_ENSURE')
        return
      }
    } else if (auth.principal?.source === 'local' && auth.principal.username) {
      // Use the local_users.id carried in principal.id to satisfy FK
      fkUserId = String(auth.principal.id)
      const ok = await ensureLocalUserRow(supabase, auth.principal.username, fkUserId)
      if (!ok) {
        console.error('addComment: USERS_ROW_MISSING_AFTER_ENSURE_LOCAL')
        return
      }
    } else {
      console.error('addComment: UNKNOWN_PRINCIPAL')
      return
    }
  } catch (e) {
    console.error('ensure users row unexpected error (comment):', e)
  }
  // Final verification: user must exist to satisfy FK
  {
    const { data: verify, error: vErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', fkUserId)
      .maybeSingle()
    if (vErr || !verify) {
      console.error('addComment: USERS_ROW_VERIFY_FAILED', vErr)
      return
    }
  }
  const { error } = await supabase.from('comments').insert({ idea_id, user_id: fkUserId, content })
  if (error) {
    console.error('addComment insert error:', error)
    return
  }
  revalidatePath('/ideas')
}

export async function toggleLike(formData: FormData) {
  const auth = await getAuth();
  if (!auth.authenticated) return;
  const supabase = createServiceClient();

  const idea_id = Number(formData.get("idea_id"));
  if (isNaN(idea_id)) return;

  const likeUserId = auth.principal?.id;
  if (!likeUserId) {
    console.error('toggleLike: missing user id from auth principal')
    return
  }
  // Support both Supabase and local users by ensuring users(id) exists
  let fkUserId = String(likeUserId)
  try {
    if (auth.principal?.source === 'supabase') {
      const ok = await ensureUsersRow(supabase, fkUserId, auth.principal?.email ?? null)
      if (!ok) {
        console.error('toggleLike: USERS_ROW_MISSING_AFTER_ENSURE')
        return
      }
    } else if (auth.principal?.source === 'local' && auth.principal.username) {
      // Use the local_users.id carried in principal.id to satisfy FK
      fkUserId = String(auth.principal.id)
      const ok = await ensureLocalUserRow(supabase, auth.principal.username, fkUserId)
      if (!ok) {
        console.error('toggleLike: USERS_ROW_MISSING_AFTER_ENSURE_LOCAL')
        return
      }
    } else {
      console.error('toggleLike: UNKNOWN_PRINCIPAL')
      return
    }
  } catch (e) {
    console.error('ensure users row unexpected error (like):', e)
  }
  // Final verification: user must exist to satisfy FK
  {
    const { data: verify, error: vErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', fkUserId)
      .maybeSingle()
    if (vErr || !verify) {
      console.error('toggleLike: USERS_ROW_VERIFY_FAILED', vErr)
      return
    }
  }

  // Check if the user has already liked the idea
  const { data: existingLike, error: checkError } = await supabase
    .from("idea_likes")
    .select("id")
    .eq("idea_id", idea_id)
    .eq("user_id", fkUserId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking for existing like:", checkError);
    return;
  }

  if (existingLike) {
    // User has liked, so unlike
    const { error: deleteError } = await supabase
      .from("idea_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) {
      console.error("Error unliking idea:", deleteError);
      return;
    }
  } else {
    // User has not liked, so like
    const { error: insertError } = await supabase
      .from("idea_likes")
      .insert({ idea_id, user_id: fkUserId });

    if (insertError) {
      console.error("Error liking idea:", insertError);
      return;
    }
  }

  revalidatePath("/ideas");
}
