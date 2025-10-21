export type MailConfig = {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
}

function getConfig(): MailConfig {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '0')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  if (!host || !port || !from) {
    throw new Error('MAIL_CONFIG_MISSING')
  }
  return { host, port, user, pass, from }
}

export async function sendMail(to: string, subject: string, body: string) {
  const cfg = getConfig()
  type TransportOpts = { host: string; port: number; secure?: boolean; auth?: { user: string; pass: string } }
  type SendOpts = { from: string; to: string; subject: string; text: string }
  type NodemailerModule = { createTransport: (opts: TransportOpts) => { sendMail: (opts: SendOpts) => Promise<unknown> } }

  const nodemailer = (await import('nodemailer')) as unknown as NodemailerModule
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  })
  await transport.sendMail({ from: cfg.from, to, subject, text: body })
}
