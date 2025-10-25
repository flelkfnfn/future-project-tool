
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

// GET: List rooms for the current user
export async function GET() {
  let authPrincipal
  try {
    authPrincipal = await requireAuth()
  } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('chat_room_members')
    .select('room:chat_rooms (*)')
    .eq('user_id', authPrincipal.id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const rooms = data.map(item => item.room)
  return NextResponse.json({ ok: true, rooms })
}

// POST: Create a new chat room
export async function POST(req: Request) {
  let authPrincipal
  try {
    authPrincipal = await requireAuth()
  } catch {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { name, member_ids } = await req.json()

  if (!name || !Array.isArray(member_ids)) {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 1. Create the room
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({ name, created_by: authPrincipal.id })
    .select()
    .single()

  if (roomError) {
    return NextResponse.json({ ok: false, error: roomError.message }, { status: 500 })
  }

  // 2. Add members
  const allMemberIds = Array.from(new Set([...member_ids, authPrincipal.id]))
  const memberRows = allMemberIds.map(userId => ({
    room_id: room.id,
    user_id: userId,
  }))

  const { error: memberError } = await supabase
    .from('chat_room_members')
    .insert(memberRows)

  if (memberError) {
    // Attempt to clean up the created room if member insertion fails
    await supabase.from('chat_rooms').delete().eq('id', room.id)
    return NextResponse.json({ ok: false, error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, room })
}
