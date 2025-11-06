'use client'

type Principal = { username?: string | null; email?: string | null }
export type MeResponse = { ok: boolean; principal?: Principal }

let memoryCache: { at: number; data: MeResponse } | null = null
const SS_KEY = 'me_cache_v1'

function now() { return Date.now() }

function readSession(): { at: number; data: MeResponse } | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; data: MeResponse }
    if (!parsed || typeof parsed.at !== 'number') return null
    return parsed
  } catch { return null }
}

function writeSession(entry: { at: number; data: MeResponse }) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(entry)) } catch {}
}

export async function fetchMeCached(ttlMs = 30000): Promise<MeResponse> {
  const t = now()
  if (memoryCache && t - memoryCache.at < ttlMs) return memoryCache.data
  const ss = readSession()
  if (ss && t - ss.at < ttlMs) {
    memoryCache = ss
    return ss.data
  }

  try {
    const res = await fetch('/api/me', { cache: 'no-store', credentials: 'include' })
    const data = (await res.json()) as MeResponse
    const entry = { at: now(), data }
    memoryCache = entry
    writeSession(entry)
    return data
  } catch {
    return { ok: false }
  }
}

