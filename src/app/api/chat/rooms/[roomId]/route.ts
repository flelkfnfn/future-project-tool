import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{
    roomId: string
  }>
}

// DELETE: Delete a chat room
export async function DELETE(req: NextRequest, context: RouteParams) {
  let authPrincipal
  try {
    authPrincipal = await requireAuth()
  } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { roomId } = await context.params
  if (!roomId) {
    return NextResponse.json({ ok: false, error: 'ROOM_ID_REQUIRED' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 1. Verify ownership
  const { data: room, error: fetchError } = await supabase
    .from('chat_rooms')
    .select('created_by')
    .eq('id', roomId)
    .single()

  if (fetchError) {
    return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 })
  }

  if (room.created_by !== authPrincipal.id) {
    return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 })
  }

  // 2. Delete the room
  const { error: deleteError } = await supabase
    .from('chat_rooms')
    .delete()
    .eq('id', roomId)

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}