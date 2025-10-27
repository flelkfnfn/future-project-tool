import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{
    roomId: string
  }>
}

// GET: List members of a room
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { roomId } = await context.params
  if (!roomId) {
    return NextResponse.json({ ok: false, error: 'ROOM_ID_REQUIRED' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('chat_room_members')
    .select('user_id')
    .eq('room_id', roomId)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, members: data })
}


// POST: Add members to a room
export async function POST(req: NextRequest, context: RouteParams) {
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

  const { member_ids } = await req.json()
  if (!Array.isArray(member_ids) || member_ids.length === 0) {
    return NextResponse.json({ ok: false, error: 'MEMBER_IDS_REQUIRED' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 1. Verify ownership/permission to add members
  const { data: room, error: fetchError } = await supabase
    .from('chat_rooms')
    .select('created_by')
    .eq('id', roomId)
    .single()

  if (fetchError) {
    return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 })
  }

  if (room.created_by !== authPrincipal.id) {
    // For now, only the creator can add members. This could be expanded later.
    return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 })
  }

  // 2. Prepare and insert new members
  const memberRows = member_ids.map(userId => ({
    room_id: roomId,
    user_id: userId,
  }))

  const { error: insertError } = await supabase
    .from('chat_room_members')
    .upsert(memberRows, { onConflict: 'room_id, user_id', ignoreDuplicates: true })

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}