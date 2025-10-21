// Minimal Supabase Database type to satisfy generics
// Replace with generated types if available
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export type Database = {
  public: {
    Tables: Record<string, unknown>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, string>
    CompositeTypes: Record<string, unknown>
  }
}
