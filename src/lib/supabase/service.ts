import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Return a client without explicit generics to avoid explicit any
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SERVICE_CONFIG_MISSING')
  }
  return createSupabaseClient(url, key)
}
