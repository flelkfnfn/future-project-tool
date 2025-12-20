'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Result =
  | {
      ok: true
      processed?: number
      sent?: number
      failed?: number
      errors?: Array<{ id: number; to: string; error: string }>
      cleared?: number | null
      clearError?: string | null
    }
  | { ok: false; error: string }

export default function SendEmailPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/cron/send-email', { method: 'GET', cache: 'no-store' })
        const j = (await res.json()) as Result
        if (!active) return
        setResult(j)
      } catch {
        if (!active) return
        setResult({ ok: false, error: 'REQUEST_FAILED' })
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">메일 발송</h1>

      {loading && <div className="text-gray-600 dark:text-white/70">발송 처리 중...</div>}

      {!loading && result && (
        <div className="space-y-3">
          {result && result.ok ? (
            <div className="glass-card p-4 border-emerald-500/20">
              <div className="font-semibold text-emerald-700 dark:text-emerald-200">발송 처리 완료</div>
              <div className="text-sm text-gray-700 dark:text-white/70">processed: {result.processed ?? 0}, sent: {result.sent ?? 0}, failed: {result.failed ?? 0}</div>
              {typeof result.cleared === 'number' && (
                <div className="text-sm text-gray-700 dark:text-white/70">email_outbox cleared: {result.cleared}</div>
              )}
              {result.clearError && (
                <div className="text-sm text-rose-700 dark:text-rose-200">email_outbox 삭제 실패: {result.clearError}</div>
              )}
              {result.errors && result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-700 dark:text-white/70">에러 상세 보기</summary>
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-white/70">{JSON.stringify(result.errors, null, 2)}</pre>
                </details>
              )}
            </div>
          ) : (
            <div className="glass-card p-4 border-rose-500/25">
              <div className="font-semibold text-rose-700 dark:text-rose-200">발송 실패</div>
              <div className="text-sm text-gray-700 dark:text-white/70">{('ok' in result && !result.ok) ? result.error : 'UNKNOWN_ERROR'}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link href="/notices" className="btn btn-neutral">공지사항으로 돌아가기</Link>
      </div>
    </main>
  )
}
