import crypto from 'crypto'

const base64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

export function sign(payload: Record<string, any>, secret: string, expSec = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { iat: now, exp: now + expSec, ...payload }
  const encHeader = base64url(JSON.stringify(header))
  const encPayload = base64url(JSON.stringify(body))
  const data = `${encHeader}.${encPayload}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verify(token: string, secret: string): { valid: boolean; payload?: any } {
  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false }
  const [h, p, s] = parts
  const data = `${h}.${p}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  if (sig !== s) return { valid: false }
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64').toString())
    if (payload.exp && Date.now() / 1000 > payload.exp) return { valid: false }
    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}

