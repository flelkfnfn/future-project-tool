import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Return a loosely-typed client since we don't have generated types
export function createServiceClient(): SupabaseClient<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseClient<any>(url, key)
}
