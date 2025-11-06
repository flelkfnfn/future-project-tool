import type { SupabaseClient } from '@supabase/supabase-js'

type PushSubRow = {
  id?: string
  endpoint: string
  p256dh: string
  auth: string
}

type WebPushLib = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
  ) => Promise<unknown>
}

async function getWebPush(): Promise<WebPushLib> {
  const mod = (await import('web-push')) as unknown as { default?: WebPushLib } & WebPushLib
  const webpush: WebPushLib = (mod && mod.default) ? mod.default : (mod as WebPushLib)
  const pub = process.env.PUSH_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY
  const priv = process.env.PUSH_VAPID_PRIVATE_KEY
  const subject = process.env.PUSH_SUBJECT || 'mailto:admin@example.com'
  if (!pub || !priv) {
    throw new Error('PUSH_VAPID_KEYS_MISSING')
  }
  webpush.setVapidDetails(subject, pub, priv)
  return webpush
}

export async function sendPushToUserIds(
  supabase: SupabaseClient,
  userIds: string[],
  payload: { title: string; body?: string; url?: string; icon?: string; badge?: string }
) {
  if (!Array.isArray(userIds) || userIds.length === 0) return { sent: 0 }
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (error || !Array.isArray(subs)) return { sent: 0 }

  return sendPushToSubscriptions(supabase, subs as PushSubRow[], payload)
}

export async function sendPushToSubscriptions(
  supabase: SupabaseClient,
  subs: PushSubRow[],
  payload: { title: string; body?: string; url?: string; icon?: string; badge?: string }
) {
  const webpush = await getWebPush()
  const body = JSON.stringify(payload)
  let sent = 0
  const toDelete: string[] = []

  await Promise.all(
    subs.map(async (s) => {
      const subscription: { endpoint: string; keys: { p256dh: string; auth: string } } = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      }
      try {
        await webpush.sendNotification(subscription, body)
        sent++
      } catch (e: unknown) {
        const status = (typeof e === 'object' && e !== null && 'statusCode' in e)
          ? (e as { statusCode?: number }).statusCode
          : undefined
        if (status === 404 || status === 410) {
          toDelete.push(s.endpoint)
        }
      }
    })
  )

  if (toDelete.length > 0) {
    try { await supabase.from('push_subscriptions').delete().in('endpoint', toDelete) } catch {}
  }
  return { sent, pruned: toDelete.length }
}
