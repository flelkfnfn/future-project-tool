import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 함수를 async로 변경
export async function createClient() {
  // cookies() 앞에 await 추가
  const cookieStore = await cookies()

  // 서버 컴포넌트에서는 쿠키를 읽기만 할 수 있으므로 'get' 핸들러만 제공합니다.
  // 인증(로그인/로그아웃) 기능을 구현할 때는 'set', 'remove'가 포함된 다른 방식이 필요합니다.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
