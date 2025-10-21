import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth/session'

export async function GET() {
  try {
    const auth = await getAuth()
    return NextResponse.json({ authenticated: auth.authenticated, principal: auth.principal ?? null })
  } catch (e) {
    return NextResponse.json({ authenticated: false, principal: null }, { status: 200 })
  }
}

