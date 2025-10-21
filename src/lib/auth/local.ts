import crypto from 'crypto'

const SALT_LEN = 16
const KEY_LEN = 64

export function hashPassword(password: string, salt?: string) {
  const s = salt || crypto.randomBytes(SALT_LEN).toString('hex')
  const key = crypto.scryptSync(password, s, KEY_LEN).toString('hex')
  return { salt: s, hash: key }
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const attempt = crypto.scryptSync(password, salt, KEY_LEN).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(hash, 'hex'))
}

