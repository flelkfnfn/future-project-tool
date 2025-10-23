export type MailConfig = {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
  secure?: boolean
  requireTLS?: boolean
  ignoreTLS?: boolean
  rejectUnauthorized?: boolean
  connectionTimeoutMs?: number
  greetingTimeoutMs?: number
  socketTimeoutMs?: number
  pool?: boolean
}

function getConfig(): MailConfig {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '0')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || ''
  if (!host || !port || !from) {
    throw new Error('MAIL_CONFIG_MISSING')
  }
  const toBool = (v?: string) =>
    typeof v === 'string' ? ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()) : undefined
  const toNum = (v?: string) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }
  const secure = toBool(process.env.SMTP_SECURE)
  const requireTLS = toBool(process.env.SMTP_REQUIRE_TLS)
  const ignoreTLS = toBool(process.env.SMTP_IGNORE_TLS)
  const rejectUnauthorized =
    typeof process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'string'
      ? !(['0', 'false'].includes(process.env.SMTP_TLS_REJECT_UNAUTHORIZED.toLowerCase()))
      : undefined
  const connectionTimeoutMs = toNum(process.env.SMTP_TIMEOUT_MS) ?? 20000
  const greetingTimeoutMs = toNum(process.env.SMTP_GREETING_TIMEOUT_MS)
  const socketTimeoutMs = toNum(process.env.SMTP_SOCKET_TIMEOUT_MS)
  const pool = toBool(process.env.SMTP_POOL)
  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
    requireTLS,
    ignoreTLS,
    rejectUnauthorized,
    connectionTimeoutMs,
    greetingTimeoutMs,
    socketTimeoutMs,
    pool,
  }
}

export async function sendMail(to: string, subject: string, body: string) {
  const cfg = getConfig()
  // SMTP via nodemailer with fallbacks
  type TransportOpts = {
    host: string
    port: number
    secure?: boolean
    auth?: { user: string; pass: string }
    requireTLS?: boolean
    ignoreTLS?: boolean
    tls?: { rejectUnauthorized?: boolean; servername?: string }
    connectionTimeout?: number
    greetingTimeout?: number
    socketTimeout?: number
    pool?: boolean
    logger?: boolean
    debug?: boolean
  }
  type SendOpts = { from: string; to: string; subject: string; text: string }
  type NodemailerModule = {
    createTransport: (opts: TransportOpts) => { sendMail: (opts: SendOpts) => Promise<unknown> }
  }

  const nodemailer = (await import('nodemailer')) as unknown as NodemailerModule

  const base: TransportOpts = {
    host: cfg.host,
    port: cfg.port,
    secure: typeof cfg.secure === 'boolean' ? cfg.secure : cfg.port === 465,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    requireTLS: cfg.requireTLS,
    ignoreTLS: cfg.ignoreTLS,
    tls: typeof cfg.rejectUnauthorized === 'boolean' ? { rejectUnauthorized: cfg.rejectUnauthorized } : undefined,
    connectionTimeout: cfg.connectionTimeoutMs,
    greetingTimeout: cfg.greetingTimeoutMs,
    socketTimeout: cfg.socketTimeoutMs,
    pool: cfg.pool,
    logger: process.env.SMTP_DEBUG === '1',
    debug: process.env.SMTP_DEBUG === '1',
  }

  async function trySend(opts: TransportOpts) {
    const transport = nodemailer.createTransport(opts)
    await transport.sendMail({ from: cfg.from, to, subject, text: body })
  }

  try {
    await trySend(base)
    return
  } catch (e1) {
    try {
      const dns = await import('node:dns/promises')
      const looked = await dns.lookup(cfg.host, { family: 4 })
      const withIp: TransportOpts = {
        ...base,
        host: looked.address,
        tls: { ...(base.tls ?? {}), servername: cfg.host },
      }
      await trySend(withIp)
      return
    } catch (e2) {
      const isDev = process.env.NODE_ENV !== 'production'
      if (isDev) {
        try {
          const devFallback: TransportOpts = {
            ...base,
            secure: false,
            requireTLS: true,
            ignoreTLS: false,
            tls: { ...(base.tls ?? {}), rejectUnauthorized: false },
          }
          await trySend(devFallback)
          return
        } catch (e3) {
          throw e3
        }
      }
      throw e2
    }
  }
}
